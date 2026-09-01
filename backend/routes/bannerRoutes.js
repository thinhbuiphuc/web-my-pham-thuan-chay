const express = require("express");
const router = express.Router();
const {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Xem banner dang bat - khong can dang nhap, dung o trang chu
router.get("/", getActiveBanners);

// Admin: quan ly banner ("/all" phai dat truoc de khong bi hieu nham thanh id)
router.get("/all", protect, requireAdmin, getAllBanners);
router.post("/", protect, requireAdmin, createBanner);
router.put("/:id", protect, requireAdmin, updateBanner);
router.delete("/:id", protect, requireAdmin, deleteBanner);

module.exports = router;
