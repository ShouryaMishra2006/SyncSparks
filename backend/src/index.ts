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
import developerRoutes from "./routes/developerRoutes";
import "./config/passport";

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import path from "path";

connectDB();

const app = express();
const PORT = process.env.PORT || 4000;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (_, res) => {
  res.json({
    message: "Backend API running",
  });
});

app.use(
  "/previews",
  express.static(path.join(process.cwd(), "previews"))
);

app.use("/api/auth", authRoutes);
app.use("/api/performer", performerRoutes);
app.use("/api/writer", writerRoutes);
app.use("/api/collab", collaborationRoutes);
app.use("/api/developer", developerRoutes);

const server = createServer(app);
const yjsWss = new WebSocketServer({
  server,
  path: "/yjs",
});
const writerWss = new WebSocketServer({
  server,
  path: "/writer",
});
const docs = new Map<string, Y.Doc>();

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  userName: string;
}

const sessions = new Map<string, Set<ClientInfo>>();
export function getConnectedUsers(sessionId: string) {
  const clients = sessions.get(sessionId);

  if (!clients) {
    return [];
  }

  return Array.from(clients).map((client) => ({
    userId: client.userId,
    userName: client.userName,
  }));
}

const writerConnections = new Map<
  string,
  Set<WebSocket>
>();

export function sendIdeaToWriter(
  writerId: string,
  idea: any
) {
  const sockets = writerConnections.get(writerId);

  if (!sockets) return;

  const message = JSON.stringify({
    type: "new-idea",
    data: idea,
  });

  sockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}
yjsWss.on("connection", (ws, req) => {
  const url = new URL(
    req.url || "",
    `http://${req.headers.host}`
  );

  const sessionId = url.searchParams.get("sessionId");
  const userId = url.searchParams.get("userId");
  const userName = url.searchParams.get("userName");

  if (!sessionId || !userId || !userName) {
    console.log("Invalid Yjs connection.");
    ws.close();
    return;
  }

  console.log(
    `Yjs Client ${userName}/${userId} connected to ${sessionId}`
  );

  if (!docs.has(sessionId)) {
    docs.set(sessionId, new Y.Doc());
  }

  const doc = docs.get(sessionId)!;

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set());
  }

  const sessionClients = sessions.get(sessionId)!;

  const clientInfo: ClientInfo = {
    ws,
    userId,
    userName,
  };

  sessionClients.add(clientInfo);

  const state = Y.encodeStateAsUpdate(doc);

  ws.send(state);

  ws.on("message", (message: Buffer) => {
    try {
      const update = new Uint8Array(message);

      Y.applyUpdate(doc, update);
      sessionClients.forEach((client) => {
        if (
          client.ws !== ws &&
          client.ws.readyState === WebSocket.OPEN
        ) {
          client.ws.send(update);
        }
      });
    } catch (err) {
      console.error("Failed to apply Yjs update:", err);
    }
  });

  ws.on("close", () => {
    console.log(
      `Yjs Client ${userName}/${userId} disconnected from ${sessionId}`
    );

    sessionClients.delete(clientInfo);

    if (sessionClients.size === 0) {
      sessions.delete(sessionId);

      console.log(
        `Session ${sessionId} became empty`
      );
    }
  });

  ws.on("error", (err) => {
    console.error(
      `Yjs websocket error (${userName}):`,
      err
    );
  });
});
writerWss.on("connection", (ws) => {
  console.log("Writer websocket connected.");

  let registeredWriterId: string | null = null;

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      switch (parsed.type) {
        case "register-writer": {
          const { writerId } = parsed;

          if (!writerId) {
            return;
          }

          registeredWriterId = writerId;

          if (!writerConnections.has(writerId)) {
            writerConnections.set(
              writerId,
              new Set<WebSocket>()
            );
          }

          writerConnections
            .get(writerId)!
            .add(ws);

          console.log(
            `Writer ${writerId} registered`
          );

          ws.send(
            JSON.stringify({
              type: "registered",
              writerId,
            })
          );

          break;
        }

        case "ping": {
          ws.send(
            JSON.stringify({
              type: "pong",
            })
          );
          break;
        }

        default: {
          console.log(
            "Unknown writer websocket message:",
            parsed
          );
        }
      }
    } catch (err) {
      console.error(
        "Invalid JSON received on writer websocket:",
        err
      );
    }
  });

  ws.on("close", () => {
    console.log("Writer websocket disconnected.");

    if (
      registeredWriterId &&
      writerConnections.has(registeredWriterId)
    ) {
      const clients =
        writerConnections.get(registeredWriterId)!;

      clients.delete(ws);

      if (clients.size === 0) {
        writerConnections.delete(
          registeredWriterId
        );
      }
    }
  });

  ws.on("error", (err) => {
    console.error(
      "Writer websocket error:",
      err
    );
  });
});
server.listen(PORT, () => {
  console.log("========================================");
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Yjs WebSocket: ws://localhost:${PORT}/yjs`
  );
  console.log(
    `Writer WebSocket  : ws://localhost:${PORT}/writer`
  );
  console.log("========================================");
});