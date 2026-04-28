"use client";

import { ReactNode, useState } from "react";

interface ControlBarProps {
  audioMuted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  chatOpen: boolean;
  unreadCount: number;
  roomId: string;
  participantCount: number;
}

interface BtnProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  active?: boolean;       // true = normal state (green/gray), false = danger state (red)
  danger?: boolean;       // always red
  highlight?: boolean;    // blue/active highlight
  tip?: string;
}

function Btn({ onClick, icon, label, active = true, danger = false, highlight = false, tip }: BtnProps) {
  const base = "ctrl-btn tooltip flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all select-none";

  const color = danger
    ? "bg-red-600 hover:bg-red-500 text-white"
    : highlight
    ? "bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 border border-blue-500/30"
    : active
    ? "bg-white/8 hover:bg-white/12 text-gray-200 border border-white/8"
    : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30";

  return (
    <button onClick={onClick} className={`${base} ${color}`} data-tip={tip}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function ControlBar({
  audioMuted,
  videoOff,
  screenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreen,
  onToggleChat,
  onLeave,
  chatOpen,
  unreadCount,
  roomId,
  participantCount,
}: ControlBarProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shrink-0 px-6 py-4 flex items-center justify-between"
      style={{ background: "rgba(10,10,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Left — room info */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className="flex flex-col">
          <span className="text-white text-sm font-semibold">NexMeet</span>
          <button
            onClick={copyRoomId}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition group"
          >
            <span className="font-mono tracking-wider">{roomId}</span>
            {copied ? (
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-full px-2.5 py-1 border border-white/8">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-400 text-xs">{participantCount}</span>
        </div>
      </div>

      {/* Center — main controls */}
      <div className="flex items-center gap-2">
        {/* Mic */}
        <Btn
          onClick={onToggleAudio}
          active={!audioMuted}
          tip={audioMuted ? "Unmute" : "Mute"}
          label={audioMuted ? "Unmute" : "Mute"}
          icon={
            audioMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )
          }
        />

        {/* Camera */}
        <Btn
          onClick={onToggleVideo}
          active={!videoOff}
          tip={videoOff ? "Start Camera" : "Stop Camera"}
          label={videoOff ? "Start Cam" : "Stop Cam"}
          icon={
            videoOff ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            )
          }
        />

        {/* Screen share */}
        <Btn
          onClick={onToggleScreen}
          highlight={screenSharing}
          active={true}
          tip={screenSharing ? "Stop Sharing" : "Share Screen"}
          label={screenSharing ? "Stop Share" : "Share"}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Leave — red, center-ish */}
        <button
          onClick={onLeave}
          className="ctrl-btn flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all mx-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Leave</span>
        </button>
      </div>

      {/* Right — chat */}
      <div className="flex items-center gap-2 min-w-[180px] justify-end">
        <div className="relative">
          <Btn
            onClick={onToggleChat}
            highlight={chatOpen}
            active={true}
            tip="Chat"
            label="Chat"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          {unreadCount > 0 && !chatOpen && (
            <span className="dot-pulse absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


