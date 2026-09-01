const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const { getActivePromotionsMap, applyDiscount } = require("../utils/promotion");

/**
 * Tim wishlist cua user, tao moi neu chua co (moi user chi co dung 1 - unique userId)
 */
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, productIds: [] });
  }
  return wishlist;
};

/**
 * Populate productIds roi gan them gia sau giam (neu co khuyen mai dang hoat
 * dong) cho tung san pham - giong cach lam o Cart de hien dung gia thuc te.
 */
const buildWishlistResponse = async (wishlist) => {
  await wishlist.populate(
    "productIds",
    "name price images stockQuantity brand"
  );
  const wishlistObj = wishlist.toObject();

  const promotionsMap = await getActivePromotionsMap(
    wishlistObj.productIds.map((p) => p._id)
  );
  wishlistObj.productIds = wishlistObj.productIds.map((p) =>
    applyDiscount(p, promotionsMap)
  );

  return wishlistObj;
};

/**
 * Xem danh sach yeu thich cua chinh minh
 * GET /api/wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    const data = await buildWishlistResponse(wishlist);

    return res.status(200).json({
      success: true,
      message: "Lay danh sach yeu thich thanh cong",
      data,
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
 * Them 1 san pham vao danh sach yeu thich (bo qua neu da co san)
 * POST /api/wishlist/items
 * Body: { productId }
 */
exports.addItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Vui long chon san pham",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);
    const alreadyExists = wishlist.productIds.some(
      (id) => id.toString() === productId
    );

    if (!alreadyExists) {
      wishlist.productIds.push(productId);
      await wishlist.save();
    }

    const data = await buildWishlistResponse(wishlist);

    return res.status(200).json({
      success: true,
      message: "Them vao danh sach yeu thich thanh cong",
      data,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
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
 * Xoa 1 san pham khoi danh sach yeu thich
 * DELETE /api/wishlist/items/:productId
 */
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.user.id);

    wishlist.productIds = wishlist.productIds.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();
    const data = await buildWishlistResponse(wishlist);

    return res.status(200).json({
      success: true,
      message: "Xoa khoi danh sach yeu thich thanh cong",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
