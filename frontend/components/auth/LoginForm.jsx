"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

/**
 * LoginForm - giao dien Dang nhap (UC02 - nhanh Dang nhap)
 * Goi POST {API_BASE_URL}/api/auth/login voi { email, password }
 *
 * Props:
 *  - onSuccess(data, token): goi khi dang nhap thanh cong
 *  - onSwitchToRegister(): goi khi nguoi dung bam "Dang ky ngay"
 */
export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setNotice("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Đăng nhập thất bại, vui lòng thử lại");
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
          Chào mừng trở lại
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Đăng nhập để tiếp tục hành trình làm đẹp thuần chay của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {notice && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
            {notice}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-stone-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="login-email"
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-stone-700"
            >
              Mật khẩu
            </label>
            <button
              type="button"
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
              tabIndex={-1}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-6">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          Đăng ký ngay
        </button>
      </p>
    </div>
  );
}
