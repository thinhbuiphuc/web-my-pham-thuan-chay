# Backend - Website Mỹ phẩm Thuần chay tích hợp Chatbot AI

Tiến độ hiện tại (Tuần 9): **Setup project + Thiết kế 5 Collection MongoDB + API Đăng ký/Đăng nhập (UC02)**

## Cấu trúc thư mục

```
backend/
├── config/
│   └── db.js                 # Kết nối MongoDB Atlas qua Mongoose
├── models/                   # 5 Collection đúng theo thiết kế mục 2.3.1
│   ├── User.js                # users
│   ├── Product.js             # products
│   ├── Order.js               # orders
│   ├── ChatSession.js         # chat_sessions
│   └── KnowledgeBase.js       # knowledge_base
├── controllers/
│   └── authController.js     # Logic đăng ký / đăng nhập (bcrypt + JWT)
├── routes/
│   └── authRoutes.js         # /api/auth/register, /api/auth/login
├── middleware/
│   └── authMiddleware.js     # protect + requireAdmin (dùng cho các UC sau)
├── server.js                 # Entry point Express
├── package.json
└── .env.example
```

## Cài đặt & chạy thử

```bash
cd backend
npm install
cp .env.example .env      # rồi điền MONGODB_URI + JWT_SECRET thật
npm run dev                # chạy với nodemon (hot reload)
```

## Test nhanh API bằng Postman/curl

**Đăng ký (UC02 - nhánh Đăng ký):**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"123456","fullName":"Nguyen Van A","skinType":"da_nhay_cam"}'
```

**Đăng nhập (UC02 - nhánh Đăng nhập):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"123456"}'
```

## Việc tiếp theo (kế hoạch tuần sau)

- [ ] Product API: CRUD sản phẩm + lọc theo `targetSkinTypes` (UC01, UC04, UC08)
- [ ] Order API: giỏ hàng, đặt hàng, cập nhật `stockQuantity` (UC03, UC09)
- [ ] Tích hợp OpenAI/Gemini API cho module Chatbot (UC05, UC06)
- [ ] Module RAG: chunking + embedding tài liệu da liễu (UC10)
- [ ] Frontend Next.js kết nối các API trên
