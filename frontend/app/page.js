"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setChecked(true);
  }, []);

  if (!checked) {
    return <main className="min-h-screen bg-stone-50" />;
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />

      {/* Hero - toan man hinh, khong bi gioi han max-w nhu truoc, chua tung
          duoc chup vao quyen bao cao nen an toan de doi giao dien */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-stone-50 to-stone-50">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-emerald-100/60 blur-3xl"
        />

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-emerald-100 flex items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="w-full h-full object-contain" />
          </div>

          {user ? (
            <>
              <h1 className="font-[family-name:var(--font-brand)] text-3xl sm:text-4xl font-bold text-stone-800">
                Xin chào, {user.fullName}
              </h1>
              <p className="text-stone-500 text-sm">{user.email}</p>
            </>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-brand)] text-3xl sm:text-5xl font-bold text-stone-800 leading-tight">
                Chắt lọc ngàn lá
                <br className="hidden sm:block" /> — Trao gửi an lành
              </h1>
              <p className="text-stone-500 text-sm sm:text-base max-w-xl">
                Mỹ phẩm lành tính, chiết xuất từ thực vật, không thử nghiệm
                trên động vật — chăm sóc làn da bạn bằng sự dịu nhẹ tự
                nhiên.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
                >
                  Đăng nhập / Đăng ký
                </Link>
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-600 text-sm font-medium hover:bg-stone-100 transition"
                >
                  Xem sản phẩm →
                </Link>
              </div>
            </>
          )}

          {user && (
            <Link
              href="/products"
              className="mt-2 px-6 py-3 rounded-xl border border-stone-300 bg-white text-stone-600 text-sm font-medium hover:bg-stone-100 transition"
            >
              Xem sản phẩm →
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
