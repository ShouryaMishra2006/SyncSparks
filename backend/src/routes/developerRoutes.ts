import express from "express";
const router = express.Router();
import { requireAuth } from "../middleware/authMiddleware";
import handler, { createDeveloperSquad ,pushWorkAndDeploy,getPreviewMeta,markRequestDone, joinDeveloperSquad,getDeveloperSquadDetails, getAllDeveloperSquads,searchDeveloperSquadByCode,sendIdeaToSquad,getPreviewById} from "../controllers/developerController";
router.post("/squad/create",requireAuth,createDeveloperSquad);
router.post("/squad/join",requireAuth,joinDeveloperSquad)
router.get("/squad/:squadId", requireAuth, getDeveloperSquadDetails);
router.get("/squads",requireAuth,getAllDeveloperSquads)
router.get("/squads/search", requireAuth, searchDeveloperSquadByCode);
router.post("/send-idea", requireAuth, sendIdeaToSquad);
router.post("/push-work", requireAuth, pushWorkAndDeploy);
router.get("/preview/:previewId", requireAuth, getPreviewMeta);
router.post("/mark-request-done", requireAuth, markRequestDone);
router.post("/generate-image",handler)
router.post("/push-work",requireAuth,pushWorkAndDeploy);
router.get("/preview/:previewId", getPreviewById);
export default router;