"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"create" | "join">("create");

  // Handle ?action=create shortcut from PWA shortcut
  useEffect(() => {
    if (searchParams.get("action") === "create") setTab("create");
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!userName.trim()) return setError("Please enter your name.");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/create-room`, { method: "POST" });
      const data: { roomId: string } = await res.json();
      router.push(`/room/${data.roomId}?name=${encodeURIComponent(userName.trim())}`);
    } catch { setError("Cannot connect to server. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) return setError("Please enter your name.");
    if (!roomId.trim()) return setError("Please enter a Room ID.");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/room/${roomId.trim().toUpperCase()}`);
      const data: { exists: boolean } = await res.json();
      if (!data.exists) return setError("Room not found. Check the Room ID.");
      router.push(`/room/${roomId.trim().toUpperCase()}?name=${encodeURIComponent(userName.trim())}`);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      height: "100vh", width: "100vw", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: "#0a0a0f", position: "relative",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Ambient background blobs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: "50vw", height: "50vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-5%",
          width: "45vw", height: "45vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "20%",
          width: "25vw", height: "25vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)",
        }} />
      </div>

      {/* Top nav */}
      <nav style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <img src="/icons/Logo.png" alt="NexMeet Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.4)" }} />
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px" }}>NexMeet</span>
        </div>

      </nav>

      {/* Main content */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Hero text */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: "100%", maxWidth: 600, margin: "0 auto 24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(12px, 3vw, 24px)",
              padding: "10px 0",
              animation: "wideReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <style>{`
                @keyframes wideReveal {
                  from { opacity: 0; letter-spacing: -0.5em; filter: blur(10px); transform: scale(0.9); }
                  to { opacity: 1; letter-spacing: 0.15em; filter: blur(0); transform: scale(1); }
                }
              `}</style>

              <span style={{ color: "#4f8ef7", fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Meet</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "#7c5cfc", fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Connect</span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "#4f8ef7", fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>Collaborate</span>
            </div>

            <h1 style={{
              fontSize: "clamp(24px, 4.5vw, 36px)", fontWeight: 800,
              color: "white", lineHeight: 1.15, letterSpacing: "-0.5px",
              margin: "0 0 10px", transform: "translateX(-10px)",
            }}>
              Seamless Meetings <span style={{
                background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>instantly</span>
            </h1>
            <p style={{ color: "#6b7280", fontSize: 15, margin: 0 }}>
              No downloads. No accounts. Just share a link.
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "28px 24px",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>

            {/* Name input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: "#6b7280", textTransform: "uppercase",
                letterSpacing: "0.1em", marginBottom: 8,
              }}>Your Name</label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "#4b5563", pointerEvents: "none",
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  value={userName}
                  onChange={(e) => { setUserName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreateRoom() : handleJoinRoom())}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14, padding: "12px 14px 12px 40px",
                    color: "white", fontSize: 14, outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(79,142,247,0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{
              display: "flex", background: "rgba(0,0,0,0.3)",
              borderRadius: 14, padding: 4, marginBottom: 20,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {(["create", "join"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
                  flex: 1, padding: "10px 0", borderRadius: 11,
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  transition: "all 0.2s",
                  background: tab === t
                    ? "linear-gradient(135deg,#4f8ef7,#7c5cfc)"
                    : "transparent",
                  color: tab === t ? "white" : "#6b7280",
                  boxShadow: tab === t ? "0 4px 12px rgba(79,142,247,0.3)" : "none",
                }}>
                  {t === "create" ? "✦  Create Room" : "→  Join Room"}
                </button>
              ))}
            </div>

            {/* Create tab */}
            {tab === "create" && (
              <div>
                <p style={{ color: "#4b5563", fontSize: 12, textAlign: "center", marginBottom: 16, marginTop: 0 }}>
                  A unique Room ID will be generated for you to share with others.
                </p>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "rgba(79,142,247,0.4)" : "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
                    color: "white", fontSize: 15, fontWeight: 700,
                    boxShadow: loading ? "none" : "0 8px 24px rgba(79,142,247,0.35)",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loading ? (
                    <><Spinner /> Creating room...</>
                  ) : (
                    <><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg> Start New Meeting</>
                  )}
                </button>
              </div>
            )}

            {/* Join tab */}
            {tab === "join" && (
              <div>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <div style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: "#4b5563", pointerEvents: "none",
                  }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Room ID  (e.g. A1B2C3D4)"
                    value={roomId}
                    onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 14, padding: "12px 14px 12px 40px",
                      color: "white", fontSize: 14, outline: "none",
                      fontFamily: "monospace", letterSpacing: "0.12em",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(34,197,94,0.6)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "rgba(34,197,94,0.4)" : "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "white", fontSize: 15, fontWeight: 700,
                    boxShadow: loading ? "none" : "0 8px 24px rgba(34,197,94,0.3)",
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loading ? (
                    <><Spinner /> Joining...</>
                  ) : (
                    <><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg> Join Meeting</>
                  )}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 12,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Feature pills */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 10, marginTop: 20, flexWrap: "wrap",
          }}>
            {[
              { icon: "🔒", label: "Encrypted" },
              { icon: "⚡", label: "Low latency" },
              { icon: "📱", label: "Mobile ready" },
            ].map((f) => (
              <div key={f.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#6b7280",
              }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path strokeLinecap="round" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
