const ChatSession = require("../models/ChatSession");
const KnowledgeBase = require("../models/KnowledgeBase");
const User = require("../models/User");
const { embedText, generateAnswer, cosineSimilarity } = require("../utils/gemini");

const TOP_K = 4; // so doan tri thuc gan nghia nhat lay ra lam ngu canh RAG

/**
 * UC05/UC06 - Gui tin nhan cho Chatbot AI (RAG)
 * POST /api/chat
 * Body: { sessionId?, message }
 * Cho phep khach an danh (khong can dang nhap, dung optionalAuth)
 *
 * Luong xu ly: embed cau hoi -> so khop cosine similarity brute-force voi
 * toan bo knowledge_base (thay cho MongoDB Atlas Vector Search, du dung cho
 * quy mo du lieu nho hien tai) -> lay top K doan gan nghia nhat -> ghep them
 * ho so di ung ca nhan neu da dang nhap -> goi LLM sinh cau tra loi -> luu
 * ca cau hoi lan cau tra loi vao ChatSession.
 */
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap cau hoi",
      });
    }

    // Dung "new" thay vi "create" - chi thuc su ghi xuong DB o buoc session.save()
    // cuoi ham, tranh de lai ChatSession rong neu embed/generate loi giua chung
    let session = sessionId ? await ChatSession.findById(sessionId) : null;
    if (!session) {
      session = new ChatSession({
        customerId: req.user?.id || null,
        messages: [],
      });
    }

    const SKIN_TYPE_LABELS = {
      da_dau: "da dau",
      da_kho: "da kho",
      da_hon_hop: "da hon hop",
      da_nhay_cam: "da nhay cam",
    };

    let allergyNote = "";
    let skinTypeNote = "";
    let skinTypeLabel = "";
    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      const allergies = user?.skinProfile?.allergicIngredients || [];
      if (allergies.length > 0) {
        allergyNote = `Khach hang dang hoi bi di ung voi cac hoat chat sau, hay chu dong canh bao neu lien quan: ${allergies.join(", ")}.`;
      }

      const skinType = user?.skinProfile?.skinType;
      if (skinType && skinType !== "chua_xac_dinh") {
        skinTypeLabel = SKIN_TYPE_LABELS[skinType] || skinType;
        skinTypeNote = `Khach hang da luu ho so co loai da la: ${skinTypeLabel}. Hay uu tien tu van/goi y san pham phu hop voi loai da nay khi lien quan den cau hoi.`;
      }
    }

    // Ghep them loai da (neu biet) vao cau truy van truoc khi tao embedding,
    // giup RAG tim dung cac doan tri thuc/san pham phu hop loai da hon - vi
    // cau hoi cua khach thuong khong tu nhac ten loai da ("da hon hop"...).
    const queryForEmbedding = skinTypeLabel
      ? `${message} (loai da: ${skinTypeLabel})`
      : message;
    const queryVector = await embedText(queryForEmbedding);

    const knowledgeEntries = await KnowledgeBase.find();
    const topEntries = knowledgeEntries
      .map((entry) => ({
        entry,
        score: cosineSimilarity(queryVector, entry.embeddingVector),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);

    const contextChunks = topEntries.map((item) => item.entry.textChunk);

    const prompt = `Ban la tro ly AI tu van my pham thuan chay, chuyen phan tich thanh phan va canh bao kich ung da.
Uu tien tra loi dua tren cac doan tri thuc duoi day neu chung lien quan den cau hoi - day la tri thuc da duoc kiem chung, chinh xac cho san pham/hoat chat cua he thong. Neu khong tim thay doan tri thuc nao lien quan, hoac tri thuc co san khong du de tra loi day du cau hoi, hay dung kien thuc chuyen mon chung cua ban ve my pham/da lieu hoc de tra loi tiep - KHONG duoc tu choi tra loi hay noi "khong co du lieu". Trong truong hop phai dung kien thuc chung (ngoai tri thuc duoi day), hay neu ro 1 cau ngan de khach hang biet do la kien thuc pho thong, chua duoc he thong kiem chung rieng cho san pham cua cua hang.

${
  contextChunks.length > 0
    ? "Tri thuc tham khao (da kiem chung):\n" +
      contextChunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")
    : "(Khong tim thay tri thuc lien quan trong kho du lieu hien co - hay dung kien thuc chuyen mon chung de tra loi.)"
}

${skinTypeNote}
${allergyNote}

Cau hoi cua khach hang: ${message}

Hay tra loi ngan gon, de hieu, bang tieng Viet.`;

    const answer = await generateAnswer(prompt);

    session.messages.push({
      sender: "user",
      contentType: "text",
      content: message,
    });
    session.messages.push({
      sender: "chatbot",
      contentType: "text",
      content: answer,
    });
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Gui tin nhan thanh cong",
      data: {
        sessionId: session._id,
        answer,
        sourcesUsed: contextChunks.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Chatbot dang gap su co, vui long thu lai sau",
      error: error.message,
    });
  }
};

/**
 * Xem lai lich su 1 phien chat (dung khi nguoi dung reload trang)
 * GET /api/chat/:sessionId
 */
exports.getSessionHistory = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay phien chat",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lay lich su hoi thoai thanh cong",
      data: session,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay phien chat",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Loi may chu, vui long thu lai sau",
      error: error.message,
    });
  }
};
