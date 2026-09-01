"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { Heart } from "lucide-react";
import { API_BASE_URL, formatVND, getToken } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { getCompareIds, toggleCompareId } from "@/lib/compare";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/wishlist";

// Khop voi enum targetSkinTypes trong models/Product.js
const SKIN_TYPES = [
  { value: "", label: "Tất cả loại da" },
  { value: "da_dau", label: "Da dầu" },
  { value: "da_kho", label: "Da khô" },
  { value: "da_hon_hop", label: "Da hỗn hợp" },
  { value: "da_nhay_cam", label: "Da nhạy cảm" },
];

// Preset khoang gia kieu Shopee - chon nhanh thay vi nhap tay 2 o rieng.
// 2 muc cuoi la sap xep theo gia (khong phai loc khoang gia).
const PRICE_RANGES = [
  { value: "", label: "Tất cả mức giá", type: "range", min: "", max: "" },
  { value: "0-100000", label: "Dưới 100.000đ", type: "range", min: "", max: "100000" },
  { value: "100000-200000", label: "100.000đ - 200.000đ", type: "range", min: "100000", max: "200000" },
  { value: "200000-300000", label: "200.000đ - 300.000đ", type: "range", min: "200000", max: "300000" },
  { value: "300000-500000", label: "300.000đ - 500.000đ", type: "range", min: "300000", max: "500000" },
  { value: "500000-1000000", label: "500.000đ - 1.000.000đ", type: "range", min: "500000", max: "1000000" },
  { value: "1000000-3000000", label: "1.000.000đ - 3.000.000đ", type: "range", min: "1000000", max: "3000000" },
  { value: "price_asc", label: "Giá tăng dần", type: "sort", sort: "price_asc" },
  { value: "price_desc", label: "Giá giảm dần", type: "sort", sort: "price_desc" },
  { value: "rating_desc", label: "Đánh giá cao nhất", type: "sort", sort: "rating_desc" },
  { value: "bestseller_desc", label: "Bán chạy nhất", type: "sort", sort: "bestseller_desc" },
];

// Loc theo diem danh gia toi thieu (khac voi sap xep "Danh gia cao nhat" o
// tren - loc se an han san pham khong dat sao, khong chi doi vi tri)
const MIN_RATINGS = [
  { value: "", label: "Mọi đánh giá" },
  { value: "4", label: "Từ 4 sao trở lên" },
  { value: "3", label: "Từ 3 sao trở lên" },
];

/**
 * ProductList - UC01/UC04: xem danh sach san pham, tim kiem + loc
 * Goi GET {API_BASE_URL}/api/products?keyword=&skinType=&minPrice=&maxPrice=
 */
export default function ProductList() {
  const [filters, setFilters] = useState({
    name: "",
    sku: "",
    skinType: "",
    categoryId: "",
    priceRange: "",
    onSale: false,
    brand: "",
    minRating: "",
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [compareError, setCompareError] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);
  const [banners, setBanners] = useState([]);

  const fetchProducts = async (activeFilters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (activeFilters.name) params.set("name", activeFilters.name);
      if (activeFilters.sku) params.set("sku", activeFilters.sku);
      if (activeFilters.skinType) params.set("skinType", activeFilters.skinType);
      if (activeFilters.categoryId) params.set("categoryId", activeFilters.categoryId);
      if (activeFilters.onSale) params.set("onSale", "true");
      if (activeFilters.brand) params.set("brand", activeFilters.brand);
      if (activeFilters.minRating) params.set("minRating", activeFilters.minRating);

      const range = PRICE_RANGES.find((r) => r.value === activeFilters.priceRange);
      if (range?.type === "range") {
        if (range.min) params.set("minPrice", range.min);
        if (range.max) params.set("maxPrice", range.max);
      } else if (range?.type === "sort") {
        params.set("sort", range.sort);
      }

      const res = await fetch(
        `${API_BASE_URL}/api/products?${params.toString()}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Không tải được danh sách sản phẩm");
        return;
      }

      setProducts(json.data);
    } catch (err) {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(filters);

    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/products/brands`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBrands(json.data);
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/banners`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBanners(json.data);
      })
      .catch(() => {});

    setCompareIds(getCompareIds());
    const syncCompare = () => setCompareIds(getCompareIds());
    window.addEventListener("compareUpdated", syncCompare);

    const loadWishlist = async () => {
      const wishlist = await getWishlist();
      setWishlistIds((wishlist.productIds || []).map((p) => p._id || p));
    };
    loadWishlist();
    window.addEventListener("wishlistUpdated", loadWishlist);

    return () => {
      window.removeEventListener("compareUpdated", syncCompare);
      window.removeEventListener("wishlistUpdated", loadWishlist);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleCompare = (productId) => {
    const result = toggleCompareId(productId);
    if (!result.success) {
      setCompareError(result.message);
      setTimeout(() => setCompareError(""), 2000);
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!getToken()) {
      setError("Vui lòng đăng nhập để dùng danh sách yêu thích");
      return;
    }

    if (wishlistIds.includes(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchProducts(filters);
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6">
          Sản phẩm
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 mb-6 flex flex-col gap-3"
        >
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              value={filters.name}
              onChange={handleChange}
              placeholder="Tìm theo tên sản phẩm"
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
            <input
              name="sku"
              value={filters.sku}
              onChange={handleChange}
              placeholder="Tìm theo mã sản phẩm"
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              name="skinType"
              value={filters.skinType}
              onChange={handleChange}
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            >
              {SKIN_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleChange}
              className="flex-1 min-w-[230px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              name="priceRange"
              value={filters.priceRange}
              onChange={handleChange}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            >
              {PRICE_RANGES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              name="brand"
              value={filters.brand}
              onChange={handleChange}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleChange}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            >
              {MIN_RATINGS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              name="onSale"
              checked={filters.onSale}
              onChange={handleChange}
              className="w-4 h-4 rounded border-stone-300 text-red-600 focus:ring-red-400"
            />
            Chỉ xem sản phẩm đang giảm giá
          </label>

          <button
            type="submit"
            className="py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
          >
            Tìm kiếm
          </button>
        </form>

        {banners.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            {banners.map((banner) => {
              const content = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              );
              return (
                <div
                  key={banner._id}
                  className="relative w-full h-48 sm:h-64 md:h-72 rounded-2xl overflow-hidden shadow-sm border border-stone-200"
                >
                  {banner.linkUrl ? (
                    <Link href={banner.linkUrl}>{content}</Link>
                  ) : (
                    content
                  )}
                  <p className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-sm px-4 py-2">
                    {banner.title}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-stone-500 text-sm">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p className="text-stone-500 text-sm">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className={`rounded-2xl shadow-sm p-5 flex flex-col transition hover:shadow-md ${
                  product.discountPercent > 0
                    ? "bg-red-50/40 border border-red-200"
                    : "bg-white border border-stone-200"
                }`}
              >
                <div className="relative aspect-square rounded-xl bg-stone-100 mb-4 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
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
                    onClick={() => handleToggleWishlist(product._id)}
                    aria-label="Yêu thích"
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition"
                  >
                    <Heart
                      size={16}
                      className={
                        wishlistIds.includes(product._id)
                          ? "fill-red-500 text-red-500"
                          : "text-stone-400"
                      }
                    />
                  </button>
                  {product.sku && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 text-stone-500 text-[11px] font-medium tracking-wide border border-stone-200">
                      {product.sku}
                    </span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-semibold">
                      -{product.discountPercent}%
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-stone-500 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(product._id)}
                    onChange={() => handleToggleCompare(product._id)}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  So sánh
                </label>
                <h2 className="font-medium text-stone-800 line-clamp-2">
                  {product.name}
                </h2>
                {product.brand && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    {product.brand}
                  </p>
                )}
                {product.reviewCount > 0 && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    ★ {product.avgRating} ({product.reviewCount})
                  </p>
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

      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg px-4 py-3 flex items-center justify-center gap-4 z-40">
          <span className="text-sm text-stone-600">
            Đã chọn {compareIds.length}/4 sản phẩm để so sánh
          </span>
          {compareError && (
            <span className="text-sm text-red-600">{compareError}</span>
          )}
          <Link
            href="/compare"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              compareIds.length < 2
                ? "bg-stone-200 text-stone-400 pointer-events-none"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            So sánh ngay
          </Link>
        </div>
      )}
    </main>
  );
}
