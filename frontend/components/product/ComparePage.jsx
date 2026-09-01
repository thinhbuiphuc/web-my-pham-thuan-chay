"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { API_BASE_URL, formatVND, getToken } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { getCompareIds, removeCompareId } from "@/lib/compare";

const SKIN_TYPE_LABELS = {
  da_dau: "Da dầu",
  da_kho: "Da khô",
  da_hon_hop: "Da hỗn hợp",
  da_nhay_cam: "Da nhạy cảm",
};

/**
 * ComparePage - so sanh nhieu san pham canh nhau (III-2 nang cao), doc danh
 * sach ID da chon tu sessionStorage (frontend/lib/compare.js), khong can API
 * rieng - goi lai dung GET /api/products/:id nhu trang chi tiet.
 */
export default function ComparePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const fetchCompareProducts = async () => {
      setLoading(true);
      setError("");
      const ids = getCompareIds();

      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`${API_BASE_URL}/api/products/${id}`).then((res) => res.json())
          )
        );
        setProducts(results.filter((r) => r.success).map((r) => r.data));
      } catch {
        setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }
    };

    fetchCompareProducts();
  }, []);

  const handleRemove = (productId) => {
    removeCompareId(productId);
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const handleAddToCart = async (product) => {
    if (!getToken()) {
      setError("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6">
          So sánh sản phẩm
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-stone-500 text-sm">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm mb-4">
              Chưa có sản phẩm nào được chọn để so sánh.
            </p>
            <Link
              href="/products"
              className="text-emerald-700 hover:text-emerald-800 text-sm font-medium"
            >
              ← Quay lại trang sản phẩm để chọn
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-stone-200">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="p-4 w-40 align-top text-stone-400 font-medium">
                    Sản phẩm
                  </td>
                  {products.map((p) => (
                    <td
                      key={p._id}
                      className="p-4 align-top min-w-[220px] border-l border-stone-100"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemove(p._id)}
                        className="text-xs text-red-600 hover:underline mb-2"
                      >
                        Bỏ khỏi so sánh ✕
                      </button>
                      <div className="aspect-square rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden mb-2">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">🌿</span>
                        )}
                      </div>
                      <Link
                        href={`/products/${p._id}`}
                        className="font-medium text-stone-800 hover:text-emerald-700 line-clamp-2"
                      >
                        {p.name}
                      </Link>
                    </td>
                  ))}
                </tr>

                <tr className="bg-stone-50">
                  <td className="p-4 text-stone-400 font-medium">Thương hiệu</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.brand || "—"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 text-stone-400 font-medium">Giá</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100">
                      {p.discountPercent > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-semibold">
                            {formatVND(p.discountedPrice)}
                          </span>
                          <span className="text-xs text-stone-400 line-through">
                            {formatVND(p.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          {formatVND(p.price)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="bg-stone-50">
                  <td className="p-4 text-stone-400 font-medium">Đánh giá</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.reviewCount > 0 ? `★ ${p.avgRating} (${p.reviewCount})` : "Chưa có đánh giá"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 text-stone-400 font-medium">Danh mục</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.categoryId?.name || "—"}
                    </td>
                  ))}
                </tr>

                <tr className="bg-stone-50">
                  <td className="p-4 text-stone-400 font-medium">Loại da phù hợp</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.targetSkinTypes?.length > 0
                        ? p.targetSkinTypes
                            .map((t) => SKIN_TYPE_LABELS[t] || t)
                            .join(", ")
                        : "—"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 text-stone-400 font-medium">Dung tích</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.volume || "—"}
                    </td>
                  ))}
                </tr>

                <tr className="bg-stone-50">
                  <td className="p-4 text-stone-400 font-medium">Xuất xứ</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.origin || "—"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 text-stone-400 font-medium">Tồn kho</td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100 text-stone-700">
                      {p.stockQuantity > 0 ? `Còn ${p.stockQuantity}` : "Hết hàng"}
                    </td>
                  ))}
                </tr>

                <tr className="bg-stone-50">
                  <td className="p-4 text-stone-400 font-medium align-top">
                    Thành phần (INCI)
                  </td>
                  {products.map((p) => (
                    <td
                      key={p._id}
                      className="p-4 border-l border-stone-100 text-xs text-stone-500 align-top"
                    >
                      {p.ingredientsINCI?.length > 0
                        ? p.ingredientsINCI.join(", ")
                        : "—"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4"></td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 border-l border-stone-100">
                      <button
                        type="button"
                        disabled={p.stockQuantity === 0}
                        onClick={() => handleAddToCart(p)}
                        className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {addedId === p._id ? "Đã thêm ✓" : "Thêm vào giỏ"}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
