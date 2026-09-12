# 🌿 Vegan Cosmetics — Website mỹ phẩm thuần chay tích hợp Chatbot AI

> Tiểu luận tốt nghiệp ngành Kỹ thuật phần mềm — **Đại học Cần Thơ (CT505)**.
> Website thương mại điện tử bán mỹ phẩm thuần chay, tích hợp **chatbot AI phân tích thành phần độc hại** và tư vấn sản phẩm theo loại da.

## ✨ Tính năng

**Người dùng**
- Đăng ký / đăng nhập (JWT + bcrypt), hồ sơ **loại da** riêng
- Duyệt & lọc sản phẩm theo danh mục, **gợi ý theo loại da**
- **So sánh sản phẩm** · **Danh sách yêu thích** · Giỏ hàng
- Đặt hàng, theo dõi trạng thái đơn, đánh giá sản phẩm
- **Chatbot AI**: hỏi về thành phần mỹ phẩm, nhận tư vấn theo loại da

**Quản trị**
- Quản lý sản phẩm · danh mục · đơn hàng · trạng thái đơn
- Khuyến mãi · banner · phương thức thanh toán
- **Thống kê doanh thu**, xuất báo cáo **Excel / PDF**
- Quản lý **kho tri thức (knowledge base)** cho chatbot

## 🤖 Chatbot — cách hoạt động

Dùng **RAG (Retrieval-Augmented Generation)** với **Google Gemini**:

1. Tài liệu da liễu / thành phần mỹ phẩm được chia nhỏ, tạo **embedding**, lưu vào collection `knowledge_base`
2. Câu hỏi của người dùng cũng được tạo embedding
3. Tìm đoạn tài liệu liên quan nhất bằng **cosine similarity**
4. Ghép ngữ cảnh đó vào prompt gửi Gemini → câu trả lời **bám tài liệu thật**, giảm bịa đặt

> ⚠️ **Ghi chú trung thực:** phần tìm kiếm vector hiện **tính cosine similarity trực tiếp trong code** (`backend/utils/gemini.js`), **chưa dùng MongoDB Atlas Vector Search**. Đủ dùng ở quy mô đồ án; muốn mở rộng thì nên chuyển sang Atlas Vector Search.

## 🛠 Công nghệ

| Tầng | Dùng gì |
|---|---|
| **Frontend** | Next.js 14 (App Router) · React 18 · Tailwind CSS · lucide-react · react-markdown |
| **Backend** | Node.js · Express 4 · Mongoose |
| **Database** | MongoDB Atlas |
| **Xác thực** | JWT · bcryptjs |
| **AI** | Google Gemini API (embedding + generate) |
| **Báo cáo** | ExcelJS · PDFKit |

## 📁 Cấu trúc

```
├── backend/
│   ├── config/         # ket noi MongoDB
│   ├── models/         # 13 collection: User, Product, Order, Cart, Review,
│   │                   #   Wishlist, Category, Promotion, Banner, ChatSession,
│   │                   #   KnowledgeBase, OrderStatus, PaymentMethod
│   ├── controllers/    # xu ly nghiep vu
│   ├── routes/         # 15 nhom API
│   ├── middleware/     # protect / requireAdmin
│   ├── utils/          # gemini.js (RAG) · promotion.js · format.js
│   └── server.js
└── frontend/
    ├── app/            # products · cart · checkout · orders · account
    │                   #   · wishlist · compare · login · admin
    ├── components/
    └── lib/
```

## 🚀 Chạy thử

```bash
# 1. Backend
cd backend
npm install
# tao file bien moi truong theo mau ben duoi
npm run dev          # http://localhost:5000

# 2. Frontend (terminal khac)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**Biến môi trường**

Tạo file môi trường trong `backend/` với các khoá sau:

```
MONGODB_URI=...        # chuoi ket noi MongoDB Atlas
JWT_SECRET=...         # chuoi bi mat ky JWT
JWT_EXPIRES_IN=...     # thoi han token, vi du 7d
GEMINI_API_KEY=...     # API key Google Gemini
PORT=5000              # cong chay backend (mac dinh 5000)
```

Bên `frontend/` *(tuỳ chọn)*:

```
NEXT_PUBLIC_API_URL=http://localhost:5000   # mac dinh da la gia tri nay
```

---

*Đồ án cá nhân — Bùi Phúc Thịnh*
