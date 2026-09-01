"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, formatVND, handleAuthError } from "@/lib/api";

// Mau hien thi theo ten trang thai don hang (OrderStatus.name, xem seed du lieu)
const STATUS_STYLES = {
  "Chờ xác nhận": "bg-amber-50 text-amber-700",
  "Đã xác nhận": "bg-blue-50 text-blue-700",
  "Đang chuẩn bị hàng": "bg-indigo-50 text-indigo-700",
  "Đã giao": "bg-emerald-50 text-emerald-700",
  "Đã hủy": "bg-red-50 text-red-700",
};

/**
 * AdminOrderList - (Admin) quan ly toan bo don hang, cap nhat trang thai xu ly/giao hang, xoa don
 * Nut "Xoa" chi xoa duoc don dang o trang thai dau (Cho xac nhan) - dung nghiep vu TMDT that.
 * Hoan lai ton kho da tru luc dat hang khi xoa.
 * GET /api/orders (admin), PUT/DELETE /api/orders/:id
 */
export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deliveryDrafts, setDeliveryDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpanded = (orderId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách đơn hàng");
        return;
      }

      setOrders(json.data);
      setDeliveryDrafts(
        Object.fromEntries(
          json.data.map((order) => [order._id, order.deliveryStatus || ""])
        )
      );
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetch(`${API_BASE_URL}/api/order-statuses`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setOrderStatuses(json.data);
      })
      .catch(() => {});
  }, []);

  const updateOrder = async (orderId, payload) => {
    setSavingId(orderId);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Cập nhật đơn hàng thất bại");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? json.data : o))
      );
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = (orderId, orderStatusId) => {
    updateOrder(orderId, { orderStatusId });
  };

  const handleDeliverySave = (orderId) => {
    updateOrder(orderId, { deliveryStatus: deliveryDrafts[orderId] || "" });
  };

  const handlePrintOrder = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.productId?.name || "Sản phẩm không còn tồn tại"}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${formatVND(item.priceAtPurchase)}</td>
          <td style="text-align:right">${formatVND(item.priceAtPurchase * item.quantity)}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Đơn hàng - ${order.recipientName}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #292524; padding: 32px; max-width: 720px; margin: 0 auto; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .muted { color: #78716c; font-size: 13px; }
          .section { margin-top: 20px; }
          .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; color: #57534e; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { padding: 8px; border-bottom: 1px solid #e7e5e4; font-size: 14px; }
          th { text-align: left; background: #f5f5f4; }
          .total-row td { font-weight: bold; border-top: 2px solid #292524; border-bottom: none; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Leafmood - Hoá đơn đặt hàng</h1>
        <p class="muted">Mã đơn: ${order._id}</p>
        <p class="muted">Ngày đặt: ${new Date(order.createdAt).toLocaleString("vi-VN")}</p>

        <div class="section">
          <p class="section-title">Thông tin giao hàng</p>
          <p>Người nhận: ${order.recipientName}</p>
          <p>Số điện thoại: ${order.phoneNumber}</p>
          <p>Địa chỉ: ${order.shippingAddress}</p>
        </div>

        <div class="section">
          <p class="section-title">Sản phẩm</p>
          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th style="text-align:center">SL</th>
                <th style="text-align:right">Đơn giá</th>
                <th style="text-align:right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align:right">Tổng cộng</td>
                <td style="text-align:right">${formatVND(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <p class="section-title">Thanh toán &amp; trạng thái</p>
          <p>Phương thức: ${order.paymentMethodId?.name || "—"}</p>
          <p>Trạng thái xử lý: ${order.orderStatusId?.name || "—"}</p>
          ${order.deliveryStatus ? `<p>Trạng thái giao hàng: ${order.deliveryStatus}</p>` : ""}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDeleteOrder = async (order) => {
    const confirmMessage = `Xoá vĩnh viễn đơn hàng của "${order.recipientName}" (${formatVND(
      order.totalAmount
    )})? Tồn kho sẽ được hoàn lại. Hành động này không thể hoàn tác.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSavingId(order._id);
    setListError("");
    try {
      const url = `${API_BASE_URL}/api/orders/${order._id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá đơn hàng thất bại");
        return;
      }

      setOrders((prev) => prev.filter((o) => o._id !== order._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <div className="max-w-4xl">
        {listError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        {loading ? (
          <p className="text-stone-500 text-sm">Đang tải danh sách đơn hàng...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
            <p className="text-stone-500 text-sm">Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedIds.has(order._id);
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(order._id)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ChevronDown
                        size={18}
                        className={`text-stone-400 shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-stone-400">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-sm text-stone-800 font-medium truncate">
                          {order.customerId?.fullName || "Không xác định"}{" "}
                          <span className="text-stone-400 font-normal">
                            ({order.customerId?.email || "—"})
                          </span>
                        </p>
                        <p className="text-xs text-stone-400">
                          {order.items.length} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-emerald-700 whitespace-nowrap">
                        {formatVND(order.totalAmount)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                          STATUS_STYLES[order.orderStatusId?.name] ||
                          "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {order.orderStatusId?.name || "Không xác định"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-stone-100">
                      <div className="divide-y divide-stone-100 mt-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-2 flex items-center justify-between text-sm"
                          >
                            <span className="text-stone-700">
                              {item.productId?.name || "Sản phẩm không còn tồn tại"}{" "}
                              <span className="text-stone-400">× {item.quantity}</span>
                            </span>
                            <span className="text-stone-600">
                              {formatVND(item.priceAtPurchase * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                        <span className="text-stone-500 text-sm">
                          Giao đến: {order.recipientName} - {order.phoneNumber} -{" "}
                          {order.shippingAddress}
                        </span>
                        <span className="font-semibold text-emerald-700 whitespace-nowrap ml-3">
                          {formatVND(order.totalAmount)}
                        </span>
                      </div>
                      {order.paymentMethodId?.name && (
                        <p className="text-xs text-stone-400 mt-1">
                          Thanh toán: {order.paymentMethodId.name}
                        </p>
                      )}

                      <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">
                            Trạng thái xử lý
                          </label>
                          <select
                            value={order.orderStatusId?._id || ""}
                            disabled={savingId === order._id}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                            className="px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                          >
                            {orderStatuses.map((status) => (
                              <option key={status._id} value={status._id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-stone-500 mb-1">
                            Trạng thái giao hàng (đơn vị vận chuyển)
                          </label>
                          <input
                            value={deliveryDrafts[order._id] ?? ""}
                            onChange={(e) =>
                              setDeliveryDrafts((prev) => ({
                                ...prev,
                                [order._id]: e.target.value,
                              }))
                            }
                            placeholder="VD: Đang vận chuyển, mã vận đơn..."
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={savingId === order._id}
                          onClick={() => handleDeliverySave(order._id)}
                          className="px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {savingId === order._id ? "Đang lưu..." : "Lưu"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintOrder(order)}
                          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 transition"
                        >
                          In đơn hàng
                        </button>

                        <button
                          type="button"
                          disabled={
                            savingId === order._id ||
                            (orderStatuses[0] &&
                              order.orderStatusId?._id !== orderStatuses[0]._id)
                          }
                          title="Chỉ xoá được đơn đang ở trạng thái đầu (Chờ xác nhận)"
                          onClick={() => handleDeleteOrder(order)}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
