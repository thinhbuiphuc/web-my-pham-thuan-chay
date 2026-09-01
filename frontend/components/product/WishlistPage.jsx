"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import Header from "@/components/layout/Header";
import { formatVND, getToken } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";

/**
 * WishlistPage - UC nang cao III-5: danh sach san pham yeu thich cua khach hang
 * Goi GET/DELETE {API_BASE_URL}/api/wishlist - deu yeu cau dang nhap
 */
export default function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError("");
    if (!getToken()) {
      setError("Vui lòng đăng nhập để xem danh sách yêu thích");
      setLoading(false);
      return;
    }

    const wishlist = await getWishlist();
    setProducts(wishlist.productIds || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    await removeFromWishlist(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    setRemovingId(null);
  };

  const handleAddToCart = async (product) => {
    const result = await addToCart(product, 1);
    if (!result.success) {
      setError(result.message || "Không thể thêm vào giỏ hàng");
      return;
    }

    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6 flex items-center gap-2">
          <Heart className="text-red-500 fill-red-500" size={22} /> Sản phẩm yêu thích
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-stone-500 text-sm">Đang tải...</p>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm mb-4">
              Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.
            </p>
            <Link
              href="/products"
              className="text-emerald-700 hover:text-emerald-800 text-sm font-medium"
            >
              Khám phá sản phẩm →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {products.map((product) => (
              <div
                key={product._id}
                className={`rounded-2xl shadow-sm p-4 flex flex-col ${
                  product.discountPercent > 0
                    ? "bg-red-50/40 border border-red-200"
                    : "bg-white border border-stone-200"
                }`}
              >
                <div className="relative aspect-square rounded-xl bg-stone-100 mb-3 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🌿</span>
                  )}
                  <button
                    type="button"
                    disabled={removingId === product._id}
                    onClick={() => handleRemove(product._id)}
                    aria-label="Bỏ khỏi yêu thích"
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition disabled:opacity-50"
                  >
                    <Heart size={16} className="fill-red-500 text-red-500" />
                  </button>
                  {product.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-semibold">
                      -{product.discountPercent}%
                    </span>
                  )}
                </div>
                <h2 className="font-medium text-stone-800 line-clamp-2">
                  {product.name}
                </h2>
                {product.brand && (
                  <p className="text-xs text-stone-400 mt-0.5">{product.brand}</p>
                )}
                {product.discountPercent > 0 ? (
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-emerald-700 font-semibold">
                      {formatVND(product.discountedPrice)}
                    </p>
                    <p className="text-stone-400 text-xs line-through">
                      {formatVND(product.price)}
                    </p>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-semibold mt-2">
                    {formatVND(product.price)}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-1">
                  {product.stockQuantity > 0
                    ? `Còn ${product.stockQuantity} sản phẩm`
                    : "Hết hàng"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/products/${product._id}`}
                    className="flex-1 text-center py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition"
                  >
                    Xem chi tiết
                  </Link>
                  <button
                    type="button"
                    disabled={product.stockQuantity === 0}
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {addedId === product._id ? "Đã thêm ✓" : "Thêm vào giỏ"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
