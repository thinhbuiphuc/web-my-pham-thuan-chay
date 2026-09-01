import Link from "next/link";
import { Leaf, Globe, Share2, Mail, Phone } from "lucide-react";

/**
 * Footer dung chung cho khu vuc khach hang (khong hien o /admin).
 */
export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={20} className="text-emerald-400" />
            <span className="font-[family-name:var(--font-brand)] font-bold text-lg text-white tracking-tight">
              Leafmood
            </span>
          </div>
          <p className="text-sm text-stone-400 leading-relaxed">
            Mỹ phẩm thuần chay, lành tính, tích hợp trợ lý AI tư vấn thành
            phần để bạn an tâm chăm sóc làn da mỗi ngày.
          </p>
        </div>

        <div>
          <h3 className="text-white font-medium text-sm mb-3">Liên kết nhanh</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-emerald-400 transition">
                Sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-emerald-400 transition">
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-emerald-400 transition">
                Đăng nhập / Đăng ký
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium text-sm mb-3">Liên hệ</h3>
          <ul className="space-y-2 text-sm text-stone-400">
            <li className="flex items-center gap-2">
              <Mail size={14} /> thinhdc2196n900@vlvh.ctu.edu.vn
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} /> 0878 861 875
            </li>
          </ul>
          <div className="flex items-center gap-3 mt-4">
            <a
              href="#"
              aria-label="Facebook"
              className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center hover:bg-emerald-600 transition"
            >
              <Globe size={15} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center hover:bg-emerald-600 transition"
            >
              <Share2 size={15} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Leafmood. Đồ án tốt nghiệp Kỹ
        thuật phần mềm.
      </div>
    </footer>
  );
}
