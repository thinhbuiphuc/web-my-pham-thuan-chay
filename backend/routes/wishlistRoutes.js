const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addItem,
  removeItem,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

// Danh sach yeu thich - tat ca deu can dang nhap
router.get("/", protect, getWishlist);
router.post("/items", protect, addItem);
router.delete("/items/:productId", protect, removeItem);

module.exports = router;
