import { API_BASE_URL, authHeaders, getToken, handleAuthError } from "./api";

/**
 * Danh sach san pham yeu thich luu server-side qua API Wishlist (collection
 * wishlists, quan he 1-1 voi User) - cung pattern voi lib/cart.js
 */

const NOT_LOGGED_IN = {
  success: false,
  message: "Vui long dang nhap de dung danh sach yeu thich",
};

export async function getWishlist() {
  if (!getToken()) return { productIds: [] };

  try {
    const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
      headers: { ...authHeaders() },
    });
    const json = await res.json();
    if (handleAuthError(json)) return { productIds: [] };
    if (!res.ok || !json.success) return { productIds: [] };
    return json.data;
  } catch {
    return { productIds: [] };
  }
}

export async function addToWishlist(productId) {
  if (!getToken()) return NOT_LOGGED_IN;

  const res = await fetch(`${API_BASE_URL}/api/wishlist/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ productId }),
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("wishlistUpdated"));
  return json;
}

export async function removeFromWishlist(productId) {
  if (!getToken()) return NOT_LOGGED_IN;

  const res = await fetch(`${API_BASE_URL}/api/wishlist/items/${productId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (handleAuthError(json)) return json;
  window.dispatchEvent(new Event("wishlistUpdated"));
  return json;
}
