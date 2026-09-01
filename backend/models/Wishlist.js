const mongoose = require("mongoose");

/**
 * Collection: wishlists
 * Danh sach san pham yeu thich - quan he 1-1 voi User, tuong tu Cart nhung
 * khong co so luong (chi luu productId, khong dat hang truc tiep tu day)
 */
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    productIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
  },
  { timestamps: { updatedAt: "updatedAt", createdAt: false } }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
