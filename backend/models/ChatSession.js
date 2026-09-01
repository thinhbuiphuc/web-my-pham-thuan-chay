const mongoose = require("mongoose");

/**
 * Collection: chat_sessions
 * Luu lich su hoi thoai Chatbot AI - phuc vu UC05, UC06
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "chatbot"],
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "image_url"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // cho phep an danh neu chua dang nhap
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
