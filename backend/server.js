require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");
const orderStatusRoutes = require("./routes/orderStatusRoutes");
const knowledgeBaseRoutes = require("./routes/knowledgeBaseRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const statsRoutes = require("./routes/statsRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

const app = express();

// Middleware co ban
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ket noi MongoDB
connectDB();

// Route kiem tra server song
app.get("/", (req, res) => {
  res.json({
    message:
      "API Website My pham thuan chay tich hop Chatbot AI - dang hoat dong",
  });
});

// Cac nhom route nghiep vu
app.use("/api/auth", authRoutes); // UC02 + Quan ly tai khoan ca nhan
app.use("/api/products", productRoutes); // UC01, UC04, UC08
app.use("/api/orders", orderRoutes); // UC03, UC09
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/order-statuses", orderStatusRoutes);
app.use("/api/knowledge-base", knowledgeBaseRoutes); // UC10
app.use("/api/chat", chatRoutes); // UC05, UC06
app.use("/api/users", userRoutes); // Admin: quan ly tai khoan khach hang
app.use("/api/promotions", promotionRoutes); // Admin: quan ly ma giam gia
app.use("/api/banners", bannerRoutes); // Banner trang chu
app.use("/api/stats", statsRoutes); // Admin: thong ke dashboard
app.use("/api/wishlist", wishlistRoutes); // Danh sach san pham yeu thich

// Middleware xu ly loi tap trung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Da co loi xay ra phia server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server dang chay tai http://localhost:${PORT}`);
});
