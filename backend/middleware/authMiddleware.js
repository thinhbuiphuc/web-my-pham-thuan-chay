const jwt = require("jsonwebtoken");

/**
 * Middleware kiem tra JWT hop le, gan req.user de cac route sau
 * (Product, Order, Admin...) su dung phan quyen.
 * Se duoc dung lai cho UC07 (Dang nhap Admin) va cac UC <<include>> khac.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập, vui lòng đăng nhập",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    // Rieng loi nay dung them field "code" (khac voi sai email/mat khau luc
    // dang nhap hay sai mat khau cu luc doi mat khau - cung tra 401 nhung
    // KHONG phai loi token) - de frontend phan biet chinh xac truong hop nao
    // can tu dong dang xuat + chuyen ve trang dang nhap, tranh dang xuat oan
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại",
      code: "TOKEN_INVALID",
    });
  }
};

/**
 * Middleware phan quyen Admin - dung cho UC07/UC08/UC09/UC10
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Ban khong co quyen truy cap vao phan he nay",
    });
  }
  next();
};

/**
 * Middleware xac thuc tuy chon - dung cho Chatbot (UC05, UC06), cho phep
 * ca khach an danh lan khach da dang nhap. Neu co token hop le thi gan
 * req.user, neu khong co/token sai thi van cho qua (khong chan request).
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Token sai/het han - coi nhu khach an danh, khong chan request
  }

  next();
};

module.exports = { protect, requireAdmin, optionalAuth };
