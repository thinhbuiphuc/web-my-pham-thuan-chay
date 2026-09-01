const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { getActivePromotionsMap, applyDiscount } = require("../utils/promotion");

/**
 * Tim gio hang cua user, tao moi neu chua co (moi user chi co dung 1 Cart - unique userId)
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

/**
 * Populate items.productId roi gan them gia sau giam (neu co khuyen mai dang
 * hoat dong) cho tung san pham trong gio - dam bao gio hang luon hien dung
 * gia thuc te se tinh tien khi dat hang.
 */
const buildCartResponse = async (cart) => {
  await cart.populate("items.productId", "name price images stockQuantity");
  const cartObj = cart.toObject();

  const productIds = cartObj.items.map((item) => item.productId._id);
  const promotionsMap = await getActivePromotionsMap(productIds);
  cartObj.items = cartObj.items.map((item) => ({
    ...item,
    productId: applyDiscount(item.productId, promotionsMap),
  }));

  return cartObj;
};

/**
 * Xem gio hang cua chinh minh
 * GET /api/cart
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Lay gio hang thanh cong",
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
 * Them san pham vao gio hang (da co thi cong don so luong)
 * POST /api/cart/items
 * Body: { productId, quantity }
 */
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    if (!productId || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Vui long chon san pham va so luong hop le",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty });
    }

    await cart.save();
    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Them vao gio hang thanh cong",
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
 * Sua so luong 1 san pham trong gio hang (ghi de, khong cong don)
 * PUT /api/cart/items/:productId
 * Body: { quantity }
 */
exports.updateItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const qty = Number(req.body.quantity);

    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "So luong phai la so nguyen duong",
      });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "San pham khong co trong gio hang",
      });
    }

    item.quantity = qty;
    await cart.save();
    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cap nhat so luong thanh cong",
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
 * Xoa 1 san pham khoi gio hang
 * DELETE /api/cart/items/:productId
 */
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user.id);

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Xoa san pham khoi gio hang thanh cong",
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
 * Xoa toan bo gio hang (dung sau khi dat hang thanh cong)
 * DELETE /api/cart
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Xoa gio hang thanh cong",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
