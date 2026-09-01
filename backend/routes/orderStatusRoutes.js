const express = require("express");
const router = express.Router();
const { getOrderStatuses } = require("../controllers/orderStatusController");

// Xem trang thai don hang - khong can dang nhap
router.get("/", getOrderStatuses);

module.exports = router;
