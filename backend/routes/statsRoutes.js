const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  exportExcel,
  exportPdf,
} = require("../controllers/statsController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Admin: thong ke tong quan cho Dashboard
router.get("/dashboard", protect, requireAdmin, getDashboardStats);

// Admin: xuat bao cao Excel/PDF
router.get("/export/excel", protect, requireAdmin, exportExcel);
router.get("/export/pdf", protect, requireAdmin, exportPdf);

module.exports = router;
