"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

/**
 * AuthPage - trang gop Dang nhap / Dang ky (UC02)
 * Dat file nay + LoginForm.jsx + RegisterForm.jsx vao thu muc components/auth/
 * cua project Next.js, roi import vao route /login hoac /auth.
 *
 * Vi du dung trong app/(auth)/login/page.jsx:
 *   import AuthPage from "@/components/auth/AuthPage";
 *   export default function Page() {
 *     const router = useRouter();
 *     return <AuthPage onAuthSuccess={() => router.push("/")} />;
 *   }
 */
export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"

  const handleSuccess = (userData, token) => {
    onAuthSuccess?.(userData, token);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-emerald-50 via-stone-50 to-stone-100 px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Panel thuong hieu */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-10">
          <div>
            <div className="flex items-center gap-2 text-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon-white.png" alt="" className="w-7 h-7 object-contain" />
              <span className="font-[family-name:var(--font-brand)] font-bold tracking-tight">
                Leafmood
              </span>
            </div>
            <p className="mt-6 text-emerald-50/90 text-sm leading-relaxed">
              Phân tích thành phần & tư vấn mỹ phẩm thuần chay bằng AI —
              đồng hành cùng làn da của bạn theo cách tự nhiên và an toàn
              nhất.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-emerald-50/90">
            <li className="flex items-center gap-2">
              <span>✓</span> 100% thành phần thuần chay, không thử nghiệm
              trên động vật
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Trợ lý AI phân tích thành phần độc hại
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Gợi ý sản phẩm theo loại da riêng
            </li>
          </ul>
        </div>

        {/* Panel form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {/* Tab chuyen doi */}
          <div className="flex mb-8 bg-stone-100 rounded-xl p-1 max-w-xs mx-auto w-full">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === "login"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === "register"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
