"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * An Footer o khu vuc Admin (AdminLayout da co bo cuc sidebar rieng),
 * chi hien cho cac trang khach hang.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <Footer />;
}
