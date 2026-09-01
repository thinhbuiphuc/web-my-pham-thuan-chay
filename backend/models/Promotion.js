const mongoose = require("mongoose");

/**
 * Collection: promotions
 * Khuyen mai gan vao 1 san pham (Product-Promotion 1-n, FK dat o phia Promotion)
 */
const promotionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Ten chuong trinh khuyen mai la bat buoc"],
    trim: true,
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  // Dieu kien su dung: gioi han so luong san pham duoc ap dung gia giam
  // trong ca chuong trinh (de trong/null = khong gioi han)
  usageLimit: {
    type: Number,
    min: 1,
    default: null,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Promotion", promotionSchema);
