const express = require("express");
const router = express.Router();
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

// Gio hang - tat ca deu can dang nhap
router.get("/", protect, getCart);
router.post("/items", protect, addItem);
router.put("/items/:productId", protect, updateItemQuantity);
router.delete("/items/:productId", protect, removeItem);
router.delete("/", protect, clearCart);

module.exports = router;
