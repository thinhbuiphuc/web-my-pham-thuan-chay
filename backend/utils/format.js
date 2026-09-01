/**
 * Dinh dang so tien theo kieu Viet Nam (vd: 1234000 -> "1.234.000d")
 * Dung chung cho cac file xuat bao cao (Excel/PDF)
 */
function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")}d`;
}

module.exports = { formatVND };
