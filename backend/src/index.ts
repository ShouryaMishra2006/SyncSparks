import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import passport from "passport";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import performerRoutes from "./routes/performerRoutes";
import writerRoutes from "./routes/writerRoutes";
import collaborationRoutes from "./routes/collaborationRoutes";
import "./config/passport";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";

connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Backend API running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/performer", performerRoutes);
app.use("/api/writer", writerRoutes);
app.use("/api/collab", collaborationRoutes);

// Create a single HTTP server for both Express and WebSocket
const server = createServer(app);

// WebSocket server attached to the same HTTP server
const wss = new WebSocketServer({ server, path: "/yjs" });

// Store Y.js documents for each session
const docs = new Map<string, Y.Doc>();

// Track connected clients per session
interface ClientInfo {
  ws: any;
  userId: string;
  userName: string;
}

const sessions = new Map<string, Set<ClientInfo>>();

// Export function to get connected users for a session
export function getConnectedUsers(sessionId: string) {
  const sessionClients = sessions.get(sessionId);
  if (!sessionClients) {
    return [];
  }

  return Array.from(sessionClients).map((client) => ({
    userId: client.userId,
    userName: client.userName,
  }));
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");
  const userId = url.searchParams.get("userId");
  const userName = url.searchParams.get("userName");

  if (!sessionId || !userId || !userName) {
    console.log("Missing required parameters, closing connection");
    ws.close();
    return;
  }

  console.log(
    `Client ${userName} (${userId}) connected to session: ${sessionId}`
  );

  // Get or create Y.js document for this session
  if (!docs.has(sessionId)) {
    docs.set(sessionId, new Y.Doc());
  }

  const doc = docs.get(sessionId)!;

  // Track client in session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set());
  }
  const sessionClients = sessions.get(sessionId)!;
  const clientInfo: ClientInfo = { ws, userId, userName };
  sessionClients.add(clientInfo);

  // Send current Y.js state to new client
  const state = Y.encodeStateAsUpdate(doc);
  ws.send(state);

  // Broadcast user joined event to all clients in this session
  const joinMessage = JSON.stringify({
    type: "user-joined",
    data: {
      userId,
      userName,
      participantCount: sessionClients.size,
      timestamp: Date.now(),
    },
  });

  sessionClients.forEach((client) => {
    if (client.ws.readyState === 1) {
      // WebSocket.OPEN
      client.ws.send(joinMessage);
    }
  });

  // Listen for updates from this client
  ws.on("message", (message: Buffer) => {
    // Try to parse as JSON first (for custom messages)
    try {
      const textMessage = message.toString("utf-8");
      const parsed = JSON.parse(textMessage);

      // If successfully parsed as JSON, handle as custom message
      if (parsed && typeof parsed === "object" && parsed.type) {
        handleCustomMessage(ws, parsed, sessionId, sessionClients);
        return;
      }
    } catch {
      // Not JSON, continue to check if it's Y.js binary
    }

    // Handle as Y.js binary update
    try {
      const uint8Array = new Uint8Array(message);

      // Apply Y.js update
      Y.applyUpdate(doc, uint8Array);

      // Broadcast Y.js update to other clients in the same session
      sessionClients.forEach((client) => {
        if (client.ws !== ws && client.ws.readyState === 1) {
          client.ws.send(message);
        }
      });
    } catch (err) {
      console.error("Failed to apply Y.js update:", err);
    }
  });

  ws.on("close", () => {
    console.log(
      `Client ${userName} (${userId}) disconnected from session: ${sessionId}`
    );

    // Remove client from session
    sessionClients.delete(clientInfo);

    // Broadcast user left event to remaining clients
    const leaveMessage = JSON.stringify({
      type: "user-left",
      data: {
        userId,
        userName,
        participantCount: sessionClients.size,
        timestamp: Date.now(),
      },
    });

    sessionClients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.send(leaveMessage);
      }
    });

    // Clean up if no clients left
    if (sessionClients.size === 0) {
      sessions.delete(sessionId);
      console.log(`Session ${sessionId} is now empty, cleaned up`);
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userName}:`, error);
  });
});

function handleCustomMessage(
  ws: any,
  message: any,
  sessionId: string,
  sessionClients: Set<ClientInfo>
) {
  switch (message.type) {
    case "chat":
      // Broadcast chat message to all clients in session
      const chatMessage = JSON.stringify({
        type: "chat",
        data: {
          userId: message.userId,
          userName: message.userName,
          message: message.message,
          timestamp: Date.now(),
        },
      });
      sessionClients.forEach((client) => {
        if (client.ws.readyState === 1) {
          client.ws.send(chatMessage);
        }
      });
      break;

    default:
      console.log("Unknown custom message type:", message.type);
      break;
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}/yjs`);
});
