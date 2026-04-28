"use client";

import { useEffect, useState } from "react";

// Expose install trigger globally so page.tsx can call it
declare global {
  interface Window {
    __pwaInstallPrompt?: () => void;
  }
}

export default function ServiceWorkerRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // ── Register Service Worker ──
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
        })
        .catch((err) => console.error("[SW] Failed:", err));
    }

    // ── Check if already installed ──
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    // ── Capture install prompt ──
    const onPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setInstallable(true);
      console.log("[PWA] Install prompt captured");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // ── After install ──
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setInstallable(false);
      console.log("[PWA] App installed!");
    });

    // ── Offline/online ──
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      console.log("[PWA] No prompt available");
      return;
    }
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] User choice:", outcome);
    
    if (outcome === 'accepted') {
      setInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Expose to window so page.tsx Install button can call it
  useEffect(() => {
    if (installable && deferredPrompt) {
      window.__pwaInstallPrompt = triggerInstall;
    } else {
      window.__pwaInstallPrompt = undefined;
    }
  }, [installable, deferredPrompt]);

  return (
    <>
      {/* Offline banner */}
      {offline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#dc2626", color: "white", textAlign: "center",
          padding: "10px 16px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          📡 You are offline — video calls require an internet connection
        </div>
      )}

      {/* Compact PWA Install Banner (Top Right) */}
      {installable && !installed && (
        <div style={{
          position: "fixed", top: 70, right: 20,
          zIndex: 9998, width: "calc(100% - 40px)", maxWidth: 280,
          background: "rgba(22, 22, 31, 0.98)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 20, padding: "12px 14px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", gap: 12,
          animation: "slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(20px) scale(0.95); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>

          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 4px 10px rgba(255, 255, 255, 0.1)",
          }}>
            <img src="/icons/Logo.png" alt="NexMeet Logo" style={{ width: "100%", height: "100%", objectFit: "contain", transform: "scale(1.4)" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Install NexMeet</div>
            <button 
              onClick={triggerInstall} 
              style={{
                background: "none", border: "none", color: "#4f8ef7", 
                fontSize: 11, fontWeight: 700, cursor: "pointer", 
                padding: 0, marginTop: 2, display: "block",
              }}
            >
              Get App →
            </button>
          </div>
          
          <button 
            onClick={() => setInstallable(false)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "none", color: "#9ca3af",
              cursor: "pointer", padding: "6px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
