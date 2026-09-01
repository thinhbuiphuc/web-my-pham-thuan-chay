const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  getBrands,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// UC01, UC04: Xem danh sach / chi tiet san pham - khong can dang nhap
// Luu y: "/brands" phai dat truoc "/:id" de Express khong hieu nham "brands" la 1 id
router.get("/", getProducts);
router.get("/brands", getBrands);
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProductById);

// UC08: Quan ly san pham - chi Admin
router.post("/", protect, requireAdmin, createProduct);
router.put("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

module.exports = router;
