"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  mySocketId: string | undefined;
  onClose: () => void;
}

export default function ChatPanel({ messages, onSend, mySocketId, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      width: 300, flexShrink: 0,
      display: "flex", flexDirection: "column",
      background: "rgba(13,13,20,0.98)",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>💬 Chat</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#6b7280",
          cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2,
        }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#4b5563", fontSize: 13, marginTop: 40 }}>
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.from === mySocketId;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              {!isMe && (
                <span style={{ fontSize: 11, color: "#6b7280", marginBottom: 3, paddingLeft: 4 }}>{msg.name}</span>
              )}
              <div style={{
                maxWidth: "85%", padding: "8px 12px", borderRadius: 14,
                fontSize: 13, lineHeight: 1.5,
                background: isMe
                  ? "linear-gradient(135deg, #4f8ef7, #7c5cfc)"
                  : "rgba(255,255,255,0.08)",
                color: "white",
                borderBottomRightRadius: isMe ? 4 : 14,
                borderBottomLeftRadius: isMe ? 14 : 4,
              }}>
                {msg.message}
              </div>
              <span style={{ fontSize: 10, color: "#4b5563", marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                {fmt(msg.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", gap: 8, flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 12px",
            color: "white", fontSize: 13, outline: "none",
          }}
        />
        <button onClick={handleSend} disabled={!input.trim()} style={{
          background: input.trim() ? "linear-gradient(135deg,#4f8ef7,#7c5cfc)" : "rgba(255,255,255,0.06)",
          border: "none", borderRadius: 10, padding: "8px 12px",
          color: input.trim() ? "white" : "#4b5563",
          cursor: input.trim() ? "pointer" : "default", fontSize: 16,
        }}>➤</button>
      </div>
    </div>
  );
}
