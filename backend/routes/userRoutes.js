const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Admin: quan ly tai khoan khach hang (xem danh sach, khoa/mo khoa, doi vai tro, xoa)
router.get("/", protect, requireAdmin, getAllUsers);
router.put("/:id", protect, requireAdmin, updateUser);
router.delete("/:id", protect, requireAdmin, deleteUser);

module.exports = router;
