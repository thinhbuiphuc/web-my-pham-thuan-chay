const Review = require("../models/Review");
const Order = require("../models/Order");
const OrderStatus = require("../models/OrderStatus");

/**
 * Lay danh sach productId ma chinh user dang dang nhap da tung danh gia -
 * dung o trang Don hang de biet nut nao hien "Danh gia" / "Da danh gia"
 * GET /api/reviews/mine
 */
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }).select("productId");

    return res.status(200).json({
      success: true,
      message: "Lay danh sach danh gia cua ban thanh cong",
      data: reviews.map((r) => r.productId.toString()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * Tao danh gia san pham - chi cho phep neu user da tung mua san pham nay
 * POST /api/reviews
 * Body: { productId, rating, comment }
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Vui long chon san pham va nhap so sao danh gia",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "So sao danh gia phai tu 1 den 5",
      });
    }

    // Chi cho danh gia neu co don hang chua san pham nay VA don do da o
    // trang thai "Da giao" - khop dung yeu cau checklist (danh gia sau khi
    // nhan hang), khong chi can "da tung dat hang" nhu truoc
    const deliveredStatus = await OrderStatus.findOne({ name: "Đã giao" });
    const hasReceivedProduct = await Order.exists({
      customerId: req.user.id,
      "items.productId": productId,
      orderStatusId: deliveredStatus?._id,
    });

    if (!hasReceivedProduct) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn cần mua và nhận được sản phẩm này (đơn hàng ở trạng thái \"Đã giao\") trước khi đánh giá",
      });
    }

    const review = await Review.create({
      productId,
      userId: req.user.id,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Danh gia san pham thanh cong",
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ban da danh gia san pham nay roi",
      });
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Du lieu nhap vao khong hop le",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xem toan bo danh gia trong he thong
 * GET /api/reviews
 */
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "fullName email")
      .populate("productId", "name sku")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach danh gia thanh cong",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Duyet/an 1 danh gia - dao nguoc isHidden, khong xoa du lieu.
 * Danh gia bi an se khong hien trong trang chi tiet san pham va khong tinh
 * vao diem trung binh, nhung Admin van xem lai duoc trong trang quan ly.
 * PATCH /api/reviews/:id/visibility
 */
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh gia",
      });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    return res.status(200).json({
      success: true,
      message: review.isHidden ? "Da an danh gia" : "Da hien lai danh gia",
      data: review,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh gia",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * (Admin) Xoa 1 danh gia khong phu hop
 * DELETE /api/reviews/:id
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh gia",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa danh gia thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay danh gia",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * Xem danh sach danh gia cua 1 san pham
 * GET /api/reviews/product/:productId
 */
exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      isHidden: { $ne: true },
    })
      .populate("userId", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach danh gia thanh cong",
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
