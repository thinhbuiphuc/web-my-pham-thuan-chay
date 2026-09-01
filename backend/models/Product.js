const mongoose = require("mongoose");

/**
 * Collection: products
 * Danh muc my pham thuan chay - phuc vu UC01, UC04
 * Truong ingredientsINCI la input truc tiep cho AI Consultant Service (UC05, UC06)
 */
const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Ten san pham la bat buoc"],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Gia ban khong duoc am"],
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, "So luong ton kho phai >= 0"],
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    targetSkinTypes: {
      type: [String],
      enum: ["da_dau", "da_kho", "da_hon_hop", "da_nhay_cam"],
      default: [],
    },
    ingredientsINCI: {
      type: [String],
      default: [],
    },
    isVegan: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    volume: {
      type: String,
      trim: true,
    },
    origin: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
