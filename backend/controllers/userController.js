const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

/**
 * (Admin) Xem danh sach toan bo khach hang/tai khoan
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach tai khoan thanh cong",
      data: users,
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
 * (Admin) Khoa/mo khoa tai khoan hoac doi vai tro (customer <-> admin)
 * PUT /api/users/:id
 * Body: { isLocked, role }
 */
exports.updateUser = async (req, res) => {
  try {
    const { isLocked, role } = req.body;
    const updateData = {};

    if (isLocked !== undefined) updateData.isLocked = isLocked;
    if (role !== undefined) updateData.role = role;

    if (req.params.id === req.user.id && (role === "customer" || isLocked === true)) {
      return res.status(400).json({
        success: false,
        message: "Khong the tu ha quyen hoac tu khoa tai khoan cua chinh minh",
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat tai khoan thanh cong",
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

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
 * (Admin) Xoa vinh vien 1 tai khoan - chi cho phep neu tai khoan chua tung dat don hang,
 * tranh de lai tham chieu hong (Order.customerId khong con ton tai)
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Khong the tu xoa tai khoan cua chinh minh",
      });
    }

    const hasOrder = await Order.exists({ customerId: req.params.id });
    if (hasOrder) {
      return res.status(409).json({
        success: false,
        message: "Tai khoan nay da co don hang, khong the xoa - hay dung Khoa thay vi Xoa",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    await Cart.deleteOne({ userId: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Xoa tai khoan thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
