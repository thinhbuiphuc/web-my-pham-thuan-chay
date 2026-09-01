const Promotion = require("../models/Promotion");
const Product = require("../models/Product");

/**
 * (Admin) Xem toan bo chuong trinh khuyen mai
 * GET /api/promotions
 */
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("productId", "name sku")
      .sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach khuyen mai thanh cong",
      data: promotions,
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
 * (Admin) Them chuong trinh khuyen mai moi cho 1 san pham
 * POST /api/promotions
 * Body: { productId, name, discountPercent, startDate, endDate }
 */
exports.createPromotion = async (req, res) => {
  try {
    const { productId, name, discountPercent, startDate, endDate, usageLimit } =
      req.body;

    if (!productId || !name) {
      return res.status(400).json({
        success: false,
        message: "Vui long chon San pham va nhap Ten chuong trinh khuyen mai",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    const promotion = await Promotion.create({
      productId,
      name,
      discountPercent,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      usageLimit: usageLimit || null,
    });

    const populated = await promotion.populate("productId", "name sku");

    return res.status(201).json({
      success: true,
      message: "Them khuyen mai thanh cong",
      data: populated,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
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
 * (Admin) Sua chuong trinh khuyen mai
 * PUT /api/promotions/:id
 */
exports.updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("productId", "name sku");

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay khuyen mai",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat khuyen mai thanh cong",
      data: promotion,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay khuyen mai",
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
 * (Admin) Xoa chuong trinh khuyen mai
 * DELETE /api/promotions/:id
 */
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay khuyen mai",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa khuyen mai thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay khuyen mai",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
