const Banner = require("../models/Banner");

/**
 * Xem cac banner dang bat (isActive), sap theo sortOrder - dung o trang chu
 * GET /api/banners
 */
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach banner thanh cong",
      data: banners,
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
 * (Admin) Xem toan bo banner (ca dang tat)
 * GET /api/banners/all
 */
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach banner thanh cong",
      data: banners,
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
 * (Admin) Them banner moi
 * POST /api/banners
 */
exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Them banner thanh cong",
      data: banner,
    });
  } catch (error) {
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
 * (Admin) Sua banner (kem bat/tat isActive)
 * PUT /api/banners/:id
 */
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay banner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat banner thanh cong",
      data: banner,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay banner",
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
 * (Admin) Xoa banner
 * DELETE /api/banners/:id
 */
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay banner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa banner thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay banner",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
