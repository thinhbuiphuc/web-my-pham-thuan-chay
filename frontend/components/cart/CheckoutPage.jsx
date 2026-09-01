"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { API_BASE_URL, authHeaders, formatVND, getStoredUser, handleAuthError } from "@/lib/api";
import {
  getCart,
  removeFromCart,
  clearCart,
  getCartTotal,
  getEffectivePrice,
} from "@/lib/cart";
import { CHECKOUT_SELECTED_KEY } from "./CartPage";

// Thong tin nhan chuyen khoan demo - chua tich hop cong thanh toan that (Momo/VNPay...),
// khach tu chuyen khoan ngoai he thong, Admin doi chieu va cap nhat trang thai don thu cong
const DEMO_BANK_INFO = {
  bankName: "MB Bank (demo)",
  accountNumber: "0333 666 999",
  accountHolder: "CUA HANG THUAN CHAY BEAUTY",
};

/**
 * CheckoutPage - buoc dat hang that (dia chi + phuong thuc thanh toan +
 * xac nhan), tach rieng khoi trang Gio hang (/cart) giong luong cua Shopee:
 * chon san pham trong gio -> bam Mua hang -> sang trang Thanh toan rieng.
 * Danh sach san pham dang dat lay tu sessionStorage (CHECKOUT_SELECTED_KEY,
 * do CartPage luu truoc khi chuyen trang) doi chieu voi gio hang that.
 */
export default function CheckoutPage() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transferInfo, setTransferInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const init = async () => {
      setCartLoading(true);
      const cart = await getCart();
      const allItems = cart.items || [];

      let selectedIds = [];
      try {
        selectedIds = JSON.parse(
          sessionStorage.getItem(CHECKOUT_SELECTED_KEY) || "[]"
        );
      } catch {
        selectedIds = [];
      }

      const idSet = new Set(selectedIds);
      setItems(allItems.filter((item) => idSet.has(item.productId._id)));
      setCartLoading(false);
    };
    init();

    const storedUser = getStoredUser();
    setUser(storedUser);
    if (storedUser) {
      // localStorage chi luu fullName/email, can goi API de lay so dia chi da luu
      fetch(`${API_BASE_URL}/api/auth/me`, { headers: { ...authHeaders() } })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            const userAddresses = json.data?.addresses || [];
            setAddresses(userAddresses);
            const defaultAddress =
              userAddresses.find((a) => a.isDefault) || userAddresses[0];
            if (defaultAddress) setSelectedAddressId(defaultAddress._id);
          }
        })
        .catch(() => {});
    }

    fetch(`${API_BASE_URL}/api/payment-methods`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setPaymentMethods(json.data);
          setPaymentMethodId(json.data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const handleReviewOrder = (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Vui lòng đăng nhập để đặt hàng");
      return;
    }

    if (items.length === 0) {
      setError("Không có sản phẩm nào được chọn để đặt hàng");
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!selectedAddress) {
      setError("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (!paymentMethodId) {
      setError("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          recipientName: selectedAddress.recipientName,
          phoneNumber: selectedAddress.phone,
          shippingAddress: selectedAddress.addressText,
          paymentMethodId,
          items: items.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
          })),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setError(json.message || "Đặt hàng thất bại, vui lòng thử lại");
        setShowConfirm(false);
        return;
      }

      // Chi xoa dung nhung san pham vua dat khoi gio hang, giu lai cac san
      // pham chua chon (khac voi truoc day xoa sach toan bo gio hang)
      const cart = await getCart();
      if (items.length === (cart.items || []).length) {
        await clearCart();
      } else {
        await Promise.all(
          items.map((item) => removeFromCart(item.productId._id))
        );
      }
      sessionStorage.removeItem(CHECKOUT_SELECTED_KEY);

      setShowConfirm(false);
      setSuccess("Đặt hàng thành công! Bạn có thể xem lại ở mục Đơn hàng.");

      const selectedMethod = paymentMethods.find((pm) => pm._id === paymentMethodId);
      if (selectedMethod && !selectedMethod.name.includes("COD")) {
        setTransferInfo({
          orderCode: json.data._id.slice(-6).toUpperCase(),
          methodName: selectedMethod.name,
        });
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal(items);

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          {!success && (
            <Link
              href="/cart"
              className="text-sm text-stone-500 hover:text-emerald-700"
            >
              ← Giỏ hàng
            </Link>
          )}
          <h1 className="text-2xl font-semibold text-stone-800">
            Thanh toán
          </h1>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-6">
            {success}{" "}
            <Link href="/orders" className="font-medium underline">
              Xem đơn hàng
            </Link>
          </div>
        )}

        {transferInfo && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 mb-6 text-sm">
            <p className="font-medium text-stone-800 mb-2">
              Hướng dẫn thanh toán ({transferInfo.methodName})
            </p>
            <p className="text-stone-600 mb-3">
              Vui lòng chuyển khoản đúng số tiền đơn hàng tới thông tin bên
              dưới. Đơn hàng sẽ được xác nhận thủ công ngay sau khi cửa hàng
              nhận được thanh toán.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 space-y-1 text-stone-700">
              <p>
                Ngân hàng: <span className="font-medium">{DEMO_BANK_INFO.bankName}</span>
              </p>
              <p>
                Số tài khoản:{" "}
                <span className="font-medium">{DEMO_BANK_INFO.accountNumber}</span>
              </p>
              <p>
                Chủ tài khoản:{" "}
                <span className="font-medium">{DEMO_BANK_INFO.accountHolder}</span>
              </p>
              <p>
                Nội dung chuyển khoản:{" "}
                <span className="font-medium">
                  THANH TOAN DH{transferInfo.orderCode}
                </span>
              </p>
            </div>
          </div>
        )}

        {!user ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
            Vui lòng{" "}
            <Link href="/login" className="font-medium underline">
              đăng nhập
            </Link>{" "}
            để đặt hàng.
          </div>
        ) : success ? null : cartLoading ? (
          <p className="text-stone-500 text-sm">Đang tải...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm">
              Không có sản phẩm nào được chọn để đặt hàng.
            </p>
            <Link
              href="/cart"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 divide-y divide-stone-100 mb-6">
              {items.map((item) => (
                <div
                  key={item.productId._id}
                  className="p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.productId.images?.[0] ? (
                      <img
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🌿</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-800 font-medium truncate">
                      {item.productId.name}
                    </p>
                    <p className="text-stone-400 text-sm mt-0.5">
                      × {item.quantity}
                    </p>
                  </div>
                  <span className="text-emerald-700 font-medium">
                    {formatVND(getEffectivePrice(item.productId) * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="p-4 flex items-center justify-between">
                <span className="text-stone-600 font-medium">Tổng cộng</span>
                <span className="text-emerald-700 font-semibold text-lg">
                  {formatVND(total)}
                </span>
              </div>
            </div>

            <form
              onSubmit={handleReviewOrder}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4"
            >
              <h2 className="font-medium text-stone-800">
                Thông tin giao hàng
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Địa chỉ giao hàng
                </label>

                {addresses.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
                    Bạn chưa có địa chỉ giao hàng nào. Vui lòng{" "}
                    <Link href="/account" className="font-medium underline">
                      thêm địa chỉ tại trang Tài khoản
                    </Link>{" "}
                    trước khi đặt hàng.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <label
                        key={address._id}
                        className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition ${
                          selectedAddressId === address._id
                            ? "border-emerald-400 bg-emerald-50/50"
                            : "border-stone-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddressId"
                          value={address._id}
                          checked={selectedAddressId === address._id}
                          onChange={() => setSelectedAddressId(address._id)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-400"
                        />
                        <span className="text-sm">
                          <span className="text-stone-800 font-medium">
                            {address.recipientName} - {address.phone}{" "}
                            {address.isDefault && (
                              <span className="ml-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                Mặc định
                              </span>
                            )}
                          </span>
                          <span className="block text-stone-500 mt-0.5">
                            {address.addressText}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Phương thức thanh toán
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm._id} value={pm._id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || addresses.length === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Đặt hàng
              </button>
            </form>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-stone-800">
              Xác nhận đặt hàng
            </h2>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
              {items.map((item) => (
                <div
                  key={item.productId._id}
                  className="p-3 flex items-center justify-between text-sm"
                >
                  <span className="text-stone-700">
                    {item.productId.name}{" "}
                    <span className="text-stone-400">× {item.quantity}</span>
                  </span>
                  <span className="text-stone-600">
                    {formatVND(getEffectivePrice(item.productId) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-sm text-stone-600 space-y-1">
              <p>
                Giao đến:{" "}
                <span className="font-medium text-stone-800">
                  {addresses.find((a) => a._id === selectedAddressId)
                    ?.recipientName}{" "}
                  -{" "}
                  {addresses.find((a) => a._id === selectedAddressId)?.phone}
                </span>
              </p>
              <p className="text-stone-500">
                {addresses.find((a) => a._id === selectedAddressId)
                  ?.addressText}
              </p>
              <p>
                Thanh toán:{" "}
                <span className="font-medium text-stone-800">
                  {
                    paymentMethods.find((pm) => pm._id === paymentMethodId)
                      ?.name
                  }
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-stone-600 font-medium">Tổng cộng</span>
              <span className="text-emerald-700 font-semibold text-lg">
                {formatVND(total)}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Sửa lại
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
