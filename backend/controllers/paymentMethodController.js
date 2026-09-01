const PaymentMethod = require("../models/PaymentMethod");

/**
 * Xem danh sach phuong thuc thanh toan dang hoat dong (phuc vu dropdown Checkout)
 * GET /api/payment-methods
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ isActive: true });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach phuong thuc thanh toan thanh cong",
      data: paymentMethods,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
