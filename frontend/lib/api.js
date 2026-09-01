export const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")}đ`;
}

/**
 * Kiem tra 1 response API co phai loi token het han/khong hop le khong (dua
 * theo "code" backend tra ve, KHONG dua vao ma HTTP 401 don thuan - vi 401
 * con dung cho sai email/mat khau luc dang nhap hoac sai mat khau cu luc doi
 * mat khau, khong lien quan gi den token). Neu dung, tu dong xoa phien dang
 * nhap cu + chuyen ve trang dang nhap kem thong bao, tranh nguoi dung thay
 * loi kho hieu "Token khong hop le" ma khong biet phai lam gi.
 * Goi ngay sau khi nhan response loi, truoc khi hien thi message len UI:
 *   if (handleAuthError(json)) return;
 * Tra ve true neu da xu ly (component nen dung lai, khong hien loi nua).
 */
export function handleAuthError(json) {
  if (typeof window === "undefined") return false;
  if (json?.code !== "AUTH_REQUIRED" && json?.code !== "TOKEN_INVALID") {
    return false;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login?expired=1";
  return true;
}
