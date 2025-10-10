import express from "express";
const router = express.Router();
import { requireAuth } from "../middleware/authMiddleware";
import { createDeveloperSquad , joinDeveloperSquad,getDeveloperSquadDetails, getAllDeveloperSquads,searchDeveloperSquadByCode,sendIdeaToSquad} from "../controllers/developerController";
router.post("/squad/create",requireAuth,createDeveloperSquad);
router.post("/squad/join",requireAuth,joinDeveloperSquad)
router.get("/squad/:squadId", requireAuth, getDeveloperSquadDetails);
router.get("/squads",requireAuth,getAllDeveloperSquads)
router.get("/squads/search", requireAuth, searchDeveloperSquadByCode);
router.post("/send-idea", requireAuth, sendIdeaToSquad);
export default router;