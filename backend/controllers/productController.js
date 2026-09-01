const Product = require("../models/Product");
const Promotion = require("../models/Promotion");
const Review = require("../models/Review");
const Order = require("../models/Order");
const OrderStatus = require("../models/OrderStatus");
const { getActivePromotionsMap, applyDiscount } = require("../utils/promotion");

/**
 * Tinh diem danh gia trung binh + so luot danh gia cho 1 danh sach san pham,
 * tra ve dang map { productId: { avgRating, reviewCount } } de gan vao response.
 */
async function getRatingMap(productIds) {
  const reviews = await Review.find({
    productId: { $in: productIds },
    isHidden: { $ne: true },
  });
  const map = {};
  reviews.forEach((r) => {
    const key = r.productId.toString();
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += r.rating;
    map[key].count += 1;
  });

  const result = {};
  Object.keys(map).forEach((key) => {
    result[key] = {
      avgRating: Math.round((map[key].total / map[key].count) * 10) / 10,
      reviewCount: map[key].count,
    };
  });
  return result;
}

/**
 * Tinh tong so luong da ban cho 1 danh sach san pham, dua tren cac don hang
 * CHUA bi huy (bo qua status "Da huy") - tra ve map { productId: soldCount }.
 */
async function getSoldCountMap(productIds) {
  const cancelledStatus = await OrderStatus.findOne({ name: "Đã hủy" });
  const orderFilter = {};
  if (cancelledStatus) {
    orderFilter.orderStatusId = { $ne: cancelledStatus._id };
  }

  const orders = await Order.find(orderFilter).select("items");
  const map = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.productId.toString();
      if (productIds.some((id) => id.toString() === key)) {
        map[key] = (map[key] || 0) + item.quantity;
      }
    });
  });
  return map;
}

/**
 * UC01 / UC04 - Xem danh sach san pham (co tim kiem + loc)
 * GET /api/products?name=...&sku=...&skinType=...&minPrice=...&maxPrice=...&categoryId=...
 * (giu them "keyword" de tuong thich nguoc - tim theo ca ten lan SKU trong 1 tham so)
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      keyword,
      name,
      sku,
      skinType,
      minPrice,
      maxPrice,
      categoryId,
      sort,
      onSale,
      brand,
      minRating,
    } = req.query;
    const filter = {};

    // Loc theo danh muc
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Loc theo thuong hieu (khop chinh xac, lay tu danh sach thuong hieu co san)
    if (brand) {
      filter.brand = brand;
    }

    // Tim rieng theo ten san pham (khong phan biet hoa/thuong)
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // Tim rieng theo ma SKU (khong phan biet hoa/thuong)
    if (sku) {
      filter.sku = { $regex: sku, $options: "i" };
    }

    // Tuong thich nguoc: tim theo ten HOAC SKU trong 1 tham so duy nhat
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { sku: { $regex: keyword, $options: "i" } },
      ];
    }

    // Loc theo loai da phu hop
    if (skinType) {
      filter.targetSkinTypes = skinType;
    }

    // Loc theo khoang gia
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Chi hien san pham dang co khuyen mai dang hoat dong
    if (onSale === "true") {
      const now = new Date();
      const activePromotions = await Promotion.find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).select("productId");
      filter._id = { $in: activePromotions.map((p) => p.productId) };
    }

    // rating_desc/bestseller_desc can du lieu tu 2 collection khac (Review/
    // Order) nen sap xep thu cong trong JS sau khi lay du lieu, thay vi dung
    // Mongo .sort() (chi sap xep truc tiep duoc tren field co san cua Product)
    const needsManualSort = sort === "rating_desc" || sort === "bestseller_desc";

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .sort(needsManualSort ? { createdAt: -1 } : sortOption);

    const productIds = products.map((p) => p._id);

    // Gan gia sau giam (neu co khuyen mai dang hoat dong) cho tung san pham
    const promotionsMap = await getActivePromotionsMap(productIds);
    const ratingMap = await getRatingMap(productIds);
    const soldCountMap = await getSoldCountMap(productIds);

    let productsWithDiscount = products.map((p) => {
      const withDiscount = applyDiscount(p, promotionsMap);
      const rating = ratingMap[p._id.toString()] || { avgRating: 0, reviewCount: 0 };
      return {
        ...withDiscount,
        avgRating: rating.avgRating,
        reviewCount: rating.reviewCount,
        soldCount: soldCountMap[p._id.toString()] || 0,
      };
    });

    if (sort === "rating_desc") {
      productsWithDiscount.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sort === "bestseller_desc") {
      productsWithDiscount.sort((a, b) => b.soldCount - a.soldCount);
    }

    // Loc theo diem danh gia toi thieu - can du lieu avgRating vua gan o tren
    // (tu Review, collection khac) nen loc sau khi lay du lieu, khong loc
    // truc tiep bang Mongo filter duoc
    if (minRating) {
      const minRatingNum = Number(minRating);
      productsWithDiscount = productsWithDiscount.filter(
        (p) => p.avgRating >= minRatingNum
      );
    }

    return res.status(200).json({
      success: true,
      message: "Lay danh sach san pham thanh cong",
      data: productsWithDiscount,
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
 * Lay danh sach cac thuong hieu dang co san pham (khong trung, bo qua rong) -
 * dung de hien dropdown loc theo thuong hieu o trang danh sach san pham
 * GET /api/products/brands
 */
exports.getBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brand", {
      brand: { $nin: [null, ""] },
    });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach thuong hieu thanh cong",
      data: brands.sort(),
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
 * UC01 - Xem chi tiet 1 san pham
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId",
      "name"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    const promotionsMap = await getActivePromotionsMap([product._id]);
    const productWithDiscount = applyDiscount(product, promotionsMap);

    return res.status(200).json({
      success: true,
      message: "Lay chi tiet san pham thanh cong",
      data: productWithDiscount,
    });
  } catch (error) {
    // ID sai dinh dang ObjectId cung roi vao day (CastError)
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
 * Goi y san pham lien quan cho trang Chi tiet san pham - ket hop 2 nguon:
 * 1) "Khach mua cung" - quet cac don hang (chua huy) co chua san pham nay,
 *    dem tan suat cac san pham KHAC xuat hien chung trong cung don, sap theo
 *    tan suat giam dan.
 * 2) "Cung danh muc" - dung lam nen/fallback khi (1) chua du du lieu don
 *    hang that de goi y (VD DB moi, it don hang).
 * Tron ca 2, uu tien "khach mua cung" truoc, dien cho con thieu bang "cung
 * danh muc" (khong trung lap), khong can them field DB nao moi.
 * GET /api/products/:id/related?limit=6
 */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Number(req.query.limit) || 6;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    // 1) Khach mua cung: dem tan suat san pham khac xuat hien chung don voi id nay
    const cancelledStatus = await OrderStatus.findOne({ name: "Đã hủy" });
    const orderFilter = { "items.productId": id };
    if (cancelledStatus) {
      orderFilter.orderStatusId = { $ne: cancelledStatus._id };
    }
    const ordersWithProduct = await Order.find(orderFilter).select("items");

    const frequencyMap = {};
    ordersWithProduct.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId.toString();
        if (key === id) return;
        frequencyMap[key] = (frequencyMap[key] || 0) + 1;
      });
    });

    const boughtTogetherIds = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);

    // 2) Cung danh muc: dien them cho du limit, loai san pham da co o (1) va chinh san pham dang xem
    let relatedIds = [...boughtTogetherIds];
    if (relatedIds.length < limit && product.categoryId) {
      const sameCategoryProducts = await Product.find({
        categoryId: product.categoryId,
        _id: { $ne: id, $nin: relatedIds },
      })
        .select("_id")
        .limit(limit - relatedIds.length);
      relatedIds = relatedIds.concat(sameCategoryProducts.map((p) => p._id.toString()));
    }

    const relatedProductsRaw = await Product.find({
      _id: { $in: relatedIds },
    }).populate("categoryId", "name");

    // Giu dung thu tu uu tien da tinh o tren (Mongo $in khong dam bao thu tu)
    const orderedProducts = relatedIds
      .map((relId) => relatedProductsRaw.find((p) => p._id.toString() === relId))
      .filter(Boolean);

    const promotionsMap = await getActivePromotionsMap(orderedProducts.map((p) => p._id));
    const relatedWithDiscount = orderedProducts.map((p) => applyDiscount(p, promotionsMap));

    return res.status(200).json({
      success: true,
      message: "Lay danh sach san pham lien quan thanh cong",
      data: relatedWithDiscount,
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
 * UC08 (Admin) - Them san pham moi
 * POST /api/products
 */
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Them san pham thanh cong",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "SKU nay da ton tai, vui long chon SKU khac",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
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
 * UC08 (Admin) - Cap nhat san pham
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat san pham thanh cong",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "SKU nay da ton tai, vui long chon SKU khac",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
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
 * UC08 (Admin) - Xoa san pham
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay san pham",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa san pham thanh cong",
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
