import express from "express";
import {
  createSession,
  getSessions,
  joinSession,
  getSessionDetails,
  saveCanvasData,
  getCanvasData,
  leaveSession,
  getConnectedUsers,
} from "../controllers/collaborationController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create", requireAuth, createSession);
router.get("/sessions", requireAuth, getSessions);
router.post("/join", requireAuth, joinSession);
router.get("/session/:id", requireAuth, getSessionDetails);
router.post("/session/:id/canvas", requireAuth, saveCanvasData);
router.get("/session/:id/canvas", requireAuth, getCanvasData);
router.post("/session/:id/leave", requireAuth, leaveSession);
router.get("/session/:id/connected-users", requireAuth, getConnectedUsers);

export default router;
