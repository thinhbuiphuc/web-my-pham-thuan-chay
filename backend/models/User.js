const mongoose = require("mongoose");

/**
 * Collection: users
 * Quan ly tai khoan Khach hang / Admin, tich hop skinProfile
 * (UC02, UC05, UC06)
 */
const skinProfileSchema = new mongoose.Schema(
  {
    skinType: {
      type: String,
      enum: ["da_dau", "da_kho", "da_hon_hop", "da_nhay_cam", "chua_xac_dinh"],
      default: "chua_xac_dinh",
    },
    allergicIngredients: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/**
 * So dia chi giao hang cua 1 tai khoan - khach co the luu nhieu dia chi
 * (nha rieng, cong ty...) va chon lai luc dat hang, thay vi go tay moi lan
 */
const addressSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: [true, "Ten nguoi nhan la bat buoc"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "So dien thoai nguoi nhan la bat buoc"],
    trim: true,
  },
  addressText: {
    type: String,
    required: [true, "Dia chi la bat buoc"],
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email la bat buoc"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "So dien thoai la bat buoc"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Mat khau la bat buoc"],
      minlength: 6,
      select: false, // khong tra ve password khi query mac dinh
    },
    fullName: {
      type: String,
      required: [true, "Ho ten la bat buoc"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    skinProfile: {
      type: skinProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

module.exports = mongoose.model("User", userSchema);
