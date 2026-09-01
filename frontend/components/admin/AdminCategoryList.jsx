"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

const emptyForm = {
  name: "",
  description: "",
};

/**
 * AdminCategoryList - (Admin) quan ly danh muc san pham
 * GET /api/categories, POST/PUT/DELETE /api/categories(/:id) yeu cau role admin
 */
export default function AdminCategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách danh mục");
        return;
      }

      setCategories(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setEditingId(category._id);
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

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên danh mục");
      return;
    }

    setFormSaving(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/categories/${editingId}`
        : `${API_BASE_URL}/api/categories`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setFormError(json.message || "Lưu danh mục thất bại, vui lòng thử lại");
        return;
      }

      closeForm();
      fetchCategories();
    } catch {
      setFormError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Xoá danh mục "${category.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeletingId(category._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${category._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá danh mục thất bại");
        return;
      }

      setCategories((prev) => prev.filter((c) => c._id !== category._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý danh mục">
      <div className="max-w-3xl">
        <div className="flex items-center justify-end mb-6">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            + Thêm danh mục
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
                {editingId ? "Sửa danh mục" : "Thêm danh mục mới"}
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
                Tên danh mục
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Mô tả
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {formSaving
                ? "Đang lưu..."
                : editingId
                ? "Cập nhật danh mục"
                : "Thêm danh mục"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : categories.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có danh mục nào.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-stone-800 font-medium">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="text-stone-500 text-sm mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditForm(category)}
                      className="text-emerald-700 hover:underline text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === category._id}
                      onClick={() => handleDelete(category)}
                      className="text-red-600 hover:underline text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Xoá
                    </button>
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
