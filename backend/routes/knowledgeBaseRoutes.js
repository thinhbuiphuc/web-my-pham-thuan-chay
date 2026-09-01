const express = require("express");
const router = express.Router();
const {
  createKnowledgeEntry,
  getKnowledgeEntries,
  deleteKnowledgeEntry,
} = require("../controllers/knowledgeBaseController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// UC10: Nap/xem/xoa tri thuc RAG - chi Admin
router.post("/", protect, requireAdmin, createKnowledgeEntry);
router.get("/", protect, requireAdmin, getKnowledgeEntries);
router.delete("/:id", protect, requireAdmin, deleteKnowledgeEntry);

module.exports = router;
