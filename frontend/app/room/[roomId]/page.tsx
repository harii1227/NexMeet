"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useWebRTC } from "../../../hooks/useWebRTC";
import VideoTile from "../../../components/VideoTile";
import ChatPanel from "../../../components/ChatPanel";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const userName = searchParams.get("name") ?? "Guest";

  const {
    localStream, peers, audioMuted, videoOff, screenSharing,
    status, messages, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare, sendMessage, leaveRoom, mySocketId,
  } = useWebRTC(roomId, userName);

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const prevMsgCount = useRef(0);

  // Meeting timer
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Unread badge
  useEffect(() => {
    if (!chatOpen && messages.length > prevMsgCount.current) {
      setUnreadCount((c) => c + (messages.length - prevMsgCount.current));
    }
    prevMsgCount.current = messages.length;
  }, [messages, chatOpen]);

  const handleLeave = () => { leaveRoom(); router.push("/"); };
  const confirmLeave = () => setShowLeaveConfirm(true);
  const handleToggleScreen = () => screenSharing ? stopScreenShare() : startScreenShare();
  const copyId = () => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const peerList = Object.entries(peers);
  const total = 1 + peerList.length;

  const fmt = (n: number) => String(n).padStart(2, "0");
  const timerStr = `${fmt(Math.floor(seconds / 60))}:${fmt(seconds % 60)}`;

  // Grid columns
  const cols = total === 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 4;

  return (
    <div style={{
      height: "100vh", width: "100vw", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "#0a0a0f", color: "white",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height: 52, minHeight: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(10,10,15,0.98)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Left: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>MeetNow</span>
        </div>

        {/* Center: timer */}
        <span style={{ color: "#9ca3af", fontSize: 14, fontFamily: "monospace" }}>{timerStr}</span>

        {/* Right: room id + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={copyId} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "4px 10px", color: "#9ca3af",
            fontSize: 12, cursor: "pointer", fontFamily: "monospace",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {roomId}
            {copied
              ? <span style={{ color: "#22c55e" }}>✓</span>
              : <span style={{ opacity: 0.5 }}>⎘</span>}
          </button>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.05)", borderRadius: 20,
            padding: "4px 10px", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: status === "connected" ? "#22c55e" : status === "connecting" ? "#facc15" : "#ef4444",
            }} />
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{total} participant{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Video grid */}
        <div style={{
          flex: 1, overflow: "hidden", padding: 12,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil(total / cols)}, 1fr)`,
          gap: 10,
        }}>
          {/* Local */}
          <VideoTile
            stream={localStream ?? undefined}
            name={userName}
            muted={audioMuted}
            videoOff={videoOff}
            isLocal
            screenSharing={screenSharing}
          />
          {/* Peers */}
          {peerList.map(([id, peer]) => (
            <VideoTile
              key={id}
              stream={peer.stream}
              name={peer.name}
              muted={peer.audioMuted}
              videoOff={peer.videoOff}
              screenSharing={peer.screenSharing}
            />
          ))}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <ChatPanel
            messages={messages}
            onSend={sendMessage}
            mySocketId={mySocketId}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {/* ── CONTROL BAR ── */}
      <div style={{
        height: 76, minHeight: 76, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(10,10,15,0.98)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>

        {/* Left: room info */}
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Room ID</div>
          <div style={{ fontSize: 13, color: "#d1d5db", fontFamily: "monospace", fontWeight: 600 }}>{roomId}</div>
        </div>

        {/* Center: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CtrlBtn onClick={toggleAudio} label={audioMuted ? "Unmute" : "Mute"} active={!audioMuted} tooltip={audioMuted ? "Unmute microphone" : "Mute microphone"} icon={audioMuted ? <MicOffIcon /> : <MicOnIcon />} />
          <CtrlBtn onClick={toggleVideo} label={videoOff ? "Start Cam" : "Stop Cam"} active={!videoOff} tooltip={videoOff ? "Turn on camera" : "Turn off camera"} icon={videoOff ? <CamOffIcon /> : <CamOnIcon />} />
          <CtrlBtn onClick={handleToggleScreen} label={screenSharing ? "Stop Share" : "Share"} active={true} highlight={screenSharing} tooltip={screenSharing ? "Stop screen sharing" : "Share your screen"} icon={<ScreenIcon />} />

          {/* Leave — red */}
          <Tooltip text="Leave meeting">
          <button
            onClick={confirmLeave}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 20px", borderRadius: 14, border: "none",
              background: "#dc2626", color: "white", cursor: "pointer",
              fontSize: 11, fontWeight: 600,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            <LeaveIcon />
            Leave
          </button>
          </Tooltip>
        </div>

        {/* Right: chat */}
        <div style={{ minWidth: 160, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "relative" }}>
            <Tooltip text={chatOpen ? "Close chat" : "Open chat"}>
            <CtrlBtn
              onClick={() => { setChatOpen((o) => !o); setUnreadCount(0); }}
              label="Chat"
              active={true}
              highlight={chatOpen}
              tooltip=""
              icon={<ChatIcon />}
            />
            </Tooltip>
            {unreadCount > 0 && !chatOpen && (
              <div style={{
                position: "absolute", top: -4, right: -4,
                background: "#ef4444", color: "white",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LEAVE CONFIRMATION MODAL ── */}
      {showLeaveConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#16161f", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "32px 28px", width: 340, textAlign: "center",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <LeaveIcon />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 8 }}>
              Leave Meeting?
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
              Are you sure you want to leave? Others will remain in the call.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Stay
              </button>
              <button
                onClick={handleLeave}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12,
                  background: "#dc2626", border: "none",
                  color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tooltip wrapper ── */
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.9)", color: "white",
          fontSize: 11, padding: "5px 10px", borderRadius: 8,
          whiteSpace: "nowrap", pointerEvents: "none", zIndex: 50,
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

/* ── Control Button ── */
function CtrlBtn({ onClick, label, active, highlight, tooltip, icon }: {
  onClick: () => void; label: string; active: boolean;
  highlight?: boolean; tooltip?: string; icon: React.ReactNode;
}) {
  const bg = highlight
    ? "rgba(79,142,247,0.2)"
    : active
    ? "rgba(255,255,255,0.07)"
    : "rgba(239,68,68,0.15)";
  const border = highlight
    ? "1px solid rgba(79,142,247,0.4)"
    : active
    ? "1px solid rgba(255,255,255,0.09)"
    : "1px solid rgba(239,68,68,0.3)";
  const color = highlight ? "#60a5fa" : active ? "#e5e7eb" : "#f87171";

  return (
    <Tooltip text={tooltip ?? ""}>
      <button onClick={onClick} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "8px 16px", borderRadius: 14, border, background: bg,
        color, cursor: "pointer", fontSize: 11, fontWeight: 500,
        transition: "all 0.15s",
      }}>
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}

/* ── Icons ── */
const MicOnIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);
const MicOffIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);
const CamOnIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);
const CamOffIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);
const ScreenIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const LeaveIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
