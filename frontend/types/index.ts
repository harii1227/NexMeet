// Peer state stored in React state (UI-facing)
export interface PeerState {
  stream?: MediaStream;
  name: string;
  audioMuted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
}

// Map of socketId -> PeerState
export type PeersMap = Record<string, PeerState>;

// Participant info received from the server
export interface Participant {
  socketId: string;
  name: string;
}

// Chat message received from the server
export interface ChatMessage {
  from: string;       // socketId of sender
  name: string;       // display name
  message: string;
  timestamp: string;  // ISO string
}

// Connection status
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "media-error";

// Return type of useWebRTC hook
export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  peers: PeersMap;
  audioMuted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
  status: ConnectionStatus;
  messages: ChatMessage[];
  toggleAudio: () => void;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  sendMessage: (message: string) => void;
  leaveRoom: () => void;
  mySocketId: string | undefined;
}
