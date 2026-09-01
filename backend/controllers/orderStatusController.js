const OrderStatus = require("../models/OrderStatus");

/**
 * Xem danh sach trang thai don hang, sap xep theo quy trinh xu ly
 * GET /api/order-statuses
 */
exports.getOrderStatuses = async (req, res) => {
  try {
    const orderStatuses = await OrderStatus.find().sort({ sortOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach trang thai don hang thanh cong",
      data: orderStatuses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
