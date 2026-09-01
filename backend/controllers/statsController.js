const fs = require("fs");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// PDFKit mac dinh dung font Helvetica (chi ho tro Latin-1), khong hien duoc
// tieng Viet co dau - phai nhung them font he thong ho tro Unicode. Windows
// luon co san Arial, neu server chay tren OS khac se fallback ve font mac
// dinh (mat dau tieng Viet nhung khong crash).
const VIETNAMESE_FONT_PATH = "C:/Windows/Fonts/arial.ttf";
const VIETNAMESE_FONT_BOLD_PATH = "C:/Windows/Fonts/arialbd.ttf";
const hasVietnameseFont = fs.existsSync(VIETNAMESE_FONT_PATH);
const Order = require("../models/Order");
const OrderStatus = require("../models/OrderStatus");
const Product = require("../models/Product");
const User = require("../models/User");
const { formatVND } = require("../utils/format");

/**
 * Tinh toan toan bo so lieu thong ke tu du lieu Order/Product/User co san -
 * dung chung cho ca API JSON (Dashboard) lan xuat file Excel/PDF, tranh trung
 * lap logic. Khong luu san so lieu, luon tinh truc tiep tu DB.
 */
async function computeStats() {
  const cancelledStatus = await OrderStatus.findOne({ name: "Đã hủy" });
  const notCancelledFilter = cancelledStatus
    ? { orderStatusId: { $ne: cancelledStatus._id } }
    : {};

  const validOrders = await Order.find(notCancelledFilter)
    .select("items totalAmount createdAt orderStatusId")
    .populate("orderStatusId", "name");

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = validOrders.length;

  const totalProducts = await Product.countDocuments();
  const totalCustomers = await User.countDocuments({ role: "customer" });

  const allOrders = await Order.find()
    .select("orderStatusId")
    .populate("orderStatusId", "name sortOrder");
  const statusCountMap = {};
  allOrders.forEach((o) => {
    const name = o.orderStatusId?.name || "Khong xac dinh";
    statusCountMap[name] = (statusCountMap[name] || 0) + 1;
  });
  const ordersByStatus = Object.entries(statusCountMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Doanh thu 7 ngay gan nhat (tinh theo ngay dat hang, khong tinh don huy)
  const revenueByDay = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayRevenue = validOrders
      .filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Khong dung toISOString() de lay nhan ngay - no quy doi ve UTC nen se
    // bi lech 1 ngay so voi ngay dia phuong (server chay gio Viet Nam
    // UTC+7) da dung de tinh khoang dayStart/dayEnd o tren
    const label = `${dayStart.getFullYear()}-${String(
      dayStart.getMonth() + 1
    ).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`;

    revenueByDay.push({ date: label, revenue: dayRevenue });
  }

  const soldCountMap = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      const key = item.productId.toString();
      soldCountMap[key] = (soldCountMap[key] || 0) + item.quantity;
    });
  });
  const topProductIds = Object.entries(soldCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const topProductsRaw = await Product.find({
    _id: { $in: topProductIds },
  }).select("name sku images price");
  const topProducts = topProductIds
    .map((id) => {
      const product = topProductsRaw.find((p) => p._id.toString() === id);
      if (!product) return null;
      return { ...product.toObject(), soldCount: soldCountMap[id] };
    })
    .filter(Boolean);

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    totalCustomers,
    ordersByStatus,
    revenueByDay,
    topProducts,
  };
}

/**
 * (Admin) Thong ke tong quan cho Dashboard
 * GET /api/stats/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await computeStats();

    return res.status(200).json({
      success: true,
      message: "Lay thong ke thanh cong",
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xuat bao cao Excel gom 3 sheet: Don hang, Doanh thu theo ngay, Khach hang
 * GET /api/stats/export/excel
 */
exports.exportExcel = async (req, res) => {
  try {
    const stats = await computeStats();

    const orders = await Order.find()
      .populate("customerId", "fullName email")
      .populate("orderStatusId", "name")
      .sort({ createdAt: -1 });

    const customers = await User.find({ role: "customer" })
      .select("fullName email phone isLocked createdAt")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Leafmood";
    workbook.created = new Date();

    // Sheet 1: Don hang
    const orderSheet = workbook.addWorksheet("Đơn hàng");
    orderSheet.columns = [
      { header: "Mã đơn", key: "id", width: 26 },
      { header: "Khách hàng", key: "customer", width: 24 },
      { header: "Email", key: "email", width: 26 },
      { header: "Ngày đặt", key: "createdAt", width: 20 },
      { header: "Tổng tiền (đ)", key: "totalAmount", width: 16 },
      { header: "Trạng thái", key: "status", width: 18 },
    ];
    orders.forEach((order) => {
      orderSheet.addRow({
        id: order._id.toString(),
        customer: order.customerId?.fullName || "Không xác định",
        email: order.customerId?.email || "—",
        createdAt: new Date(order.createdAt).toLocaleString("vi-VN"),
        totalAmount: order.totalAmount,
        status: order.orderStatusId?.name || "—",
      });
    });
    orderSheet.getRow(1).font = { bold: true };

    // Sheet 2: Doanh thu theo ngay (7 ngay gan nhat)
    const revenueSheet = workbook.addWorksheet("Doanh thu theo ngày");
    revenueSheet.columns = [
      { header: "Ngày", key: "date", width: 16 },
      { header: "Doanh thu (đ)", key: "revenue", width: 18 },
    ];
    stats.revenueByDay.forEach((day) => {
      revenueSheet.addRow(day);
    });
    revenueSheet.getRow(1).font = { bold: true };
    revenueSheet.addRow({});
    revenueSheet.addRow({ date: "Tổng doanh thu (chưa huỷ)", revenue: stats.totalRevenue });

    // Sheet 3: Khach hang
    const customerSheet = workbook.addWorksheet("Khách hàng");
    customerSheet.columns = [
      { header: "Họ tên", key: "fullName", width: 24 },
      { header: "Email", key: "email", width: 26 },
      { header: "Số điện thoại", key: "phone", width: 16 },
      { header: "Trạng thái", key: "locked", width: 14 },
      { header: "Ngày tạo tài khoản", key: "createdAt", width: 20 },
    ];
    customers.forEach((c) => {
      customerSheet.addRow({
        fullName: c.fullName || "—",
        email: c.email,
        phone: c.phone || "—",
        locked: c.isLocked ? "Đã khoá" : "Hoạt động",
        createdAt: new Date(c.createdAt).toLocaleString("vi-VN"),
      });
    });
    customerSheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-${new Date().toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xuat bao cao PDF tom tat (doanh thu, don hang, top ban chay)
 * GET /api/stats/export/pdf
 */
exports.exportPdf = async (req, res) => {
  try {
    const stats = await computeStats();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-${new Date().toISOString().slice(0, 10)}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    if (hasVietnameseFont) {
      doc.registerFont("vn", VIETNAMESE_FONT_PATH);
      doc.registerFont(
        "vn-bold",
        fs.existsSync(VIETNAMESE_FONT_BOLD_PATH)
          ? VIETNAMESE_FONT_BOLD_PATH
          : VIETNAMESE_FONT_PATH
      );
      doc.font("vn");
    }

    doc.fontSize(18).text("Leafmood - Báo cáo thống kê", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#78716c")
      .text(`Xuất lúc: ${new Date().toLocaleString("vi-VN")}`, { align: "center" });
    doc.fillColor("#000000").moveDown(1.5);

    doc.fontSize(13).text("Tổng quan");
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Tổng doanh thu (chưa huỷ): ${formatVND(stats.totalRevenue)}`);
    doc.text(`Tổng đơn hàng (chưa huỷ): ${stats.totalOrders}`);
    doc.text(`Tổng sản phẩm đang bán: ${stats.totalProducts}`);
    doc.text(`Tổng khách hàng: ${stats.totalCustomers}`);
    doc.moveDown(1);

    doc.fontSize(13).text("Đơn hàng theo trạng thái");
    doc.moveDown(0.3);
    doc.fontSize(11);
    if (stats.ordersByStatus.length === 0) {
      doc.text("Chưa có đơn hàng nào.");
    } else {
      stats.ordersByStatus.forEach((s) => {
        doc.text(`${s.name}: ${s.count} đơn`);
      });
    }
    doc.moveDown(1);

    doc.fontSize(13).text("Doanh thu 7 ngày gần nhất");
    doc.moveDown(0.3);
    doc.fontSize(11);
    stats.revenueByDay.forEach((d) => {
      doc.text(`${d.date}: ${formatVND(d.revenue)}`);
    });
    doc.moveDown(1);

    doc.fontSize(13).text("Top 5 sản phẩm bán chạy");
    doc.moveDown(0.3);
    doc.fontSize(11);
    if (stats.topProducts.length === 0) {
      doc.text("Chưa có sản phẩm nào được bán.");
    } else {
      stats.topProducts.forEach((p, index) => {
        doc.text(`${index + 1}. ${p.name} - Đã bán ${p.soldCount}`);
      });
    }

    doc.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
