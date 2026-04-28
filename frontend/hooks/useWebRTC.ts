"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  PeersMap,
  PeerState,
  Participant,
  ChatMessage,
  ConnectionStatus,
  UseWebRTCReturn,
} from "../types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Creates a silent black video track used as placeholder when camera is off
function createBlackVideoTrack(): MediaStreamTrack {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 2, 2);
  const stream = (canvas as any).captureStream(1) as MediaStream;
  return stream.getVideoTracks()[0];
}

export function useWebRTC(roomId: string, userName: string): UseWebRTCReturn {
  const socketRef = useRef<Socket | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [peers, setPeers] = useState<PeersMap>({});
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const peerMetaRef = useRef<Record<string, { name: string }>>({});

  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [screenSharing, setScreenSharing] = useState<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const updatePeerState = useCallback((socketId: string, updates: Partial<PeerState>) => {
    setPeers((prev) => ({
      ...prev,
      [socketId]: { ...(prev[socketId] ?? { name: "", audioMuted: false, videoOff: false, screenSharing: false }), ...updates },
    }));
  }, []);

  // ─── Remove a peer ──────────────────────────────────────────────────────────

  const removePeer = useCallback((peerId: string) => {
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close();
      delete peersRef.current[peerId];
      delete peerMetaRef.current[peerId];
    }
    setPeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // ─── Create RTCPeerConnection ────────────────────────────────────────────────

  const createPeerConnection = useCallback(
    (peerId: string, peerName: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Receive remote track
      pc.ontrack = (event: RTCTrackEvent) => {
        const [remoteStream] = event.streams;
        updatePeerState(peerId, { stream: remoteStream, name: peerName });
      };

      // Send ICE candidates via signaling server
      pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socketRef.current?.emit("ice-candidate", {
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`[Peer ${peerId}] state: ${pc.connectionState}`);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          removePeer(peerId);
        }
      };

      peersRef.current[peerId] = pc;
      peerMetaRef.current[peerId] = { name: peerName };
      updatePeerState(peerId, { name: peerName, audioMuted: false, videoOff: false, screenSharing: false });

      return pc;
    },
    [updatePeerState, removePeer]
  );

  // ─── Init local media + socket ───────────────────────────────────────────────

  useEffect(() => {
    if (!roomId || !userName) return;

    let mounted = true;

    const init = async () => {
      // 1. Get camera + mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode }, 
          audio: true 
        });
        if (!mounted) return;
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("Media access error:", err);
        setStatus("media-error");
        return;
      }

      // 2. Connect socket
      const socket: Socket = io(BACKEND_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setStatus("connected");
        socket.emit("join-room", { roomId, userName });
      });

      socket.on("disconnect", () => setStatus("disconnected"));

      // 3. Existing participants → send offers
      socket.on("room-participants", async (participants: Participant[]) => {
        for (const p of participants) {
          const pc = createPeerConnection(p.socketId, p.name);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: p.socketId, offer });
        }
      });

      // 4. New user joined
      socket.on("user-joined", ({ socketId, name }: { socketId: string; name: string }) => {
        peerMetaRef.current[socketId] = { name };
        updatePeerState(socketId, { name, audioMuted: false, videoOff: false, screenSharing: false });
      });

      // 5. Receive offer → answer (handles both initial connection AND renegotiation)
      socket.on("offer", async ({ from, fromName, offer }: { from: string; fromName: string; offer: RTCSessionDescriptionInit }) => {
        let pc = peersRef.current[from];

        if (!pc) {
          // Initial connection — create new peer connection
          const name = fromName || peerMetaRef.current[from]?.name || "Participant";
          pc = createPeerConnection(from, name);
        }
        // If pc already exists, this is a renegotiation — reuse it

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, answer });
      });

      // 6. Receive answer
      socket.on("answer", async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
        const pc = peersRef.current[from];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // 7. Receive ICE candidate
      socket.on("ice-candidate", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        const pc = peersRef.current[from];
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("ICE error:", err);
          }
        }
      });

      // 8. Peer left
      socket.on("user-left", ({ socketId }: { socketId: string }) => removePeer(socketId));

      // 9. Peer media toggles
      socket.on("peer-audio-toggle", ({ socketId, muted }: { socketId: string; muted: boolean }) => {
        updatePeerState(socketId, { audioMuted: muted });
      });
      socket.on("peer-video-toggle", ({ socketId, videoOff }: { socketId: string; videoOff: boolean }) => {
        updatePeerState(socketId, { videoOff });
      });
      socket.on("peer-screen-share", ({ socketId, sharing }: { socketId: string; sharing: boolean }) => {
        updatePeerState(socketId, { screenSharing: sharing });
      });

      // 10. Chat
      socket.on("chat-message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });
    };

    init();

    return () => {
      mounted = false;
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      socketRef.current?.disconnect();
    };
  }, [roomId, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Controls ───────────────────────────────────────────────────────────────

  const toggleAudio = useCallback((): void => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const muted = !track.enabled;
      setAudioMuted(muted);
      socketRef.current?.emit("toggle-audio", { roomId, muted });
    }
  }, [roomId]);

  const toggleVideo = useCallback(async (): Promise<void> => {
    const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0];
    const trackEnded = !currentVideoTrack || currentVideoTrack.readyState === "ended";
    const isCurrentlyOff = trackEnded || !currentVideoTrack.enabled;

    if (!isCurrentlyOff) {
      // ── Turning OFF: just disable, keep track alive in peer connections ──
      currentVideoTrack!.enabled = false;
      setVideoOff(true);
      socketRef.current?.emit("toggle-video", { roomId, videoOff: true });
      // Force re-render of local stream so VideoTile sees the disabled track
      setLocalStream(new MediaStream(localStreamRef.current!.getTracks()));
    } else {
      // ── Turning ON ──
      try {
        if (!trackEnded) {
          // Track still alive — just re-enable it, no renegotiation needed
          currentVideoTrack!.enabled = true;
          setVideoOff(false);
          socketRef.current?.emit("toggle-video", { roomId, videoOff: false });
          // Force re-render of local stream so VideoTile sees the enabled track
          setLocalStream(new MediaStream(localStreamRef.current!.getTracks()));
        } else {
          // Track was stopped (e.g. after screen share) — get fresh camera
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];

          // Replace in local stream ref
          localStreamRef.current?.getVideoTracks().forEach((t) => {
            localStreamRef.current?.removeTrack(t);
            t.stop();
          });
          localStreamRef.current?.addTrack(newVideoTrack);

          // Replace track in all peer connections — no renegotiation needed for replaceTrack
          for (const pc of Object.values(peersRef.current)) {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) {
              await sender.replaceTrack(newVideoTrack);
            }
          }

          // Update local preview stream
          const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
          const combined = new MediaStream([newVideoTrack, ...audioTracks]);
          localStreamRef.current = combined;
          setLocalStream(combined);
          setVideoOff(false);
          socketRef.current?.emit("toggle-video", { roomId, videoOff: false });
        }
      } catch (err) {
        console.error("Camera re-enable error:", err);
      }
    }
  }, [roomId]);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    if (!screenStreamRef.current) return;
    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    const cameraTrack = localStreamRef.current?.getVideoTracks().find(t => t.readyState === "live");
    
    if (cameraTrack) {
      for (const pc of Object.values(peersRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(cameraTrack);
          } catch (err) {
            console.error("Failed to restore camera track for peer:", err);
          }
        }
      }
      
      const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
      setLocalStream(new MediaStream([cameraTrack, ...audioTracks]));
    } else {
      // If no camera track found, try to get a new one or just clear local stream
      setLocalStream(new MediaStream(localStreamRef.current?.getAudioTracks() ?? []));
      setVideoOff(true);
    }

    setScreenSharing(false);
    socketRef.current?.emit("screen-share-stopped", { roomId });
  }, [roomId]);

  const startScreenShare = useCallback(async (): Promise<void> => {
    try {
      const mediaDevices = navigator.mediaDevices as any;
      // Aggressively search for the API in all possible locations
      const getDisplayMediaFn = 
        mediaDevices?.getDisplayMedia?.bind(mediaDevices) || 
        (navigator as any).getDisplayMedia?.bind(navigator) || 
        (navigator as any).webkitGetDisplayMedia?.bind(navigator) || 
        (navigator as any).mozGetDisplayMedia?.bind(navigator);

      if (!getDisplayMediaFn) {
        throw new Error("Your browser blocks screen sharing. Try opening this link directly in Chrome or Safari (not inside WhatsApp/Facebook).");
      }

      // Use the simplest possible constraints for mobile
      const screenStream = await getDisplayMediaFn({ 
        video: true 
      });
      
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track in all peer connections
      for (const pc of Object.values(peersRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(screenTrack);
          } catch (err) {
            console.error("Failed to replace track for peer:", err);
          }
        }
      }

      // Update local preview
      const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
      const combined = new MediaStream([screenTrack, ...audioTracks]);
      setLocalStream(combined);
      setScreenSharing(true);
      socketRef.current?.emit("screen-share-started", { roomId });

      screenTrack.onended = () => stopScreenShare();
    } catch (err: any) {
      console.error("Screen share error:", err);
      if (err.name !== "NotAllowedError") {
        alert("Could not start screen sharing: " + err.message + "\n\nTip: If you are opening this from WhatsApp or another app, please copy the link and open it in the Google Chrome browser instead.");
      }
    }
  }, [roomId, stopScreenShare]);

  const sendMessage = useCallback((message: string): void => {
    if (!message.trim()) return;
    socketRef.current?.emit("chat-message", { roomId, message });
  }, [roomId]);

  const switchCamera = useCallback(async (): Promise<void> => {
    if (screenSharing) return;
    
    const newMode = facingMode === "user" ? "environment" : "user";

    try {
      // 1. Stop current video tracks FIRST
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
      }

      // 2. Small delay to ensure hardware is released
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Request new camera
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { exact: newMode } 
        } 
      }).catch(() => {
        // Fallback if 'exact' fails
        return navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode } 
        });
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      setFacingMode(newMode);

      if (localStreamRef.current) {
        localStreamRef.current.addTrack(newVideoTrack);
      }

      // 4. Replace track in all peer connections
      for (const pc of Object.values(peersRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // 5. Update local preview
      const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
      const combined = new MediaStream([newVideoTrack, ...audioTracks]);
      localStreamRef.current = combined;
      setLocalStream(combined);
      setVideoOff(false);
      
      socketRef.current?.emit("toggle-video", { roomId, videoOff: false });
    } catch (err: any) {
      console.error("Switch camera error:", err);
      // Try to recover by restarting the original camera if possible
      alert("Failed to switch camera: " + err.message);
    }
  }, [roomId, facingMode, screenSharing]);

  const leaveRoom = useCallback((): void => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach((pc) => pc.close());
  }, []);

  return {
    localStream,
    peers,
    audioMuted,
    videoOff,
    screenSharing,
    status,
    messages,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    switchCamera,
    leaveRoom,
    mySocketId: socketRef.current?.id,
  };
}
