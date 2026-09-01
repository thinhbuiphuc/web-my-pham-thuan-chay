const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// UC03: Dat hang / Xem don hang / Tu huy don hang - can dang nhap
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrder);

// Admin: xem toan bo don hang / cap nhat trang thai xu ly / trang thai giao hang / xoa
router.get("/", protect, requireAdmin, getAllOrders);
router.put("/:id/status", protect, requireAdmin, updateOrderStatus);
router.delete("/:id", protect, requireAdmin, deleteOrder);

module.exports = router;
