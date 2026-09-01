const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Sinh JWT token cho user (dung id + role de phan quyen)
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Kiem tra dinh dang Email co hop le khong (dac ta UC02 - buoc 1a.2)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * UC02 - Nhanh Dang ky
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, phone, skinType } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap day du Ho ten, Email, So dien thoai va Mat khau",
      });
    }

    // Dac ta UC02 - buoc 1a.2: kiem tra dinh dang Email hop le
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Dinh dang Email khong hop le, vui long kiem tra lai",
      });
    }

    // Dac ta UC02 - buoc 1a.2: kiem tra do manh mat khau (toi thieu 6 ky tu)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mat khau phai co it nhat 6 ky tu",
      });
    }

    // Exc 2: Trung lap Email khi Dang ky
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "Email nay da duoc dang ky tai khoan tren he thong, vui long su dung Email khac hoac chon Dang nhap",
      });
    }

    // Bcrypt bam mat khau mot chieu truoc khi luu (Business Rule UC02)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phone,
      role: "customer",
      skinProfile: { skinType: skinType || "chua_xac_dinh" },
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Dang ky thanh cong",
      data: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    // Loi validate tu Mongoose (vd: password/phone khong dat yeu cau schema)
    // tra ve 400 voi thong bao de hieu, thay vi 500 chung chung
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
 * UC02 - Nhanh Dang nhap
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap Email va Mat khau",
      });
    }

    // Can lay ca password (mac dinh bi select:false trong schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    // Exc 1: Sai thong tin dang nhap hoac tai khoan khong ton tai
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong chinh xac, vui long kiem tra lai",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong chinh xac, vui long kiem tra lai",
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Tai khoan da bi khoa, vui long lien he quan tri vien",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Chao mung ${user.fullName} quay tro lai!`,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    // Loi validate tu Mongoose (vd: password/phone khong dat yeu cau schema)
    // tra ve 400 voi thong bao de hieu, thay vi 500 chung chung
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
 * Quan ly tai khoan ca nhan - Xem thong tin ca nhan
 * GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lay thong tin ca nhan thanh cong",
      data: user,
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
 * Quan ly tai khoan ca nhan - Cap nhat thong tin ca nhan
 * PUT /api/auth/profile
 * Body: { fullName, phone, skinProfile: { skinType, allergicIngredients } }
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, skinProfile } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (skinProfile) updateData.skinProfile = skinProfile;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cap nhat thong tin ca nhan thanh cong",
      data: user,
    });
  } catch (error) {
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
 * Quan ly tai khoan ca nhan - Doi mat khau
 * PUT /api/auth/change-password
 * Body: { oldPassword, newPassword }
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap Mat khau cu va Mat khau moi",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mat khau moi phai co it nhat 6 ky tu",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mat khau cu khong chinh xac",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Doi mat khau thanh cong",
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
 * So dia chi giao hang - Them 1 dia chi moi
 * POST /api/auth/addresses
 * Body: { recipientName, phone, addressText, isDefault }
 */
exports.addAddress = async (req, res) => {
  try {
    const { recipientName, phone, addressText, isDefault } = req.body;

    if (!recipientName || !phone || !addressText) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap day du Nguoi nhan, So dien thoai va Dia chi",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    // Dia chi dau tien luon la mac dinh, hoac neu nguoi dung tu chon isDefault
    const shouldBeDefault = user.addresses.length === 0 || isDefault === true;
    if (shouldBeDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      recipientName,
      phone,
      addressText,
      isDefault: shouldBeDefault,
    });
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Them dia chi thanh cong",
      data: user,
    });
  } catch (error) {
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
 * So dia chi giao hang - Sua 1 dia chi da co
 * PUT /api/auth/addresses/:addressId
 * Body: { recipientName, phone, addressText, isDefault }
 */
exports.updateAddress = async (req, res) => {
  try {
    const { recipientName, phone, addressText, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay dia chi",
      });
    }

    if (recipientName !== undefined) address.recipientName = recipientName;
    if (phone !== undefined) address.phone = phone;
    if (addressText !== undefined) address.addressText = addressText;

    if (isDefault === true) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      address.isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cap nhat dia chi thanh cong",
      data: user,
    });
  } catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") {
      const firstMessage =
        error.errors &&
        Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
      return res.status(400).json({
        success: false,
        message: firstMessage || "Khong tim thay dia chi hoac du lieu khong hop le",
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
 * So dia chi giao hang - Xoa 1 dia chi
 * DELETE /api/auth/addresses/:addressId
 */
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tai khoan",
      });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay dia chi",
      });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.addressId);

    // Neu vua xoa dia chi mac dinh ma van con dia chi khac, tu dong gan dia chi dau tien lam mac dinh moi
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Xoa dia chi thanh cong",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
