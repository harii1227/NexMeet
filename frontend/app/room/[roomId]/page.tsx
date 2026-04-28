"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { useWebRTC } from "../../../hooks/useWebRTC";
import VideoTile from "../../../components/VideoTile";
import ChatPanel from "../../../components/ChatPanel";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function RoomContent() {
  const isMobile = useIsMobile();
  const params = useParams();
  const roomId = params.roomId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const userName = searchParams.get("name") ?? "Guest";

  const {
    localStream, peers, audioMuted, videoOff, screenSharing,
    status, messages, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare, sendMessage, switchCamera, leaveRoom, mySocketId,
  } = useWebRTC(roomId, userName);

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(true);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
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
  const togglePin = (id: string) => setPinnedId(pinnedId === id ? null : id);
  const copyId = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const peerList = Object.entries(peers);
  const total = 1 + peerList.length;

  const fmt = (n: number) => String(n).padStart(2, "0");
  const timerStr = `${fmt(Math.floor(seconds / 60))}:${fmt(seconds % 60)}`;

  // Grid columns logic for mobile vs desktop
  let cols = 1;
  if (!isMobile) {
    cols = total === 1 ? 1 : total === 2 ? 2 : total <= 4 ? 2 : total <= 6 ? 3 : 4;
  } else {
    // Mobile: Stack 1 or 2, then 2 columns for 3+
    cols = total <= 2 ? 1 : 2;
  }

  return (
    <div style={{
      height: "100dvh", width: "100vw", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "#0a0a0f", color: "white",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height: isMobile ? 44 : 52, minHeight: isMobile ? 44 : 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 12px" : "0 20px",
        background: "rgba(10,10,15,0.98)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Left: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
          <div style={{
            width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, borderRadius: isMobile ? 7 : 9,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <img src="/icons/Logo.png" alt="NexMeet Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.4)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>NexMeet</span>
        </div>

        {/* Center: timer */}
        <span style={{ color: "#9ca3af", fontSize: isMobile ? 12 : 14, fontFamily: "monospace" }}>{timerStr}</span>

        {/* Right: room id + status */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
          <button onClick={copyId} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: isMobile ? "2px 8px" : "4px 10px", color: "#9ca3af",
            fontSize: isMobile ? 10 : 12, cursor: "pointer", fontFamily: "monospace",
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
            padding: isMobile ? "2px 8px" : "4px 10px", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: status === "connected" ? "#22c55e" : status === "connecting" ? "#facc15" : "#ef4444",
            }} />
            <span style={{ fontSize: isMobile ? 11 : 12, color: "#9ca3af" }}>{total} {isMobile ? "" : "participant"}{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Video grid */}
        <div style={{
          flex: 1, overflow: "hidden", padding: isMobile ? 8 : 12,
          display: pinnedId ? "flex" : "grid",
          flexDirection: pinnedId ? "column" : "initial",
          gridTemplateColumns: pinnedId ? "none" : `repeat(${cols}, 1fr)`,
          gridTemplateRows: pinnedId ? "none" : `repeat(${Math.ceil(total / cols)}, 1fr)`,
          gap: isMobile ? 6 : 10,
        }}>
          {pinnedId ? (
            <>
              {/* Pinned View */}
              <div style={{ flex: 1, minHeight: 0, marginBottom: isMobile ? 6 : 10 }}>
                {pinnedId === mySocketId ? (
                  <VideoTile
                    stream={localStream ?? undefined}
                    name={userName}
                    muted={audioMuted}
                    videoOff={videoOff}
                    isLocal
                    screenSharing={screenSharing}
                    onHold={() => togglePin(mySocketId!)}
                    isPinned
                  />
                ) : (
                  peers[pinnedId] && (
                    <VideoTile
                      stream={peers[pinnedId].stream}
                      name={peers[pinnedId].name}
                      muted={peers[pinnedId].audioMuted}
                      videoOff={peers[pinnedId].videoOff}
                      screenSharing={peers[pinnedId].screenSharing}
                      onHold={() => togglePin(pinnedId)}
                      isPinned
                    />
                  )
                )}
              </div>

              {/* Bottom Strip */}
              <div style={{
                height: isMobile ? 120 : 160,
                display: "flex", gap: isMobile ? 6 : 10,
                overflowX: "auto", paddingBottom: 4,
                scrollbarWidth: "none",
              }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {/* Local in strip if not pinned */}
                {pinnedId !== mySocketId && (
                  <div style={{ minWidth: isMobile ? 160 : 220, height: "100%" }}>
                    <VideoTile
                      stream={localStream ?? undefined}
                      name={userName}
                      muted={audioMuted}
                      videoOff={videoOff}
                      isLocal
                      screenSharing={screenSharing}
                      onHold={() => togglePin(mySocketId!)}
                    />
                  </div>
                )}
                {/* Peers in strip if not pinned */}
                {peerList.map(([id, peer]) => (
                  id !== pinnedId && (
                    <div key={id} style={{ minWidth: isMobile ? 160 : 220, height: "100%" }}>
                      <VideoTile
                        stream={peer.stream}
                        name={peer.name}
                        muted={peer.audioMuted}
                        videoOff={peer.videoOff}
                        screenSharing={peer.screenSharing}
                        onHold={() => togglePin(id)}
                      />
                    </div>
                  )
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Grid View */}
              {/* Local */}
              <VideoTile
                stream={localStream ?? undefined}
                name={userName}
                muted={audioMuted}
                videoOff={videoOff}
                isLocal
                screenSharing={screenSharing}
                onHold={() => mySocketId && togglePin(mySocketId)}
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
                  onHold={() => togglePin(id)}
                />
              ))}
            </>
          )}
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
        height: isMobile ? 70 : 76, minHeight: isMobile ? 70 : 76, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 10px" : "0 24px",
        background: "rgba(10,10,15,0.98)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>

        {/* Left: room info (Hidden on mobile to save space) */}
        {!isMobile && (
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" }}>Room ID</div>
            <div style={{ fontSize: 13, color: "#d1d5db", fontFamily: "monospace", fontWeight: 600 }}>{roomId}</div>
          </div>
        )}

        {/* Center: controls */}
        <div style={{ 
          display: "flex", alignItems: "center", gap: isMobile ? 4 : 8,
          flex: isMobile ? 1 : "initial", justifyContent: isMobile ? "center" : "center" 
        }}>
          <CtrlBtn onClick={toggleAudio} label={audioMuted ? "Unmute" : "Mute"} active={!audioMuted} isMobile={isMobile} tooltip={audioMuted ? "Unmute microphone" : "Mute microphone"} icon={audioMuted ? <MicOffIcon size={isMobile ? 18 : 20} /> : <MicOnIcon size={isMobile ? 18 : 20} />} />
          <CtrlBtn onClick={toggleVideo} label={videoOff ? "Cam" : "Cam"} active={!videoOff} isMobile={isMobile} tooltip={videoOff ? "Turn on camera" : "Turn off camera"} icon={videoOff ? <CamOffIcon size={isMobile ? 18 : 20} /> : <CamOnIcon size={isMobile ? 18 : 20} />} />
          <CtrlBtn onClick={switchCamera} label="Flip" active={true} isMobile={isMobile} tooltip="Switch camera" icon={<SwitchCamIcon size={isMobile ? 18 : 20} />} />
          <CtrlBtn onClick={handleToggleScreen} label={screenSharing ? "Stop Share" : "Share"} active={true} highlight={screenSharing} isMobile={isMobile} tooltip={screenSharing ? "Stop screen sharing" : "Share your screen"} icon={<ScreenIcon size={isMobile ? 18 : 20} />} />

          {/* Leave — red */}
          <button
            onClick={confirmLeave}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: isMobile ? "6px 12px" : "8px 20px", borderRadius: 14, border: "none",
              background: "#dc2626", color: "white", cursor: "pointer",
              fontSize: isMobile ? 10 : 11, fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            <LeaveIcon size={isMobile ? 18 : 20} />
            {isMobile ? "End" : "Leave"}
          </button>
        </div>

        {/* Right: chat */}
        <div style={{ minWidth: isMobile ? 60 : 120, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ position: "relative" }}>
            <Tooltip text={isMobile ? "" : (chatOpen ? "Close chat" : "Open chat")}>
            <CtrlBtn
              onClick={() => { setChatOpen((o) => !o); setUnreadCount(0); }}
              label="Chat"
              active={true}
              highlight={chatOpen}
              tooltip=""
              isMobile={isMobile}
              icon={<ChatIcon size={isMobile ? 18 : 20} />}
            />
            </Tooltip>
            {unreadCount > 0 && !chatOpen && (
              <div style={{
                position: "absolute", top: isMobile ? -2 : -4, right: isMobile ? -2 : -4,
                background: "#ef4444", color: "white",
                borderRadius: "50%", width: isMobile ? 14 : 18, height: isMobile ? 14 : 18,
                fontSize: isMobile ? 9 : 10, fontWeight: 700,
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
          backdropFilter: "blur(4px)", padding: 20
        }}>
          <div style={{
            background: "#16161f", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 340, textAlign: "center",
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

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 110,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", padding: 20
        }}>
          <div style={{
            background: "linear-gradient(145deg, #1a1a25, #16161f)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 28, padding: "32px 28px", width: "100%", maxWidth: 400, textAlign: "center",
            boxShadow: "0 30px 70px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)",
            position: "relative",
          }}>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,0.05)", border: "none",
                borderRadius: "50%", width: 32, height: 32,
                color: "#9ca3af", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 18,
              }}
            >✕</button>

            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", color: "#4f8ef7",
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>
              Your meeting is ready
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28 }}>
              Share this link with others you want in the meeting
            </p>

            <div style={{
              background: "rgba(0,0,0,0.3)", borderRadius: 16,
              padding: "16px", border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 24, textAlign: "left",
            }}>
              <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Meeting Link</div>
              <div style={{
                fontSize: 13, color: "#d1d5db", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", marginBottom: 16,
                fontFamily: "monospace", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10
              }}>
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              
              <button
                onClick={copyId}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 12,
                  background: copied ? "#22c55e" : "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
                  color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  border: "none", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {copied ? (
                  <>✓ Copied Link</>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Invitation Link
                  </>
                )}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
               <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
               <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, textTransform: "uppercase" }}>OR</span>
               <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>

            <div style={{ marginTop: 20 }}>
               <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>Room ID</div>
               <div style={{ fontSize: 18, color: "white", fontWeight: 700, letterSpacing: "0.2em", fontFamily: "monospace" }}>
                 {roomId}
               </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              style={{
                marginTop: 32, width: "100%", padding: "12px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Go to Meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading room...</div>}>
      <RoomContent />
    </Suspense>
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
function CtrlBtn({ onClick, label, active, highlight, tooltip, icon, isMobile }: {
  onClick: () => void; label: string; active: boolean;
  highlight?: boolean; tooltip?: string; icon: React.ReactNode;
  isMobile?: boolean;
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
    <Tooltip text={isMobile ? "" : (tooltip ?? "")}>
      <button onClick={onClick} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: isMobile ? "6px 12px" : "8px 16px", borderRadius: 14, border, background: bg,
        color, cursor: "pointer", fontSize: isMobile ? 10 : 11, fontWeight: 500,
        transition: "all 0.15s",
        minWidth: isMobile ? 50 : 64,
      }}>
        {icon}
        {label}
      </button>
    </Tooltip>
  );
}

/* ── Icons ── */
const MicOnIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);
const MicOffIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1m14 0a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);
const CamOnIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);
const CamOffIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);
const ScreenIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const ChatIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const LeaveIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const SwitchCamIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h.01" />
  </svg>
);
