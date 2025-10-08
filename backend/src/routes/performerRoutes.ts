import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { joinSquad,createSquad, getSquads, getSquadDetails, addIdea } from "../controllers/performerController";
import { summarizeIdeas } from "../controllers/aiController";
import { generateMindMapBySquad } from "../controllers/mindmapController";

const router = express.Router();

router.get("/squads", requireAuth, getSquads);
router.get("/squads/:id",requireAuth,getSquadDetails);
router.post("/createsquad", requireAuth, createSquad);
router.post("/join",requireAuth,joinSquad)
router.post("/squads/:squadId/idea",requireAuth,addIdea)
router.post("/squads/:id/summarize", requireAuth, summarizeIdeas);
router.post("/squads/:id/mindmap",requireAuth ,generateMindMapBySquad);
export default router;
