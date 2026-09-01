import React, { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";

export interface AiMessage {
  id: string;
  role: Role;
  text: string;
  time?: string;
}

export interface AiChatWidgetProps {
  title?: string;
  initialMessages?: AiMessage[];
  openByDefault?: boolean;
  onSend?: (message: AiMessage) => Promise<AiMessage | void>;
}

const formatTime = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AiChatWidget({
  title = "AI Chat",
  initialMessages = [],
  openByDefault = false,
  onSend,
}: AiChatWidgetProps) {
  const [open, setOpen] = useState(openByDefault);
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (m: AiMessage) =>
    setMessages((prev) => [...prev, { ...m, time: m.time ?? formatTime() }]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    const userMessage: AiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      time: formatTime(),
    };

    addMessage(userMessage);
    setInput("");

    try {
      if (onSend) {
        // let caller handle sending and optionally return assistant message
        const result = await onSend(userMessage);
        if (result) addMessage(result);
      } else {
        // default local behavior: simulate an assistant reply
        await new Promise((r) => setTimeout(r, 700));
        const assistantMessage: AiMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `Відповідь: ${text}`,
          time: formatTime(),
        };
        addMessage(assistantMessage);
      }
    } catch (err) {
      const errMsg: AiMessage = {
        id: `e-${Date.now()}`,
        role: "assistant",
        text: "Сталася помилка при надсиланні повідомлення.",
        time: formatTime(),
      };
      addMessage(errMsg);
      // rethrow if caller wants to handle
      // throw err;
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // basic inline styles so the component works without external CSS
  const styles: { [k: string]: React.CSSProperties } = {
    wrapper: {
      position: "fixed",
      right: 20,
      bottom: 20,
      width: 340,
      maxHeight: "60vh",
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      borderRadius: 12,
      overflow: "hidden",
      fontFamily: "Inter, Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
      background: "#fff",
      zIndex: 9999,
    },
    header: {
      background: "linear-gradient(90deg,#4f46e5,#06b6d4)",
      color: "#fff",
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
    },
    title: {
      fontSize: 14,
      fontWeight: 600,
    },
    body: {
      display: open ? "flex" : "none",
      flexDirection: "column",
      height: "100%",
    },
    messages: {
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      overflowY: "auto",
      maxHeight: "calc(60vh - 120px)",
      background: "#f8fafc",
    },
    msgUser: {
      alignSelf: "flex-end",
      background: "#111827",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: 12,
      maxWidth: "80%",
      whiteSpace: "pre-wrap",
      fontSize: 14,
    },
    msgAssistant: {
      alignSelf: "flex-start",
      background: "#eef2ff",
      color: "#0f172a",
      padding: "8px 12px",
      borderRadius: 12,
      maxWidth: "80%",
      whiteSpace: "pre-wrap",
      fontSize: 14,
    },
    inputRow: {
      display: "flex",
      gap: 8,
      padding: 12,
      borderTop: "1px solid rgba(15,23,42,0.06)",
      background: "#fff",
      alignItems: "center",
    },
    input: {
      flex: 1,
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid #e6e9ef",
      fontSize: 14,
    },
    sendBtn: {
      background: "#4f46e5",
      color: "#fff",
      border: "none",
      padding: "8px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
    },
    footerNote: {
      padding: "6px 12px",
      fontSize: 12,
      color: "#475569",
    },
  };

  return (
    <div style={styles.wrapper} aria-live="polite">
      <div
        style={styles.header}
        role="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div style={styles.title}>{title}</div>
        <div style={{ fontSize: 12 }}>{open ? "Закрити" : "Відкрити"}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.messages} ref={listRef}>
          {messages.length === 0 && (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Почніть розмову — введіть повідомлення нижче.
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} style={m.role === "user" ? styles.msgUser : styles.msgAssistant}>
              <div style={{ marginBottom: 6, opacity: 0.9 }}>{m.text}</div>
              <div style={{ fontSize: 11, opacity: 0.6, textAlign: m.role === "user" ? "right" : "left" }}>
                {m.time}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.inputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишіть повідомлення..."
            style={styles.input}
            aria-label="AI chat input"
            disabled={sending}
          />
          <button onClick={() => void handleSend()} style={styles.sendBtn} disabled={sending}>
            {sending ? "..." : "Надіслати"}
          </button>
        </div>

        <div style={styles.footerNote}>Цей віджет працює локально, додайте onSend для інтеграції з бекендом.</div>
      </div>
    </div>
  );
}
