import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { joinSquad,createSquad, getSquads } from "../controllers/performerController";

const router = express.Router();

router.get("/squads", requireAuth, getSquads);
router.post("/createsquad", requireAuth, createSquad);
router.post("/join",requireAuth,joinSquad)
export default router;
