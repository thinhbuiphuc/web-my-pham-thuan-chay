"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, formatVND, handleAuthError } from "@/lib/api";

const SHORTCUTS = [
  { href: "/admin/banners", label: "Quản lý banner", desc: "Banner hiển thị ở trang chủ" },
  { href: "/admin/products", label: "Quản lý sản phẩm", desc: "Thêm/sửa/xoá sản phẩm" },
  { href: "/admin/categories", label: "Quản lý danh mục", desc: "Thêm/sửa/xoá danh mục" },
  { href: "/admin/promotions", label: "Quản lý mã giảm giá", desc: "Khuyến mãi theo sản phẩm" },
  { href: "/admin/orders", label: "Quản lý đơn hàng", desc: "Cập nhật trạng thái xử lý/giao hàng" },
  { href: "/admin/reviews", label: "Quản lý đánh giá", desc: "Xem/xoá đánh giá không phù hợp" },
  { href: "/admin/users", label: "Quản lý người dùng", desc: "Khoá/mở khoá tài khoản" },
  { href: "/admin/knowledge-base", label: "Tri thức Chatbot", desc: "Nạp tri thức cho Chatbot RAG" },
];

const STAT_CARDS = [
  { key: "totalRevenue", label: "Tổng doanh thu", format: "vnd" },
  { key: "totalOrders", label: "Tổng đơn hàng (chưa huỷ)", format: "number" },
  { key: "totalProducts", label: "Sản phẩm đang bán", format: "number" },
  { key: "totalCustomers", label: "Khách hàng", format: "number" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingType, setExportingType] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats/dashboard`, {
          headers: { ...authHeaders() },
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          if (handleAuthError(json)) return;
          setError(json.message || "Không tải được thống kê");
          return;
        }

        setStats(json.data);
      } catch {
        setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const maxDayRevenue = stats
    ? Math.max(...stats.revenueByDay.map((d) => d.revenue), 1)
    : 1;

  const handleExport = async (type) => {
    setExportingType(type);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/export/${type}`, {
        headers: { ...authHeaders() },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message || "Xuất báo cáo thất bại");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-${new Date().toISOString().slice(0, 10)}.${
        type === "excel" ? "xlsx" : "pdf"
      }`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setExportingType(null);
    }
  };

  return (
    <AdminLayout title="Dashboard">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-stone-500 text-sm mb-6">Đang tải thống kê...</p>
      ) : stats ? (
        <>
          <div className="flex justify-end gap-3 mb-4">
            <button
              type="button"
              disabled={exportingType !== null}
              onClick={() => handleExport("excel")}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {exportingType === "excel" ? "Đang xuất..." : "Xuất Excel"}
            </button>
            <button
              type="button"
              disabled={exportingType !== null}
              onClick={() => handleExport("pdf")}
              className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {exportingType === "pdf" ? "Đang xuất..." : "Xuất PDF"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((card) => (
              <div
                key={card.key}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5"
              >
                <p className="text-stone-500 text-sm">{card.label}</p>
                <p className="text-2xl font-semibold text-stone-800 mt-1">
                  {card.format === "vnd"
                    ? formatVND(stats[card.key])
                    : stats[card.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
              <p className="font-medium text-stone-800 mb-4">
                Doanh thu 7 ngày gần nhất
              </p>
              <div className="flex items-end gap-2 h-40">
                {stats.revenueByDay.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    <p className="text-xs text-stone-500">
                      {day.revenue > 0 ? formatVND(day.revenue) : ""}
                    </p>
                    <div
                      className="w-full bg-emerald-400 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          (day.revenue / maxDayRevenue) * 100,
                          day.revenue > 0 ? 4 : 1
                        )}%`,
                      }}
                    />
                    <p className="text-[10px] text-stone-400">
                      {day.date.slice(5)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5">
              <p className="font-medium text-stone-800 mb-4">
                Đơn hàng theo trạng thái
              </p>
              {stats.ordersByStatus.length === 0 ? (
                <p className="text-stone-500 text-sm">Chưa có đơn hàng nào.</p>
              ) : (
                <div className="space-y-2">
                  {stats.ordersByStatus.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-stone-100 last:border-0"
                    >
                      <span className="text-stone-600">{s.name}</span>
                      <span className="font-medium text-stone-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 mb-6">
            <p className="font-medium text-stone-800 mb-4">Top 5 sản phẩm bán chạy</p>
            {stats.topProducts.length === 0 ? (
              <p className="text-stone-500 text-sm">Chưa có sản phẩm nào được bán.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {stats.topProducts.map((p, index) => (
                  <div key={p._id} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 text-stone-400 text-sm">{index + 1}</span>
                    <p className="flex-1 text-stone-800 text-sm">{p.name}</p>
                    <span className="text-emerald-700 text-sm font-medium whitespace-nowrap">
                      Đã bán {p.soldCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      <p className="text-stone-500 text-sm mb-4">Chọn 1 mục dưới đây để quản trị.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 hover:border-emerald-300 transition"
          >
            <p className="font-medium text-stone-800">{s.label}</p>
            <p className="text-stone-500 text-sm mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
