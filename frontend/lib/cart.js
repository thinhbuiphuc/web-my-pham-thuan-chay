import { API_BASE_URL, authHeaders, getToken, handleAuthError } from "./api";

/**
 * Gio hang luu server-side qua API Cart (collection carts, quan he 1-1 voi User)
 * Thay the co che localStorage cu - dong bo gio hang giua nhieu thiet bi,
 * khop dung thiet ke Cart/CartItem trong so do lop.
 * Tat ca thao tac deu yeu cau dang nhap; khach chua dang nhap se nhan gio hang rong.
 */

const NOT_LOGGED_IN = {
  success: false,
  message: "Vui long dang nhap de dung gio hang",
};

export async function getCart() {
  if (!getToken()) return { items: [] };

  try {
    const res = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { ...authHeaders() },
    });
    const json = await res.json();
    if (handleAuthError(json)) return { items: [] };
    if (!res.ok || !json.success) return { items: [] };
    return json.data;
  } catch {
    return { items: [] };
  }
}

export async function addToCart(product, quantity = 1) {
  if (!getToken()) return NOT_LOGGED_IN;

  const res = await fetch(`${API_BASE_URL}/api/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ productId: product._id, quantity }),
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("cartUpdated"));
  return json;
}

export async function updateCartQuantity(productId, quantity) {
  if (!getToken()) return NOT_LOGGED_IN;

  if (quantity <= 0) {
    return removeFromCart(productId);
  }

  const res = await fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ quantity }),
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("cartUpdated"));
  return json;
}

export async function removeFromCart(productId) {
  if (!getToken()) return NOT_LOGGED_IN;

  const res = await fetch(`${API_BASE_URL}/api/cart/items/${productId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("cartUpdated"));
  return json;
}

export async function clearCart() {
  if (!getToken()) return NOT_LOGGED_IN;

  const res = await fetch(`${API_BASE_URL}/api/cart`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("cartUpdated"));
  return json;
}

export async function getCartCount() {
  const cart = await getCart();
  return (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
}

// Gia thuc te se tinh tien cho 1 san pham - uu tien discountedPrice (neu co
// khuyen mai dang hoat dong tra ve tu backend), fallback ve price goc
export function getEffectivePrice(product) {
  return product?.discountedPrice ?? product?.price ?? 0;
}

export function getCartTotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + getEffectivePrice(item.productId) * item.quantity,
    0
  );
}
