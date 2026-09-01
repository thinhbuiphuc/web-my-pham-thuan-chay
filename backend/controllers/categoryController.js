const Category = require("../models/Category");
const Product = require("../models/Product");

/**
 * Xem danh sach danh muc san pham
 * GET /api/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach danh muc thanh cong",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * Xem chi tiet 1 danh muc
 * GET /api/categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lay chi tiet danh muc thanh cong",
      data: category,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Them danh muc moi
 * POST /api/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Them danh muc thanh cong",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ten danh muc nay da ton tai, vui long chon ten khac",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Sua danh muc
 * PUT /api/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat danh muc thanh cong",
      data: category,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ten danh muc nay da ton tai, vui long chon ten khac",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xoa danh muc - chan neu con san pham nao dang dung danh muc nay
 * DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const productCount = await Product.countDocuments({
      categoryId: req.params.id,
    });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Con ${productCount} san pham dang dung danh muc nay, khong the xoa`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa danh muc thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh muc",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
