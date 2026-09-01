const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviewsByProduct,
  getMyReviews,
  getAllReviews,
  toggleReviewVisibility,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Xem danh gia - khong can dang nhap; Tao danh gia - can dang nhap + da mua hang
router.get("/product/:productId", getReviewsByProduct);
router.get("/mine", protect, getMyReviews);
router.post("/", protect, createReview);

// Admin: xem toan bo / duyet-an / xoa danh gia khong phu hop
router.get("/", protect, requireAdmin, getAllReviews);
router.patch("/:id/visibility", protect, requireAdmin, toggleReviewVisibility);
router.delete("/:id", protect, requireAdmin, deleteReview);

module.exports = router;
