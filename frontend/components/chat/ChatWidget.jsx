"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL, authHeaders, handleAuthError } from "@/lib/api";

// Cac the markdown AI hay dung (dam, danh sach, doan van) - custom lai margin
// mac dinh cho vua khung chat nho, khong dung style "prose" mac dinh (qua to)
const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {children}
    </a>
  ),
};

const SESSION_KEY = "chatSessionId";

/**
 * ChatWidget - UC05/UC06: widget chat noi goc phai, goi POST /api/chat (RAG)
 * Dung duoc ca khi chua dang nhap (khach an danh) - dung optionalAuth o backend.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "chatbot",
      content:
        "Xin chào 🌿 Mình là trợ lý AI tư vấn thành phần mỹ phẩm thuần chay. Bạn có thể hỏi mình về hoạt chất, nguy cơ kích ứng, hoặc sản phẩm phù hợp với làn da của bạn.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { sender: "user", content: text }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem(SESSION_KEY)
          : null;

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setError(json.message || "Chatbot đang gặp sự cố, vui lòng thử lại sau");
        return;
      }

      if (json.data.sessionId) {
        localStorage.setItem(SESSION_KEY, json.data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        { sender: "chatbot", content: json.data.answer },
      ]);
    } catch (err) {
      setError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-xl border border-stone-200 flex flex-col overflow-hidden">
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon-white.png" alt="" className="w-5 h-5 object-contain" />
              Trợ lý AI{" "}
              <span className="font-[family-name:var(--font-brand)] font-bold tracking-tight">
                Leafmood
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Thu nhỏ"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-stone-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-white border border-stone-200 text-stone-700 rounded-bl-sm"
                  }`}
                >
                  {m.sender === "chatbot" ? (
                    <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 text-stone-400 text-sm px-3 py-2 rounded-xl rounded-bl-sm">
                  Đang trả lời...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="border-t border-stone-200 p-2.5 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về thành phần, kích ứng da..."
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-emerald-600 text-white text-2xl shadow-lg hover:bg-emerald-700 transition flex items-center justify-center"
        aria-label="Mở trợ lý AI"
      >
        {open ? (
          "✕"
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-icon-white.png" alt="" className="w-7 h-7 object-contain" />
        )}
      </button>
    </div>
  );
}
