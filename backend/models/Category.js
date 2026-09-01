const mongoose = require("mongoose");

/**
 * Collection: categories
 * Danh muc san pham - Product tham chieu toi Category qua categoryId (n-1)
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ten danh muc la bat buoc"],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);
