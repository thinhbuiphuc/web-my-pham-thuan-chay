import { Playfair_Display } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/chat/ChatWidget";
import ConditionalFooter from "@/components/layout/ConditionalFooter";

// Font rieng cho ten thuong hieu "Thuan Chay Beauty" - dung o Header/AdminLayout/
// AuthPage/ChatWidget, giup ten web noi bat thay vi dung chung font mac dinh
const brandFont = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700"],
  variable: "--font-brand",
});

export const metadata = {
  title: "Leafmood - Mỹ phẩm thuần chay",
  description:
    "Phân tích thành phần & tư vấn mỹ phẩm thuần chay tích hợp AI",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={brandFont.variable}>
      <body>
        {children}
        <ConditionalFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
