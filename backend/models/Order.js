const mongoose = require("mongoose");

/**
 * Collection: orders
 * Quan ly don dat hang - phuc vu UC03, UC09
 */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtPurchase: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Don hang phai co it nhat 1 san pham",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    orderStatusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderStatus",
      required: true,
    },
    deliveryStatus: {
      type: String,
      trim: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("Order", orderSchema);
