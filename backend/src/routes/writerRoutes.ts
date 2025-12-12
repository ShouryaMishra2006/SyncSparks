import express from "express";
import { assignWriterId, fetchWriters , addIdeaInbox ,removeIdea} from "../controllers/writerController";
import { requireAuth } from "../middleware/authMiddleware";
import { expandIdeaWithAI } from "../controllers/aiController";
import { updatelocation } from "../controllers/writerController";
import { getNearbyWriters } from "../controllers/writerController";
const router = express.Router();

router.post("/assign-id", requireAuth, assignWriterId);
router.get("/fetch",requireAuth,fetchWriters)
router.post("/ai/share",requireAuth,addIdeaInbox)
router.post("/remove-idea", requireAuth, removeIdea);
router.post("/expand-idea",requireAuth,expandIdeaWithAI)
router.post("/update-location",requireAuth,updatelocation)
router.get("/nearby",requireAuth,getNearbyWriters)
export default router;
