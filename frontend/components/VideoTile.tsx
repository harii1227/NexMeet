"use client";

import { useEffect, useRef } from "react";

interface VideoTileProps {
  stream?: MediaStream;
  name: string;
  muted?: boolean;
  videoOff?: boolean;
  isLocal?: boolean;
  screenSharing?: boolean;
}

const AVATAR_COLORS = [
  ["#4f8ef7", "#7c5cfc"],
  ["#a855f7", "#ec4899"],
  ["#22c55e", "#14b8a6"],
  ["#f97316", "#ef4444"],
  ["#06b6d4", "#3b82f6"],
  ["#f43f5e", "#ec4899"],
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function VideoTile({
  stream, name, muted = false, videoOff = false, isLocal = false, screenSharing = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const [c1, c2] = getColor(name);

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "#16161f", border: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "100%", height: "100%",
    }}>
      {/* Video or avatar */}
      {stream && !videoOff ? (
        <video
          ref={videoRef} autoPlay playsInline muted={isLocal}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: "white",
            boxShadow: `0 0 24px ${c1}55`,
          }}>
            {initials}
          </div>
          {videoOff && <span style={{ color: "#6b7280", fontSize: 12 }}>Camera off</span>}
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 56,
        background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
        pointerEvents: "none",
      }} />

      {/* Name + mute row */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "8px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {screenSharing && (
            <span style={{
              background: "rgba(34,197,94,0.2)", color: "#4ade80",
              fontSize: 10, padding: "2px 7px", borderRadius: 20,
              border: "1px solid rgba(34,197,94,0.3)",
            }}>🖥 Sharing</span>
          )}
          <span style={{ color: "white", fontSize: 12, fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {name || "Participant"}{isLocal ? " (You)" : ""}
          </span>
        </div>
        {muted && (
          <div style={{
            background: "rgba(239,68,68,0.85)", borderRadius: "50%",
            width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        )}
      </div>

      {/* You badge */}
      {isLocal && (
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: "rgba(79,142,247,0.8)", color: "white",
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
        }}>You</div>
      )}
    </div>
  );
}
