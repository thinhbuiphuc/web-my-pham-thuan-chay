/**
 * Wrapper goi Gemini API (Google) - dung cho Chatbot RAG (UC05, UC06, UC10)
 * Can bien moi truong GEMINI_API_KEY trong .env
 */

const EMBED_MODEL = "gemini-embedding-001";
const GENERATE_MODEL = "gemini-3.5-flash";
const EMBEDDING_DIMENSION = 1536; // khop dung thiet ke embeddingVector trong KnowledgeBase.js

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const RETRYABLE_STATUS = [503, 429]; // qua tai / rate limit tam thoi, dang thu lai co y nghia
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // tang dan: 1s, 2s

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGeminiWithRetry(url, options) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, options);
    const json = await res.json();

    if (res.ok) {
      return json;
    }

    lastError = new Error(
      `${json.error?.message || "khong ro nguyen nhan"}`
    );
    lastError.status = res.status;

    if (!RETRYABLE_STATUS.includes(res.status) || attempt === MAX_RETRIES) {
      throw lastError;
    }

    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }

  throw lastError;
}

/**
 * Chuyen 1 doan text thanh vector nhung (embedding) 1536 chieu
 */
async function embedText(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Chua cau hinh GEMINI_API_KEY trong .env");
  }

  try {
    const json = await fetchGeminiWithRetry(
      `${BASE_URL}/${EMBED_MODEL}:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSION,
        }),
      }
    );
    return json.embedding?.values || [];
  } catch (error) {
    throw new Error(`Gemini embedContent loi ${error.status}: ${error.message}`);
  }
}

/**
 * Goi LLM sinh cau tra loi dua tren prompt da ghep san (cau hoi + ngu canh RAG)
 */
async function generateAnswer(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Chua cau hinh GEMINI_API_KEY trong .env");
  }

  try {
    const json = await fetchGeminiWithRetry(
      `${BASE_URL}/${GENERATE_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    throw new Error(`Gemini generateContent loi ${error.status}: ${error.message}`);
  }
}

/**
 * Cosine similarity giua 2 vector cung so chieu - dung de brute-force
 * tim doan tri thuc gan nghia nhat voi cau hoi (thay cho MongoDB Atlas Vector Search)
 */
function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return -1;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { embedText, generateAnswer, cosineSimilarity, EMBEDDING_DIMENSION };
