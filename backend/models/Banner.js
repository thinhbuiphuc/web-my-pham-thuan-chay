const mongoose = require("mongoose");

/**
 * Collection: banners
 * Banner hien thi o trang chu (carousel), Admin quan ly them/sua/xoa/an
 */
const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tieu de banner la bat buoc"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Anh banner la bat buoc"],
      trim: true,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("Banner", bannerSchema);
