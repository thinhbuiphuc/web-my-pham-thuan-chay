"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { API_BASE_URL, authHeaders, formatVND, getToken, handleAuthError } from "@/lib/api";

// Mau hien thi theo ten trang thai don hang (OrderStatus.name, xem seed du lieu)
const STATUS_STYLES = {
  "Chờ xác nhận": "bg-amber-50 text-amber-700",
  "Đã xác nhận": "bg-blue-50 text-blue-700",
  "Đang chuẩn bị hàng": "bg-indigo-50 text-indigo-700",
  "Đã giao": "bg-emerald-50 text-emerald-700",
  "Đã hủy": "bg-red-50 text-red-700",
};

/**
 * OrderHistory - UC03: xem lich su don hang cua chinh minh
 * Goi GET {API_BASE_URL}/api/orders/my (can dang nhap)
 */
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(true);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!getToken()) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/my`, {
          headers: { ...authHeaders() },
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          if (handleAuthError(json)) return;
          setError(json.message || "Không tải được danh sách đơn hàng");
          return;
        }

        setOrders(json.data);
      } catch (err) {
        setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }
    };

    const fetchMyReviews = async () => {
      if (!getToken()) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/mine`, {
          headers: { ...authHeaders() },
        });
        const json = await res.json();
        if (json.success) setReviewedProductIds(new Set(json.data));
      } catch {
        // bo qua loi tai danh sach da danh gia, khong chan trang don hang
      }
    };

    fetchOrders();
    fetchMyReviews();
  }, []);

  const openReviewForm = (productId, productName) => {
    setReviewingItem({ productId, productName });
    setReviewForm({ rating: 5, comment: "" });
    setReviewError("");
  };

  const closeReviewForm = () => {
    setReviewingItem(null);
    setReviewError("");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");

    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          productId: reviewingItem.productId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setReviewError(json.message || "Gửi đánh giá thất bại");
        return;
      }

      setReviewedProductIds((prev) => new Set(prev).add(reviewingItem.productId));
      closeReviewForm();
    } catch {
      setReviewError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (
      !window.confirm(
        `Huỷ đơn hàng đặt lúc ${new Date(order.createdAt).toLocaleString(
          "vi-VN"
        )}? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setCancellingId(order._id);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${order._id}/cancel`, {
        method: "PUT",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setError(json.message || "Huỷ đơn hàng thất bại");
        return;
      }

      setOrders((prev) => prev.map((o) => (o._id === order._id ? json.data : o)));
    } catch (err) {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6">
          Đơn hàng của tôi
        </h1>

        {!loggedIn ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
            Vui lòng{" "}
            <Link href="/login" className="font-medium underline">
              đăng nhập
            </Link>{" "}
            để xem đơn hàng.
          </div>
        ) : loading ? (
          <p className="text-stone-500 text-sm">Đang tải đơn hàng...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm">Bạn chưa có đơn hàng nào.</p>
            <Link
              href="/products"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_STYLES[order.orderStatusId?.name] ||
                      "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {order.orderStatusId?.name || "Không xác định"}
                  </span>
                </div>

                {order.deliveryStatus && (
                  <p className="text-xs text-stone-500 mb-3">
                    Trạng thái giao hàng: {order.deliveryStatus}
                  </p>
                )}

                <div className="divide-y divide-stone-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5 min-w-0 text-stone-700">
                          <span className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                            {item.productId?.images?.[0] ? (
                              <img
                                src={item.productId.images[0]}
                                alt={item.productId.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">🌿</span>
                            )}
                          </span>
                          <span className="min-w-0">
                            {item.productId?._id ? (
                              <Link
                                href={`/products/${item.productId._id}`}
                                className="hover:text-emerald-700 hover:underline"
                              >
                                {item.productId.name}
                              </Link>
                            ) : (
                              "Sản phẩm không còn tồn tại"
                            )}{" "}
                            <span className="text-stone-400">
                              × {item.quantity}
                            </span>
                          </span>
                        </span>
                        <span className="text-stone-600 whitespace-nowrap">
                          {formatVND(item.priceAtPurchase * item.quantity)}
                        </span>
                      </div>

                      {order.orderStatusId?.name === "Đã giao" &&
                        item.productId?._id &&
                        (reviewedProductIds.has(item.productId._id) ? (
                          <p className="text-xs text-stone-400 mt-1.5 ml-12">
                            ✓ Đã đánh giá
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              openReviewForm(item.productId._id, item.productId.name)
                            }
                            className="text-xs text-emerald-700 font-semibold mt-1.5 ml-12 px-3 py-1 rounded-full border border-emerald-600 hover:bg-emerald-50 transition"
                          >
                            ★ Đánh giá
                          </button>
                        ))}
                    </div>
                  ))}
                </div>

                <div className="flex items-start justify-between mt-3 pt-3 border-t border-stone-100 gap-3">
                  <span className="text-stone-500 text-sm">
                    Giao đến: {order.recipientName} - {order.phoneNumber}
                    {order.shippingAddress && (
                      <>
                        <br />
                        {order.shippingAddress}
                      </>
                    )}
                  </span>
                  <span className="font-semibold text-emerald-700 whitespace-nowrap">
                    {formatVND(order.totalAmount)}
                  </span>
                </div>
                {order.paymentMethodId?.name && (
                  <p className="text-xs text-stone-400 mt-1">
                    Thanh toán: {order.paymentMethodId.name}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <button
                    type="button"
                    onClick={() => setViewingOrder(order)}
                    className="text-sm text-emerald-700 font-medium hover:underline"
                  >
                    Xem lại đơn hàng
                  </button>

                  {order.orderStatusId?.name === "Chờ xác nhận" && (
                    <button
                      type="button"
                      disabled={cancellingId === order._id}
                      onClick={() => handleCancelOrder(order)}
                      className="text-sm text-red-600 font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {cancellingId === order._id ? "Đang huỷ..." : "Huỷ đơn"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-stone-800">
              Đơn hàng lúc đặt
            </h2>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl">
              {viewingOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 flex items-center justify-between text-sm gap-3"
                >
                  <span className="flex items-center gap-2.5 min-w-0 text-stone-700">
                    <span className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                      {item.productId?.images?.[0] ? (
                        <img
                          src={item.productId.images[0]}
                          alt={item.productId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">🌿</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      {item.productId?._id ? (
                        <Link
                          href={`/products/${item.productId._id}`}
                          className="hover:text-emerald-700 hover:underline"
                        >
                          {item.productId.name}
                        </Link>
                      ) : (
                        "Sản phẩm không còn tồn tại"
                      )}{" "}
                      <span className="text-stone-400">× {item.quantity}</span>
                    </span>
                  </span>
                  <span className="text-stone-600 whitespace-nowrap">
                    {formatVND(item.priceAtPurchase * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-sm text-stone-600 space-y-1">
              <p>
                Giao đến:{" "}
                <span className="font-medium text-stone-800">
                  {viewingOrder.recipientName} - {viewingOrder.phoneNumber}
                </span>
              </p>
              {viewingOrder.shippingAddress && (
                <p className="text-stone-500">{viewingOrder.shippingAddress}</p>
              )}
              {viewingOrder.paymentMethodId?.name && (
                <p>
                  Thanh toán:{" "}
                  <span className="font-medium text-stone-800">
                    {viewingOrder.paymentMethodId.name}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-stone-600 font-medium">Tổng cộng</span>
              <span className="text-emerald-700 font-semibold text-lg">
                {formatVND(viewingOrder.totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setViewingOrder(null)}
              className="w-full py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {reviewingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-stone-800">
              Đánh giá &quot;{reviewingItem.productName}&quot;
            </h2>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {reviewError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm text-stone-600">Số sao</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, rating: e.target.value }))
                  }
                  className="px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} sao
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={3}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeReviewForm}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
