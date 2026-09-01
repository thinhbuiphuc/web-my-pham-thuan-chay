const mongoose = require("mongoose");

/**
 * Collection: carts
 * Gio hang luu server-side (thay the localStorage o frontend) - quan he 1-1 voi User
 */
const cartItemSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: { updatedAt: "updatedAt", createdAt: false } }
);

module.exports = mongoose.model("Cart", cartSchema);
