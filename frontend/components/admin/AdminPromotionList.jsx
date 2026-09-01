"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

const emptyForm = {
  productId: "",
  name: "",
  discountPercent: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
};

const toDateInputValue = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toISOString().slice(0, 10);
};

/**
 * AdminPromotionList - (Admin) quan ly ma giam gia (khuyen mai gan theo san pham)
 * GET/POST/PUT/DELETE /api/promotions - deu yeu cau role admin
 */
export default function AdminPromotionList() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPromotions = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/promotions`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách khuyến mãi");
        return;
      }

      setPromotions(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetch(`${API_BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProducts(json.data);
      })
      .catch(() => {});
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (promotion) => {
    setForm({
      productId: promotion.productId?._id || "",
      name: promotion.name || "",
      discountPercent: promotion.discountPercent ?? "",
      startDate: toDateInputValue(promotion.startDate),
      endDate: toDateInputValue(promotion.endDate),
      usageLimit: promotion.usageLimit ?? "",
    });
    setEditingId(promotion._id);
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.productId || !form.name.trim()) {
      setFormError("Vui lòng chọn Sản phẩm và nhập Tên chương trình khuyến mãi");
      return;
    }

    setFormSaving(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/promotions/${editingId}`
        : `${API_BASE_URL}/api/promotions`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          productId: form.productId,
          name: form.name.trim(),
          discountPercent: form.discountPercent === "" ? undefined : Number(form.discountPercent),
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setFormError(json.message || "Lưu khuyến mãi thất bại, vui lòng thử lại");
        return;
      }

      closeForm();
      fetchPromotions();
    } catch {
      setFormError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (promotion) => {
    if (
      !window.confirm(
        `Xoá khuyến mãi "${promotion.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeletingId(promotion._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/promotions/${promotion._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá khuyến mãi thất bại");
        return;
      }

      setPromotions((prev) => prev.filter((p) => p._id !== promotion._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý mã giảm giá">
      <div className="max-w-4xl">
        <div className="flex items-center justify-end mb-6">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            + Thêm khuyến mãi
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
                {editingId ? "Sửa khuyến mãi" : "Thêm khuyến mãi mới"}
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
                Sản phẩm
              </label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Tên chương trình khuyến mãi
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Giảm giá mùa hè"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Giảm (%)
                </label>
                <input
                  name="discountPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Ngày bắt đầu
                </label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Ngày kết thúc
                </label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Giới hạn số lượt áp dụng (để trống = không giới hạn)
              </label>
              <input
                name="usageLimit"
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={handleChange}
                placeholder="VD: 50"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
              <p className="text-xs text-stone-400 mt-1">
                Khi số sản phẩm bán ra theo giá giảm chạm giới hạn này, khuyến mãi tự động dừng áp dụng dù chưa hết hạn.
              </p>
            </div>

            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {formSaving
                ? "Đang lưu..."
                : editingId
                ? "Cập nhật khuyến mãi"
                : "Thêm khuyến mãi"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden overflow-x-auto">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : promotions.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có khuyến mãi nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-100">
                  <th className="p-3 font-medium">Sản phẩm</th>
                  <th className="p-3 font-medium">Chương trình</th>
                  <th className="p-3 font-medium">Giảm</th>
                  <th className="p-3 font-medium">Thời gian áp dụng</th>
                  <th className="p-3 font-medium">Lượt dùng</th>
                  <th className="p-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {promotions.map((promo) => (
                  <tr key={promo._id}>
                    <td className="p-3 text-stone-800">
                      {promo.productId?.name || "Sản phẩm không còn tồn tại"}
                    </td>
                    <td className="p-3 text-stone-600">{promo.name}</td>
                    <td className="p-3 text-emerald-700 font-medium">
                      {promo.discountPercent != null
                        ? `${promo.discountPercent}%`
                        : "—"}
                    </td>
                    <td className="p-3 text-stone-500">
                      {promo.startDate
                        ? new Date(promo.startDate).toLocaleDateString("vi-VN")
                        : "—"}{" "}
                      -{" "}
                      {promo.endDate
                        ? new Date(promo.endDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {promo.usageLimit != null
                        ? `${promo.usedCount || 0}/${promo.usageLimit}`
                        : `${promo.usedCount || 0} (không giới hạn)`}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(promo)}
                        className="text-emerald-700 hover:underline mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === promo._id}
                        onClick={() => handleDelete(promo)}
                        className="text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
