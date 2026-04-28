const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory store: roomId -> Map<socketId, { name, socketId }>
const rooms = new Map();

// REST endpoint to create a new room
app.post("/create-room", (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  rooms.set(roomId, new Map());
  res.json({ roomId });
});

// REST endpoint to check if a room exists
app.get("/room/:roomId", (req, res) => {
  const { roomId } = req.params;
  if (rooms.has(roomId)) {
    const participants = Array.from(rooms.get(roomId).values());
    res.json({ exists: true, participants });
  } else {
    res.json({ exists: false });
  }
});

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // User joins a room
  socket.on("join-room", ({ roomId, userName }) => {
    // Create room if it doesn't exist (allows joining without REST call)
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);

    // Get existing participants before adding the new user
    const existingParticipants = Array.from(room.values());

    // Add user to room
    room.set(socket.id, { name: userName, socketId: socket.id });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    console.log(`[Room ${roomId}] ${userName} joined. Total: ${room.size}`);

    // Tell the new user about everyone already in the room
    socket.emit("room-participants", existingParticipants);

    // Tell everyone else that a new user joined
    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      name: userName,
    });
  });

  // --- WebRTC Signaling ---

  // Forward WebRTC offer to a specific peer
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", {
      from: socket.id,
      fromName: socket.data.userName,
      offer,
    });
  });

  // Forward WebRTC answer to a specific peer
  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", {
      from: socket.id,
      answer,
    });
  });

  // Forward ICE candidate to a specific peer
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  // --- Media state events ---

  socket.on("toggle-audio", ({ roomId, muted }) => {
    socket.to(roomId).emit("peer-audio-toggle", {
      socketId: socket.id,
      muted,
    });
  });

  socket.on("toggle-video", ({ roomId, videoOff }) => {
    socket.to(roomId).emit("peer-video-toggle", {
      socketId: socket.id,
      videoOff,
    });
  });

  // --- Chat ---

  socket.on("chat-message", ({ roomId, message }) => {
    io.to(roomId).emit("chat-message", {
      from: socket.id,
      name: socket.data.userName,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // --- Screen sharing ---

  socket.on("screen-share-started", ({ roomId }) => {
    socket.to(roomId).emit("peer-screen-share", {
      socketId: socket.id,
      sharing: true,
    });
  });

  socket.on("screen-share-stopped", ({ roomId }) => {
    socket.to(roomId).emit("peer-screen-share", {
      socketId: socket.id,
      sharing: false,
    });
  });

  // --- Disconnect ---

  socket.on("disconnect", () => {
    const { roomId, userName } = socket.data;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(socket.id);

      // Notify others in the room
      socket.to(roomId).emit("user-left", { socketId: socket.id });

      console.log(`[-] ${userName} left room ${roomId}. Remaining: ${room.size}`);

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`[Room ${roomId}] deleted (empty)`);
      }
    }
    console.log(`[-] Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
