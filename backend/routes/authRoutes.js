const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// UC02: Dang ky / Dang nhap
router.post("/register", register);
router.post("/login", login);

// Quan ly tai khoan ca nhan - can dang nhap
router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// So dia chi giao hang - can dang nhap
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

module.exports = router;
