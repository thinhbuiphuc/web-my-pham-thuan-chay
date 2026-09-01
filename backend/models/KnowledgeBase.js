const mongoose = require("mongoose");

/**
 * Collection: knowledge_base
 * Co so tri thuc RAG - phuc vu UC10 (Huan luyen Chatbot / Tai tai lieu RAG)
 * embeddingVector: mang 1536 chieu (chuan OpenAI text-embedding-ada-002)
 */
const knowledgeBaseSchema = new mongoose.Schema(
  {
    documentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    textChunk: {
      type: String,
      required: true,
    },
    embeddingVector: {
      type: [Number],
      default: [],
    },
    metadata: {
      pageNumber: { type: Number },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
