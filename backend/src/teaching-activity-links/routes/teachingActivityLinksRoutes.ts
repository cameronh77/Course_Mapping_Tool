import express from "express";
import { addTAAssessmentLink, deleteTAAssessmentLink, viewTAAssessmentLinksByUnit, addTAULOLink, deleteTAULOLink, viewTAULOLinksByUnit } from "../controllers/teachingActivityLinksController.js";

const router = express.Router();
router.post("/assessment/create", addTAAssessmentLink);
router.delete("/assessment/delete", deleteTAAssessmentLink);
router.get("/assessment/view", viewTAAssessmentLinksByUnit);
router.post("/ulo/create", addTAULOLink);
router.delete("/ulo/delete", deleteTAULOLink);
router.get("/ulo/view", viewTAULOLinksByUnit);
export default router;
