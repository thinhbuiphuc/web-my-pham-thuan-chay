"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

const emptyForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: "0",
  isActive: true,
};

/**
 * AdminBannerList - (Admin) quan ly banner hien thi o trang chu
 * GET /api/banners/all, POST/PUT/DELETE /api/banners - deu yeu cau role admin
 */
export default function AdminBannerList() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners/all`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách banner");
        return;
      }

      setBanners(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (banner) => {
    setForm({
      title: banner.title || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      sortOrder: String(banner.sortOrder ?? 0),
      isActive: banner.isActive,
    });
    setEditingId(banner._id);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.imageUrl.trim()) {
      setFormError("Vui lòng nhập Tiêu đề và URL ảnh banner");
      return;
    }

    setFormSaving(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/banners/${editingId}`
        : `${API_BASE_URL}/api/banners`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: form.title.trim(),
          imageUrl: form.imageUrl.trim(),
          linkUrl: form.linkUrl.trim() || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setFormError(json.message || "Lưu banner thất bại, vui lòng thử lại");
        return;
      }

      closeForm();
      fetchBanners();
    } catch {
      setFormError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleActive = async (banner) => {
    setTogglingId(banner._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners/${banner._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Cập nhật trạng thái banner thất bại");
        return;
      }

      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: json.data.isActive } : b))
      );
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Xoá banner "${banner.title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setDeletingId(banner._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/banners/${banner._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá banner thất bại");
        return;
      }

      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý banner">
      <div className="max-w-4xl">
        <div className="flex items-center justify-end mb-6">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            + Thêm banner
          </button>
        </div>

        {listError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-stone-800">
                {editingId ? "Sửa banner" : "Thêm banner mới"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                Đóng
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Tiêu đề
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="VD: Khuyến mãi mùa hè"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                URL ảnh banner
              </label>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Xem trước"
                  className="mt-2 w-full h-32 object-cover rounded-xl border border-stone-200"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Link khi bấm vào banner (để trống nếu không cần)
              </label>
              <input
                name="linkUrl"
                value={form.linkUrl}
                onChange={handleChange}
                placeholder="VD: /products"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Thứ tự hiển thị (số nhỏ hơn hiện trước)
                </label>
                <input
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
                />
                Hiển thị ngay
              </label>
            </div>

            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {formSaving ? "Đang lưu..." : editingId ? "Cập nhật banner" : "Thêm banner"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : banners.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có banner nào.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {banners.map((banner) => (
                <div key={banner._id} className="p-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-24 h-16 object-cover rounded-lg border border-stone-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-stone-800 font-medium flex items-center gap-2">
                      {banner.title}
                      {!banner.isActive && (
                        <span className="text-xs font-normal text-stone-500 bg-stone-200 rounded-full px-2 py-0.5">
                          Đang ẩn
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                      Thứ tự: {banner.sortOrder} {banner.linkUrl && `- Link: ${banner.linkUrl}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 whitespace-nowrap flex-shrink-0">
                    <div>
                      <button
                        type="button"
                        onClick={() => openEditForm(banner)}
                        className="text-emerald-700 hover:underline text-sm mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={togglingId === banner._id}
                        onClick={() => handleToggleActive(banner)}
                        className="text-stone-600 hover:underline text-sm mr-3 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {banner.isActive ? "Ẩn" : "Hiện"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === banner._id}
                        onClick={() => handleDelete(banner)}
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
