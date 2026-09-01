"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

/**
 * AdminReviewList - (Admin) xem toan bo danh gia san pham, an/hien tam hoac
 * xoa vinh vien danh gia khong phu hop
 * GET /api/reviews (admin), PATCH /api/reviews/:id/visibility, DELETE /api/reviews/:id
 * Khong co form them/sua vi danh gia do khach hang tu tao sau khi mua hang.
 */
export default function AdminReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách đánh giá");
        return;
      }

      setReviews(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review) => {
    if (
      !window.confirm(
        `Xoá đánh giá của "${review.userId?.fullName || "khách hàng"}" cho sản phẩm "${
          review.productId?.name || "?"
        }"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeletingId(review._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${review._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá đánh giá thất bại");
        return;
      }

      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (review) => {
    setTogglingId(review._id);
    setListError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reviews/${review._id}/visibility`,
        {
          method: "PATCH",
          headers: { ...authHeaders() },
        }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Cập nhật trạng thái đánh giá thất bại");
        return;
      }

      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, isHidden: json.data.isHidden } : r))
      );
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý đánh giá">
      <div className="max-w-3xl">
        {listError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : reviews.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có đánh giá nào.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className={`p-4 ${review.isHidden ? "bg-stone-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-stone-800 font-medium flex items-center gap-2">
                        {review.productId?.name || "Sản phẩm không còn tồn tại"}
                        {review.isHidden && (
                          <span className="text-xs font-normal text-stone-500 bg-stone-200 rounded-full px-2 py-0.5">
                            Đã ẩn
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {review.userId?.fullName || "Khách hàng"} (
                        {review.userId?.email || "—"}) -{" "}
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-amber-500 mt-1">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </p>
                      {review.comment && (
                        <p className="text-stone-600 text-sm mt-1">
                          {review.comment}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={togglingId === review._id}
                        onClick={() => handleToggleVisibility(review)}
                        className="text-emerald-700 hover:underline text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {review.isHidden ? "Hiện lại" : "Ẩn"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === review._id}
                        onClick={() => handleDelete(review)}
                        className="text-red-600 hover:underline text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
