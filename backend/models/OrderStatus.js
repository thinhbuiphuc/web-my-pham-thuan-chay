const mongoose = require("mongoose");

/**
 * Collection: orderstatuses
 * Trang thai xu ly don hang (cho xac nhan, da xac nhan, dang chuan bi hang, da huy...)
 * Order tham chieu toi OrderStatus qua orderStatusId, sortOrder dung de sap xep quy trinh
 */
const orderStatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ten trang thai don hang la bat buoc"],
    trim: true,
  },
  sortOrder: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("OrderStatus", orderStatusSchema);
