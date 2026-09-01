"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getStoredUser } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/banners", label: "Banner" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/promotions", label: "Mã giảm giá" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/reviews", label: "Đánh giá" },
  { href: "/admin/users", label: "Người dùng" },
  { href: "/admin/knowledge-base", label: "Tri thức Chatbot" },
];

/**
 * AdminLayout - khung rieng cho toan bo khu vuc Admin (sidebar + topbar),
 * tach biet han voi giao dien khach hang (khong dung chung Header.jsx).
 * Tu kiem tra dang nhap + quyen admin, cac trang con chi can bọc noi dung vao day.
 */
export default function AdminLayout({ title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setCheckedAuth(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!checkedAuth) return null;

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 max-w-md text-center">
          Bạn không có quyền truy cập khu vực này. Chỉ tài khoản Admin mới
          được vào Quản trị.{" "}
          <Link href="/" className="font-medium underline">
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      <aside
        className={`w-60 bg-white border-r border-stone-200 flex flex-col shrink-0 fixed md:static inset-y-0 left-0 z-40 transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="w-6 h-6 object-contain" />
            <span className="font-[family-name:var(--font-brand)] font-bold text-lg text-emerald-700 tracking-tight">
              Leafmood
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-stone-400 md:hidden"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-stone-200">
          <Link
            href="/products"
            className="block px-3 py-2 rounded-lg text-sm text-stone-500 hover:bg-stone-50 transition"
          >
            ← Về trang khách hàng
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-stone-600 md:hidden"
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="font-semibold text-stone-800 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-sm text-stone-600">
              {user.fullName}{" "}
              <span className="text-stone-400">- Quản trị viên</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-stone-500 hover:text-red-600 transition"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
