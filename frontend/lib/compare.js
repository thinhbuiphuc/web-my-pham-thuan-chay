/**
 * Chon san pham de so sanh - luu client-side qua sessionStorage (khong can
 * dang nhap, khong can API rieng vi chi la lua chon tam thoi cua 1 phien duyet).
 * Toi da MAX_COMPARE san pham cung luc.
 */

export const COMPARE_KEY = "compareProductIds";
export const MAX_COMPARE = 4;

export function getCompareIds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(COMPARE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setCompareIds(ids) {
  sessionStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("compareUpdated"));
}

export function toggleCompareId(id) {
  const current = getCompareIds();

  if (current.includes(id)) {
    setCompareIds(current.filter((i) => i !== id));
    return { success: true };
  }

  if (current.length >= MAX_COMPARE) {
    return {
      success: false,
      message: `Chỉ so sánh được tối đa ${MAX_COMPARE} sản phẩm cùng lúc`,
    };
  }

  setCompareIds([...current, id]);
  return { success: true };
}

export function removeCompareId(id) {
  setCompareIds(getCompareIds().filter((i) => i !== id));
}

export function clearCompare() {
  setCompareIds([]);
}
