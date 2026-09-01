const Promotion = require("../models/Promotion");

/**
 * Lay khuyen mai dang hoat dong (startDate <= hien tai <= endDate) cho 1 danh
 * sach san pham, tra ve dang map { productId: promotionDoc } de tra cuu nhanh.
 * Neu 1 san pham co nhieu khuyen mai dang hoat dong cung luc, lay khuyen mai
 * co % giam cao nhat.
 */
async function getActivePromotionsMap(productIds) {
  const now = new Date();
  const promotions = await Promotion.find({
    productId: { $in: productIds },
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  const map = {};
  promotions.forEach((promo) => {
    // Dieu kien su dung: bo qua khuyen mai da dung het gioi han so luot ap
    // dung (usageLimit null/undefined = khong gioi han, luon con hieu luc)
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      return;
    }

    const key = promo.productId.toString();
    if (!map[key] || promo.discountPercent > map[key].discountPercent) {
      map[key] = promo;
    }
  });
  return map;
}

/**
 * Gan them discountPercent/discountedPrice/promotionName vao 1 san pham (hoac
 * plain object co field price) dua theo map khuyen mai da lay o tren. Khong
 * co khuyen mai thi discountedPrice = price, discountPercent = 0.
 */
function applyDiscount(productDoc, promotionsMap) {
  const product = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  const promo = promotionsMap[product._id.toString()];

  if (promo) {
    product.discountPercent = promo.discountPercent;
    product.discountedPrice = Math.round(
      product.price * (1 - promo.discountPercent / 100)
    );
    product.promotionName = promo.name;
  } else {
    product.discountPercent = 0;
    product.discountedPrice = product.price;
  }

  return product;
}

module.exports = { getActivePromotionsMap, applyDiscount };
