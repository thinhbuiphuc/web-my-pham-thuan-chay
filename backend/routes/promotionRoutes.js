const express = require("express");
const router = express.Router();
const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Admin: quan ly ma giam gia
router.get("/", protect, requireAdmin, getPromotions);
router.post("/", protect, requireAdmin, createPromotion);
router.put("/:id", protect, requireAdmin, updatePromotion);
router.delete("/:id", protect, requireAdmin, deletePromotion);

module.exports = router;
