"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { formatVND, getStoredUser } from "@/lib/api";
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  getCartTotal,
  getEffectivePrice,
} from "@/lib/cart";

export const CHECKOUT_SELECTED_KEY = "checkoutSelectedIds";

/**
 * CartPage - gio hang luu server-side qua API Cart. Chi quan ly xem/sua so
 * luong/xoa/chon san pham; buoc dat hang that (dia chi + thanh toan) da tach
 * sang trang rieng /checkout (giong luong Gio hang -> Thanh toan cua Shopee).
 */
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [user, setUser] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = async () => {
    const previousIds = new Set(items.map((item) => item.productId._id));
    const cart = await getCart();
    const newItems = cart.items || [];
    setItems(newItems);
    // San pham moi (chua tung xuat hien trong gio truoc do request nay) mac
    // dinh duoc chon san; san pham da bi xoa khoi gio thi tu loai khoi danh
    // sach da chon; san pham cu giu nguyen trang thai chon/bo chon truoc do
    setSelectedIds((prev) => {
      const next = new Set();
      newItems.forEach((item) => {
        const id = item.productId._id;
        if (!previousIds.has(id) || prev.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  };

  const toggleSelectItem = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === items.length
        ? new Set()
        : new Set(items.map((item) => item.productId._id))
    );
  };

  const selectedItems = items.filter((item) =>
    selectedIds.has(item.productId._id)
  );

  useEffect(() => {
    const init = async () => {
      setCartLoading(true);
      await refreshCart();
      setCartLoading(false);
    };
    init();
    setUser(getStoredUser());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuantityChange = async (productId, quantity) => {
    await updateCartQuantity(productId, quantity);
    await refreshCart();
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
    await refreshCart();
  };

  const handleProceedToCheckout = () => {
    setError("");

    if (!user) {
      setError("Vui lòng đăng nhập để đặt hàng");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng");
      return;
    }

    sessionStorage.setItem(
      CHECKOUT_SELECTED_KEY,
      JSON.stringify(selectedItems.map((item) => item.productId._id))
    );
    router.push("/checkout");
  };

  const total = getCartTotal(selectedItems);

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6">
          Giỏ hàng
        </h1>

        {!user ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
            Vui lòng{" "}
            <Link href="/login" className="font-medium underline">
              đăng nhập
            </Link>{" "}
            để xem và sử dụng giỏ hàng.
          </div>
        ) : cartLoading ? (
          <p className="text-stone-500 text-sm">Đang tải giỏ hàng...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm">Giỏ hàng đang trống.</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
            >
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 divide-y divide-stone-100">
              <label className="p-4 flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
                />
                Chọn tất cả ({selectedItems.length}/{items.length})
              </label>

              {items.map((item) => (
                <div
                  key={item.productId._id}
                  className="p-4 flex items-center gap-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.productId._id)}
                    onChange={() => toggleSelectItem(item.productId._id)}
                    className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400 shrink-0"
                  />
                  <div className="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.productId.images?.[0] ? (
                      <img
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🌿</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 font-medium truncate">
                      {item.productId.name}
                    </p>
                    {item.productId.discountPercent > 0 ? (
                      <p className="text-sm mt-0.5 flex items-center gap-1.5">
                        <span className="text-emerald-700">
                          {formatVND(item.productId.discountedPrice)}
                        </span>
                        <span className="text-stone-400 text-xs line-through">
                          {formatVND(item.productId.price)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-emerald-700 text-sm mt-0.5">
                        {formatVND(item.productId.price)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          item.productId._id,
                          item.quantity - 1
                        )
                      }
                      className="w-9 h-10 text-stone-500 hover:bg-stone-50"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuantityChange(
                          item.productId._id,
                          item.quantity + 1
                        )
                      }
                      className="w-9 h-10 text-stone-500 hover:bg-stone-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-28 text-right font-medium text-stone-800 shrink-0">
                    {formatVND(getEffectivePrice(item.productId) * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId._id)}
                    className="text-stone-400 hover:text-red-600 text-sm shrink-0"
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4 lg:sticky lg:top-24">
              <h2 className="font-medium text-stone-800">Tóm tắt đơn hàng</h2>

              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">
                  Đã chọn ({selectedItems.length} sản phẩm)
                </span>
                <span className="text-emerald-700 font-semibold text-lg">
                  {formatVND(total)}
                </span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={selectedItems.length === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Mua hàng ({selectedItems.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
