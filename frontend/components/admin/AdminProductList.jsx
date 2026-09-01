"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, formatVND, handleAuthError } from "@/lib/api";

const SKIN_TYPES = [
  { value: "da_dau", label: "Da dầu" },
  { value: "da_kho", label: "Da khô" },
  { value: "da_hon_hop", label: "Da hỗn hợp" },
  { value: "da_nhay_cam", label: "Da nhạy cảm" },
];

const SKIN_LABELS = SKIN_TYPES.reduce((acc, opt) => {
  acc[opt.value] = opt.label.toLowerCase();
  return acc;
}, {});

// Tao nhanh 1 doan tri thuc nhap san tu du lieu san pham vua tao, de Admin chi
// can chinh sua/xac nhan thay vi go tu dau khi nap vao Tri thuc Chatbot.
function buildKnowledgeDraft(payload, categoryName) {
  const skinText =
    payload.targetSkinTypes.length > 0
      ? payload.targetSkinTypes.map((v) => SKIN_LABELS[v] || v).join(", ")
      : "chưa xác định loại da phù hợp";
  const inciText =
    payload.ingredientsINCI.length > 0
      ? payload.ingredientsINCI.join(", ")
      : "chưa có thông tin thành phần";

  const details = [
    payload.brand && `thương hiệu ${payload.brand}`,
    `mã sản phẩm ${payload.sku}`,
    payload.volume && `dung tích ${payload.volume}`,
    categoryName && `thuộc nhóm ${categoryName}`,
  ]
    .filter(Boolean)
    .join(", ");

  return `${payload.name} (${details}) phù hợp cho ${skinText}. Thành phần chính: ${inciText}.${
    payload.description ? ` ${payload.description}` : ""
  }`;
}

const emptyForm = {
  sku: "",
  name: "",
  brand: "",
  price: "",
  stockQuantity: "",
  images: "",
  targetSkinTypes: [],
  ingredientsINCI: "",
  isVegan: true,
  description: "",
  volume: "",
  origin: "",
  categoryId: "",
};

/**
 * AdminProductList - UC08: quan ly san pham (Admin)
 * GET /api/products (dung chung API cong khai), POST/PUT/DELETE yeu cau role admin
 */
export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [knowledgeDraft, setKnowledgeDraft] = useState(null);
  const [knowledgeText, setKnowledgeText] = useState("");
  const [knowledgeSaving, setKnowledgeSaving] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách sản phẩm");
        return;
      }
      setProducts(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setForm({
      sku: product.sku || "",
      name: product.name || "",
      brand: product.brand || "",
      price: product.price ?? "",
      stockQuantity: product.stockQuantity ?? "",
      images: (product.images || []).join(", "),
      targetSkinTypes: product.targetSkinTypes || [],
      ingredientsINCI: (product.ingredientsINCI || []).join(", "),
      isVegan: product.isVegan ?? true,
      description: product.description || "",
      volume: product.volume || "",
      origin: product.origin || "",
      categoryId: product.categoryId?._id || product.categoryId || "",
    });
    setEditingId(product._id);
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

  const toggleSkinType = (value) => {
    setForm((prev) => ({
      ...prev,
      targetSkinTypes: prev.targetSkinTypes.includes(value)
        ? prev.targetSkinTypes.filter((v) => v !== value)
        : [...prev.targetSkinTypes, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.sku.trim() ||
      !form.name.trim() ||
      form.price === "" ||
      form.stockQuantity === ""
    ) {
      setFormError("Vui lòng nhập đầy đủ Mã SKU, Tên sản phẩm, Giá bán và Tồn kho");
      return;
    }

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      images: form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      targetSkinTypes: form.targetSkinTypes,
      ingredientsINCI: form.ingredientsINCI
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isVegan: form.isVegan,
      description: form.description.trim(),
      volume: form.volume.trim(),
      origin: form.origin.trim(),
      categoryId: form.categoryId || undefined,
    };

    setFormSaving(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/products/${editingId}`
        : `${API_BASE_URL}/api/products`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setFormError(json.message || "Lưu sản phẩm thất bại, vui lòng thử lại");
        return;
      }

      closeForm();
      fetchProducts();

      // Chi goi y nap tri thuc khi THEM MOI (san pham chua tung co trong Chatbot),
      // khong lam phien khi chi sua gia/ton kho cua san pham da co san.
      if (!editingId) {
        const categoryName = categories.find((c) => c._id === payload.categoryId)?.name;
        setKnowledgeDraft(json.data);
        setKnowledgeText(buildKnowledgeDraft(payload, categoryName));
        setKnowledgeError("");
      }
    } catch {
      setFormError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setFormSaving(false);
    }
  };

  const closeKnowledgeModal = () => {
    setKnowledgeDraft(null);
    setKnowledgeText("");
    setKnowledgeError("");
  };

  const handleConfirmKnowledge = async () => {
    if (!knowledgeText.trim()) {
      setKnowledgeError("Vui lòng nhập nội dung tri thức");
      return;
    }

    setKnowledgeSaving(true);
    setKnowledgeError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          documentTitle: `Sản phẩm: ${knowledgeDraft.name} (${knowledgeDraft.sku})`,
          textChunk: knowledgeText.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setKnowledgeError(json.message || "Nạp tri thức thất bại, vui lòng thử lại");
        return;
      }

      closeKnowledgeModal();
    } catch {
      setKnowledgeError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setKnowledgeSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Xoá sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá sản phẩm thất bại");
        return;
      }

      fetchProducts();
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    }
  };

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="max-w-5xl">
        <div className="flex items-center justify-end mb-6">
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
          >
            + Thêm sản phẩm
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
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Mã SKU
                </label>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  disabled={!!editingId}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Tên sản phẩm
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
                  Thương hiệu
                </label>
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Danh mục
                </label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Giá bán (đ)
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Tồn kho
                </label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Dung tích
                </label>
                <input
                  name="volume"
                  value={form.volume}
                  onChange={handleChange}
                  placeholder="VD: 100ml"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Xuất xứ
                </label>
                <input
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="VD: Việt Nam"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Ảnh sản phẩm (URL, cách nhau bởi dấu phẩy)
              </label>
              <input
                name="images"
                value={form.images}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Thành phần (INCI, cách nhau bởi dấu phẩy)
              </label>
              <textarea
                name="ingredientsINCI"
                value={form.ingredientsINCI}
                onChange={handleChange}
                rows={2}
                placeholder="Aqua, Glycerin, ..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
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

            <div>
              <p className="text-sm font-medium text-stone-700 mb-1.5">
                Phù hợp loại da
              </p>
              <div className="flex flex-wrap gap-3">
                {SKIN_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 text-sm text-stone-600"
                  >
                    <input
                      type="checkbox"
                      checked={form.targetSkinTypes.includes(opt.value)}
                      onChange={() => toggleSkinType(opt.value)}
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={form.isVegan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isVegan: e.target.checked }))
                }
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
              />
              Sản phẩm thuần chay (Vegan)
            </label>

            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {formSaving
                ? "Đang lưu..."
                : editingId
                ? "Cập nhật sản phẩm"
                : "Thêm sản phẩm"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden overflow-x-auto">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : products.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có sản phẩm nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-100">
                  <th className="p-3 font-medium">Ảnh</th>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium">Tên sản phẩm</th>
                  <th className="p-3 font-medium">Danh mục</th>
                  <th className="p-3 font-medium">Giá</th>
                  <th className="p-3 font-medium">Tồn kho</th>
                  <th className="p-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">🌿</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-stone-500">{product.sku}</td>
                    <td className="p-3 text-stone-800">{product.name}</td>
                    <td className="p-3 text-stone-500">
                      {product.categoryId?.name || "—"}
                    </td>
                    <td className="p-3 text-emerald-700 font-medium">
                      {formatVND(product.price)}
                    </td>
                    <td className="p-3 text-stone-500">
                      {product.stockQuantity}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(product)}
                        className="text-emerald-700 hover:underline mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:underline"
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

      {knowledgeDraft && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-6 space-y-4">
            <div>
              <h2 className="font-medium text-stone-800">
                Nạp tri thức cho Chatbot?
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Đã tạo sẵn 1 đoạn tri thức từ dữ liệu sản phẩm vừa thêm, bạn có
                thể chỉnh sửa trước khi nạp để Chatbot biết và tư vấn được sản
                phẩm này.
              </p>
            </div>

            {knowledgeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {knowledgeError}
              </div>
            )}

            <textarea
              value={knowledgeText}
              onChange={(e) => setKnowledgeText(e.target.value)}
              rows={7}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeKnowledgeModal}
                disabled={knowledgeSaving}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={handleConfirmKnowledge}
                disabled={knowledgeSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {knowledgeSaving ? "Đang nạp (gọi Gemini)..." : "Nạp vào tri thức Chatbot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
