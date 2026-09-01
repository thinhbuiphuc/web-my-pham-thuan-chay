"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import Header from "@/components/layout/Header";
import { API_BASE_URL, formatVND, getToken } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";

const SKIN_TYPE_LABELS = {
  da_dau: "Da dầu",
  da_kho: "Da khô",
  da_hon_hop: "Da hỗn hợp",
  da_nhay_cam: "Da nhạy cảm",
};

/**
 * ProductDetail - UC01: xem chi tiet 1 san pham + them vao gio
 * Goi GET {API_BASE_URL}/api/products/:id
 */
export default function ProductDetail({ productId }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || "Không tìm thấy sản phẩm");
          return;
        }

        setProduct(json.data);
        setSelectedImageIndex(0);
      } catch (err) {
        setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/reviews/product/${productId}`
        );
        const json = await res.json();
        if (json.success) setReviews(json.data);
      } catch {
        // bo qua loi tai danh gia, khong chan trang chi tiet san pham
      }
    };

    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/${productId}/related`
        );
        const json = await res.json();
        if (json.success) setRelatedProducts(json.data);
      } catch {
        // bo qua loi tai san pham lien quan, khong chan trang chi tiet san pham
      }
    };

    const checkWishlist = async () => {
      const wishlist = await getWishlist();
      const ids = (wishlist.productIds || []).map((p) => p._id || p);
      setIsWishlisted(ids.includes(productId));
    };

    fetchProduct();
    fetchReviews();
    fetchRelated();
    checkWishlist();
  }, [productId]);

  const handleToggleWishlist = async () => {
    if (!getToken()) {
      setCartError("Vui lòng đăng nhập để dùng danh sách yêu thích");
      return;
    }

    if (isWishlisted) {
      await removeFromWishlist(productId);
      setIsWishlisted(false);
    } else {
      await addToWishlist(productId);
      setIsWishlisted(true);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!getToken()) {
      setCartError("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    const result = await addToCart(product, quantity);
    if (!result.success) {
      setCartError(result.message || "Không thể thêm vào giỏ hàng");
      return;
    }

    setCartError("");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-stone-500 hover:text-stone-700 mb-4"
        >
          ← Quay lại
        </button>

        {loading ? (
          <p className="text-stone-500 text-sm">Đang tải sản phẩm...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        ) : (
          product && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-square rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden">
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[selectedImageIndex] || product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">🌿</span>
                  )}
                </div>

                {product.images?.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                          idx === selectedImageIndex
                            ? "border-emerald-500"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - ảnh ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl font-semibold text-stone-800">
                    {product.name}
                  </h1>
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    aria-label="Yêu thích"
                    className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center shrink-0 hover:bg-stone-50 transition"
                  >
                    <Heart
                      size={18}
                      className={isWishlisted ? "fill-red-500 text-red-500" : "text-stone-400"}
                    />
                  </button>
                </div>
                {product.brand && (
                  <p className="text-sm text-stone-400 mt-1">
                    {product.brand}
                  </p>
                )}
                {product.discountPercent > 0 ? (
                  <div className="flex items-center gap-3 mt-4">
                    <p className="text-2xl font-semibold text-emerald-700">
                      {formatVND(product.discountedPrice)}
                    </p>
                    <p className="text-stone-400 line-through">
                      {formatVND(product.price)}
                    </p>
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-xs font-semibold">
                      -{product.discountPercent}%
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold text-emerald-700 mt-4">
                    {formatVND(product.price)}
                  </p>
                )}
                <p className="text-sm text-stone-500 mt-1">
                  {product.stockQuantity > 0
                    ? `Còn ${product.stockQuantity} sản phẩm trong kho`
                    : "Hết hàng"}
                </p>

                {(product.volume || product.origin) && (
                  <p className="text-sm text-stone-500 mt-1">
                    {product.volume && <>Dung tích: {product.volume}</>}
                    {product.volume && product.origin && " · "}
                    {product.origin && <>Xuất xứ: {product.origin}</>}
                  </p>
                )}

                {product.categoryId?.name && (
                  <p className="text-xs text-stone-400 mt-1">
                    Danh mục: {product.categoryId.name}
                  </p>
                )}

                {product.targetSkinTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {product.targetSkinTypes.map((type) => (
                      <span
                        key={type}
                        className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full"
                      >
                        {SKIN_TYPE_LABELS[type] || type}
                      </span>
                    ))}
                  </div>
                )}

                {product.description && (
                  <p className="text-sm text-stone-600 mt-4 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {product.ingredientsINCI?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-stone-700 mb-1.5">
                      Thành phần (INCI)
                    </p>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {product.ingredientsINCI.join(", ")}
                    </p>
                  </div>
                )}

                {cartError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">
                    {cartError}
                  </div>
                )}

                <div className="mt-auto pt-6 flex items-center gap-3">
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-10 text-stone-500 hover:bg-stone-50"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm text-stone-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(product.stockQuantity || 1, q + 1)
                        )
                      }
                      className="w-9 h-10 text-stone-500 hover:bg-stone-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={product.stockQuantity === 0}
                    onClick={handleAddToCart}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {added ? "Đã thêm vào giỏ ✓" : "Thêm vào giỏ"}
                  </button>
                </div>

                <Link
                  href="/cart"
                  className="text-center text-sm text-emerald-700 hover:text-emerald-800 mt-3"
                >
                  Xem giỏ hàng →
                </Link>
              </div>
            </div>
          )
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-6">
            <h2 className="font-medium text-stone-800 mb-4">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp._id}
                  href={`/products/${rp._id}`}
                  className={`rounded-2xl shadow-sm p-3 flex flex-col hover:border-emerald-300 transition ${
                    rp.discountPercent > 0
                      ? "bg-red-50/40 border border-red-200"
                      : "bg-white border border-stone-200"
                  }`}
                >
                  <div className="relative aspect-square rounded-xl bg-stone-100 mb-2 flex items-center justify-center overflow-hidden">
                    {rp.images?.[0] ? (
                      <img
                        src={rp.images[0]}
                        alt={rp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🌿</span>
                    )}
                    {rp.discountPercent > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-semibold">
                        -{rp.discountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-800 line-clamp-2">{rp.name}</p>
                  {rp.discountPercent > 0 ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatVND(rp.discountedPrice)}
                      </span>
                      <span className="text-xs text-stone-400 line-through">
                        {formatVND(rp.price)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-emerald-700 mt-1">
                      {formatVND(rp.price)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {product && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mt-6">
            <h2 className="font-medium text-stone-800 mb-4">
              Đánh giá sản phẩm ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-stone-500 mb-6">
                Chưa có đánh giá nào cho sản phẩm này.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 mb-6">
                {reviews.map((review) => (
                  <div key={review._id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-800">
                        {review.userId?.fullName || "Khách hàng"}
                      </span>
                      <span className="text-amber-500 text-sm">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-stone-600 mt-1">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-stone-400 border-t border-stone-100 pt-4">
              Muốn đánh giá sản phẩm này? Vào{" "}
              <Link href="/orders" className="text-emerald-700 hover:underline">
                Đơn hàng của tôi
              </Link>{" "}
              và bấm &quot;Đánh giá&quot; trên đơn đã ở trạng thái &quot;Đã giao&quot;.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
