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
import { WebSocketServer } from "ws";
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

wss.on("connection", (ws, req) => {
  const sessionId = new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("sessionId");

  if (!sessionId) {
    ws.close();
    return;
  }

  console.log(`Client connected to session: ${sessionId}`);

  // Get or create Y.js document for this session
  if (!docs.has(sessionId)) {
    docs.set(sessionId, new Y.Doc());
  }

  const doc = docs.get(sessionId)!;

  // Send current state to new client
  const state = Y.encodeStateAsUpdate(doc);
  ws.send(state);

  // Listen for updates from this client
  ws.on("message", (message: Buffer) => {
    Y.applyUpdate(doc, new Uint8Array(message));

    // Broadcast to all other clients in the same session
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log(`Client disconnected from session: ${sessionId}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}/yjs`);
});
