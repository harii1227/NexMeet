"use client";

import { useEffect, useState } from "react";

// Expose install trigger globally so page.tsx can call it
declare global {
  interface Window {
    __pwaInstallPrompt?: () => void;
  }
}

export default function ServiceWorkerRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // ── Register Service Worker ──
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);
          setSwReady(true);
        })
        .catch((err) => console.error("[SW] Failed:", err));
    }

    // ── PWA already installed? ──
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // ── Capture install prompt ──
    const onPrompt = (e: Event) => {
      e.preventDefault();
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
    if (!deferredPrompt) return;
    // @ts-expect-error BeforeInstallPromptEvent
    await deferredPrompt.prompt();
    // @ts-expect-error BeforeInstallPromptEvent
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] User choice:", outcome);
    setDeferredPrompt(null);
    setInstallable(false);
  };

  // Expose to window so page.tsx Install button can call it
  useEffect(() => {
    window.__pwaInstallPrompt = installable ? triggerInstall : undefined;
  }, [installable, deferredPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Offline banner */}
      {offline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#dc2626", color: "white", textAlign: "center",
          padding: "10px 16px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          📡 You are offline — video calls require an internet connection
        </div>
      )}

      {/* Install banner — shown when browser fires beforeinstallprompt */}
      {installable && !installed && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9998, width: "calc(100% - 32px)", maxWidth: 400,
          background: "#16161f",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20, padding: "16px 18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", gap: 14,
          animation: "slideUp 0.3s ease-out",
        }}>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(20px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>

          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Install MeetNow</div>
            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
              Add to home screen for instant access
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setInstallable(false)} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "7px 12px", color: "#9ca3af",
              fontSize: 12, cursor: "pointer",
            }}>Later</button>
            <button onClick={triggerInstall} style={{
              background: "linear-gradient(135deg,#4f8ef7,#7c5cfc)",
              border: "none", borderRadius: 10, padding: "7px 14px",
              color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(79,142,247,0.4)",
            }}>Install</button>
          </div>
        </div>
      )}


    </>
  );
}
