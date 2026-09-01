const Order = require("../models/Order");
const Product = require("../models/Product");
const PaymentMethod = require("../models/PaymentMethod");
const OrderStatus = require("../models/OrderStatus");
const Promotion = require("../models/Promotion");
const { getActivePromotionsMap, applyDiscount } = require("../utils/promotion");

/**
 * UC03 - Dat hang
 * POST /api/orders
 * Body: { recipientName, phoneNumber, shippingAddress, items: [{ productId, quantity }] }
 */
exports.createOrder = async (req, res) => {
  try {
    const { recipientName, phoneNumber, shippingAddress, items, paymentMethodId } =
      req.body;

    if (!recipientName || !phoneNumber || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap day du Nguoi nhan, So dien thoai va Dia chi giao hang",
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "Vui long chon phuong thuc thanh toan",
      });
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Phuong thuc thanh toan khong hop le",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Don hang phai co it nhat 1 san pham",
      });
    }

    // Lay gia va kiem tra ton kho tu du lieu that trong DB, khong tin gia client gui len
    const orderItems = [];
    let totalAmount = 0;

    const promotionsMap = await getActivePromotionsMap(
      items.map((item) => item.productId)
    );

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Khong tim thay san pham voi id ${item.productId}`,
        });
      }

      const quantity = Number(item.quantity);
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `So luong san pham "${product.name}" khong hop le`,
        });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `San pham "${product.name}" chi con ${product.stockQuantity} trong kho`,
        });
      }

      // Tinh gia theo khuyen mai dang hoat dong (neu co) tai thoi diem dat
      // hang - khong dung gia goc de tranh khach bi tinh tien sai so voi gia
      // da giam hien thi tren giao dien
      const { discountedPrice } = applyDiscount(product, promotionsMap);

      orderItems.push({
        productId: product._id,
        quantity,
        priceAtPurchase: discountedPrice,
      });
      totalAmount += discountedPrice * quantity;

      // Neu san pham nay dang duoc ap dung 1 khuyen mai, tang usedCount de
      // theo doi dieu kien gioi han so luot ap dung
      const appliedPromo = promotionsMap[product._id.toString()];
      if (appliedPromo) {
        await Promotion.findByIdAndUpdate(appliedPromo._id, {
          $inc: { usedCount: quantity },
        });
      }

      product.stockQuantity -= quantity;
      await product.save();
    }

    // Gan trang thai don hang mac dinh la trang thai co sortOrder nho nhat (buoc dau quy trinh)
    const defaultStatus = await OrderStatus.findOne().sort({ sortOrder: 1 });
    if (!defaultStatus) {
      return res.status(500).json({
        success: false,
        message: "He thong chua cau hinh trang thai don hang, vui long lien he quan tri vien",
      });
    }

    const order = await Order.create({
      customerId: req.user.id,
      recipientName,
      phoneNumber,
      shippingAddress,
      items: orderItems,
      totalAmount,
      paymentMethodId,
      orderStatusId: defaultStatus._id,
    });

    return res.status(201).json({
      success: true,
      message: "Dat hang thanh cong",
      data: order,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * UC03 - Xem lich su don hang cua chinh minh
 * GET /api/orders/my
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate("items.productId", "name sku images price")
      .populate("paymentMethodId", "name")
      .populate("orderStatusId", "name sortOrder")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach don hang thanh cong",
      data: orders,
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
 * UC03 - Khach hang tu huy don hang cua chinh minh
 * PUT /api/orders/:id/cancel
 * Chi cho huy khi don con o trang thai dau (Cho xac nhan - chua vao quy
 * trinh xu ly/van chuyen). Khac voi deleteOrder (Admin, xoa hang han) - o day
 * chi DOI trang thai sang "Da huy", giu lai don lam lich su cho khach xem.
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    if (String(order.customerId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen huy don hang nay",
      });
    }

    const firstStatus = await OrderStatus.findOne().sort({ sortOrder: 1 });
    if (!firstStatus || String(order.orderStatusId) !== String(firstStatus._id)) {
      return res.status(409).json({
        success: false,
        message:
          "Chi co the huy don hang khi con o trang thai Cho xac nhan (chua duoc xu ly/van chuyen)",
      });
    }

    const cancelledStatus = await OrderStatus.findOne({ name: "Đã hủy" });
    if (!cancelledStatus) {
      return res.status(500).json({
        success: false,
        message: "He thong chua cau hinh trang thai Da huy, vui long lien he quan tri vien",
      });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    order.orderStatusId = cancelledStatus._id;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name sku images price")
      .populate("paymentMethodId", "name")
      .populate("orderStatusId", "name sortOrder");

    return res.status(200).json({
      success: true,
      message: "Huy don hang thanh cong, da hoan lai ton kho",
      data: populatedOrder,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xem toan bo don hang trong he thong
 * GET /api/orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "fullName email phone")
      .populate("items.productId", "name sku images price")
      .populate("paymentMethodId", "name")
      .populate("orderStatusId", "name sortOrder")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach don hang thanh cong",
      data: orders,
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
 * (Admin) Xoa vinh vien 1 don hang, hoan lai ton kho da tru luc dat hang
 * DELETE /api/orders/:id
 * Chi cho xoa don dang o trang thai dau (Cho xac nhan) - dung nghiep vu TMDT that
 * (don da xu ly phai giu lai lam chung tu).
 */
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "orderStatusId",
      "name"
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    const firstStatus = await OrderStatus.findOne().sort({ sortOrder: 1 });
    if (
      !firstStatus ||
      String(order.orderStatusId._id) !== String(firstStatus._id)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Chi co the xoa don hang dang o trang thai dau (Cho xac nhan).",
      });
    }

    // Don da o trang thai "Da huy" thi ton kho da duoc hoan lai tu truoc roi
    // (qua cancelOrder hoac updateOrderStatus) - khong hoan lai lan nua de
    // tranh cong don ton kho sai (bug da phat hien va sua ngay 2026-07-28)
    if (order.orderStatusId?.name !== "Đã hủy") {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } }
        );
      }
    }

    await Order.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Xoa don hang thanh cong, da hoan lai ton kho",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Cap nhat trang thai xu ly / trang thai giao hang cua don hang
 * PUT /api/orders/:id/status
 * Body: { orderStatusId, deliveryStatus }
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatusId, deliveryStatus } = req.body;
    const updateData = {};

    if (orderStatusId) updateData.orderStatusId = orderStatusId;
    if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;

    // Neu Admin doi trang thai sang "Da huy" (tu 1 trang thai khac, tranh
    // hoan kho lap neu bam Luu ma khong doi gi) thi tu dong hoan lai ton kho
    // - dong bo voi cancelOrder (khach tu huy) de deleteOrder ben duoi biet
    // chac chan da hoan kho hay chua dua vao status hien tai
    if (orderStatusId) {
      const [oldOrder, newStatus] = await Promise.all([
        Order.findById(req.params.id).select("items orderStatusId"),
        OrderStatus.findById(orderStatusId),
      ]);

      if (
        oldOrder &&
        newStatus?.name === "Đã hủy" &&
        String(oldOrder.orderStatusId) !== String(orderStatusId)
      ) {
        const oldStatus = await OrderStatus.findById(oldOrder.orderStatusId);
        if (oldStatus?.name !== "Đã hủy") {
          for (const item of oldOrder.items) {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stockQuantity: item.quantity } }
            );
          }
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customerId", "fullName email phone")
      .populate("items.productId", "name sku images price")
      .populate("paymentMethodId", "name")
      .populate("orderStatusId", "name sortOrder");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat trang thai don hang thanh cong",
      data: order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay don hang",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
