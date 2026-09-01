const mongoose = require("mongoose");

/**
 * Collection: paymentmethods
 * Phuong thuc thanh toan - Order tham chieu toi PaymentMethod qua paymentMethodId
 */
const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ten phuong thuc thanh toan la bat buoc"],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
