import express from "express";
import { assignWriterId, fetchWriters , addIdeaInbox } from "../controllers/writerController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/assign-id", requireAuth, assignWriterId);
router.get("/fetch",requireAuth,fetchWriters)
router.post("/ai/share",requireAuth,addIdeaInbox)
export default router;
