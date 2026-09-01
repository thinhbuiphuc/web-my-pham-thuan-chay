"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

const emptyForm = {
  documentTitle: "",
  textChunk: "",
  pageNumber: "",
};

/**
 * AdminKnowledgeBaseList - (Admin) nap/xem/xoa tri thuc cho Chatbot RAG
 * GET/POST/DELETE /api/knowledge-base(/:id) - deu yeu cau role admin
 * Luu y: POST goi Gemini embedText() ngay khi luu, co the mat vai giay
 */
export default function AdminKnowledgeBaseList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách tri thức");
        return;
      }

      setEntries(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
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

    if (!form.documentTitle.trim() || !form.textChunk.trim()) {
      setFormError("Vui lòng nhập đầy đủ Tiêu đề tài liệu và Nội dung");
      return;
    }

    setFormSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          documentTitle: form.documentTitle.trim(),
          textChunk: form.textChunk.trim(),
          pageNumber: form.pageNumber ? Number(form.pageNumber) : undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setFormError(json.message || "Nạp tri thức thất bại, vui lòng thử lại");
        return;
      }

      closeForm();
      fetchEntries();
    } catch {
      setFormError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    if (
      !window.confirm(
        `Xoá tri thức "${entry.documentTitle}"? Chatbot sẽ không còn dùng đoạn này để trả lời.`
      )
    ) {
      return;
    }

    setDeletingId(entry._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base/${entry._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá tri thức thất bại");
        return;
      }

      setEntries((prev) => prev.filter((e) => e._id !== entry._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý tri thức Chatbot">
      <div className="max-w-3xl">
        <div className="flex items-center justify-end mb-6">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            + Nạp tri thức
          </button>
        </div>
        <p className="text-xs text-stone-400 -mt-4 mb-6">
          Mỗi đoạn tri thức nạp vào đây sẽ được Chatbot dùng để trả lời khách
          hàng (RAG). Lưu ý: nạp mới sẽ gọi Gemini để tạo embedding, có thể mất
          vài giây.
        </p>

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
              <h2 className="font-medium text-stone-800">Nạp tri thức mới</h2>
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
                Tiêu đề tài liệu
              </label>
              <input
                name="documentTitle"
                value={form.documentTitle}
                onChange={handleChange}
                placeholder="VD: Paraben, Sulfate, Hương liệu tổng hợp..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Trang (tuỳ chọn)
              </label>
              <input
                name="pageNumber"
                type="number"
                min="1"
                value={form.pageNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nội dung
              </label>
              <textarea
                name="textChunk"
                value={form.textChunk}
                onChange={handleChange}
                rows={6}
                placeholder="Dán đoạn nội dung tri thức vào đây..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {formSaving ? "Đang nạp tri thức (gọi Gemini)..." : "Nạp tri thức"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : entries.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">
              Chưa có tri thức nào được nạp.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <div key={entry._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-stone-800 font-medium">
                      {entry.documentTitle}
                      {entry.metadata?.pageNumber && (
                        <span className="text-stone-400 font-normal">
                          {" "}
                          — trang {entry.metadata.pageNumber}
                        </span>
                      )}
                    </p>
                    <p className="text-stone-500 text-sm mt-0.5 line-clamp-2">
                      {entry.textChunk}
                    </p>
                    {entry.metadata?.uploadedBy?.fullName && (
                      <p className="text-xs text-stone-400 mt-1">
                        Nạp bởi: {entry.metadata.uploadedBy.fullName}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === entry._id}
                    onClick={() => handleDelete(entry)}
                    className="text-red-600 hover:underline text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
