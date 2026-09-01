const express = require("express");
const router = express.Router();
const { getPaymentMethods } = require("../controllers/paymentMethodController");

// Xem phuong thuc thanh toan - khong can dang nhap (phuc vu dropdown Checkout)
router.get("/", getPaymentMethods);

module.exports = router;
