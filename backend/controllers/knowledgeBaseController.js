const KnowledgeBase = require("../models/KnowledgeBase");
const { embedText } = require("../utils/gemini");

/**
 * UC10 (Admin) - Nap 1 doan tri thuc moi vao kho RAG
 * POST /api/knowledge-base
 * Body: { documentTitle, textChunk, pageNumber }
 * Tam thoi admin goi API truc tiep (hoac qua script seed) thay vi upload file/OCR that.
 */
exports.createKnowledgeEntry = async (req, res) => {
  try {
    const { documentTitle, textChunk, pageNumber } = req.body;

    if (!documentTitle || !textChunk) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap Tieu de tai lieu va Noi dung",
      });
    }

    const embeddingVector = await embedText(textChunk);

    const entry = await KnowledgeBase.create({
      documentTitle,
      textChunk,
      embeddingVector,
      metadata: {
        pageNumber,
        uploadedBy: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Nap tri thuc thanh cong",
      data: entry,
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
 * UC10 (Admin) - Xoa 1 doan tri thuc khoi kho RAG
 * DELETE /api/knowledge-base/:id
 */
exports.deleteKnowledgeEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tri thuc",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xoa tri thuc thanh cong",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay tri thuc",
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
 * UC10 (Admin) - Xem danh sach tri thuc da nap
 * GET /api/knowledge-base
 */
exports.getKnowledgeEntries = async (req, res) => {
  try {
    const entries = await KnowledgeBase.find()
      .select("-embeddingVector") // vector 1536 chieu khong can tra ve cho UI
      .populate("metadata.uploadedBy", "fullName")
      .sort({ "metadata.uploadedAt": -1 });

    return res.status(200).json({
      success: true,
      message: "Lay danh sach tri thuc thanh cong",
      data: entries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
