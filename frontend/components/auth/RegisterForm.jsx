"use client";

import { useState } from "react";

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

// Khop voi enum skinType trong models/User.js
const SKIN_TYPES = [
  { value: "chua_xac_dinh", label: "Chưa xác định" },
  { value: "da_dau", label: "Da dầu" },
  { value: "da_kho", label: "Da khô" },
  { value: "da_hon_hop", label: "Da hỗn hợp" },
  { value: "da_nhay_cam", label: "Da nhạy cảm" },
];

/**
 * RegisterForm - giao dien Dang ky (UC02 - nhanh Dang ky)
 * Goi POST {API_BASE_URL}/api/auth/register voi { email, password, fullName, skinType }
 *
 * Props:
 *  - onSuccess(data, token): goi khi dang ky thanh cong
 *  - onSwitchToLogin(): goi khi nguoi dung bam "Dang nhap"
 */
// Dinh dang Email hop le (dac ta UC02 - buoc 1a.2)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// So dien thoai VN: bat dau bang 0, tong 9-10 chu so sau do
const PHONE_REGEX = /^0\d{9,10}$/;

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    skinType: "chua_xac_dinh",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Vui lòng nhập Họ tên";
    if (!form.email.trim()) return "Vui lòng nhập Email";
    if (!EMAIL_REGEX.test(form.email.trim()))
      return "Định dạng Email không hợp lệ";
    if (!form.phone.trim()) return "Vui lòng nhập Số điện thoại";
    if (!PHONE_REGEX.test(form.phone.trim()))
      return "Số điện thoại không hợp lệ (vd: 0912345678)";
    if (!form.password) return "Vui lòng nhập Mật khẩu";
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (form.password !== form.confirmPassword)
      return "Mật khẩu nhập lại không khớp";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          skinType: form.skinType,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        // Exc 2 (Trung lap Email) va cac loi validate khac tra ve tu backend
        setError(json.message || "Đăng ký thất bại, vui lòng thử lại");
        return;
      }

      if (typeof window !== "undefined" && json.token) {
        localStorage.setItem("token", json.token);
        localStorage.setItem("user", JSON.stringify(json.data));
      }

      onSuccess?.(json.data, json.token);
    } catch (err) {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Tạo tài khoản mới
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Bắt đầu hành trình chăm sóc da thuần chay cùng chúng tôi
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="reg-fullName"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Họ và tên
          </label>
          <input
            id="reg-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ban@email.com"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          />
        </div>

        <div>
          <label
            htmlFor="reg-phone"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Số điện thoại
          </label>
          <input
            id="reg-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="0912345678"
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-stone-700 mb-1.5"
            >
              Mật khẩu
            </label>
            <input
              id="reg-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
          </div>
          <div>
            <label
              htmlFor="reg-confirmPassword"
              className="block text-sm font-medium text-stone-700 mb-1.5"
            >
              Nhập lại
            </label>
            <input
              id="reg-confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-600 select-none">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword((v) => !v)}
            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
          />
          Hiện mật khẩu
        </label>

        <div>
          <label
            htmlFor="reg-skinType"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Loại da của bạn
          </label>
          <select
            id="reg-skinType"
            name="skinType"
            value={form.skinType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          >
            {SKIN_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1.5">
            Giúp chúng tôi tư vấn sản phẩm phù hợp hơn với bạn
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          Đăng nhập
        </button>
      </p>
    </div>
  );
}
