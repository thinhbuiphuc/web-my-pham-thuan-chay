"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  User,
  Settings,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { getCartCount } from "@/lib/cart";

/**
 * Header dieu huong dung chung cho cac trang Product/Cart/Order/Account.
 */
export default function Header() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }

    const loadCartCount = async () => setCartCount(await getCartCount());
    loadCartCount();
    window.addEventListener("cartUpdated", loadCartCount);
    return () => window.removeEventListener("cartUpdated", loadCartCount);
  }, []);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="w-7 h-7 object-contain" />
          <span className="font-[family-name:var(--font-brand)] font-bold text-lg text-emerald-700 tracking-tight">
            Leafmood
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link
            href="/products"
            className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
          >
            <ShoppingBag size={16} /> Sản phẩm
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
          >
            <ShoppingCart size={16} /> Giỏ hàng
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-emerald-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <Link
                href="/orders"
                className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <ClipboardList size={16} /> Đơn hàng
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <Heart size={16} /> Yêu thích
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
                >
                  <Settings size={16} /> Quản trị
                </Link>
              )}
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <User size={16} /> Tài khoản
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Đăng nhập
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link href="/cart" className="relative text-stone-600">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Mở menu"
            className="text-stone-600"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-stone-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm">
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
          >
            <ShoppingBag size={16} /> Sản phẩm
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
          >
            <ShoppingCart size={16} /> Giỏ hàng
            {cartCount > 0 && ` (${cartCount})`}
          </Link>

          {user ? (
            <>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <ClipboardList size={16} /> Đơn hàng
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <Heart size={16} /> Yêu thích
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
                >
                  <Settings size={16} /> Quản trị
                </Link>
              )}
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 text-stone-600 hover:text-emerald-700 transition"
              >
                <User size={16} /> Tài khoản
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 text-center py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
