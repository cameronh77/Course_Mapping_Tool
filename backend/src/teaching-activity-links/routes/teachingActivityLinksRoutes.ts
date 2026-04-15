import express from "express";
import {
  addTAAssessmentLink, deleteTAAssessmentLink, viewTAAssessmentLinksByUnit,
  addTAULOLink, deleteTAULOLink, viewTAULOLinksByUnit,
  addTATALink, deleteTATALink, viewTATALinksByUnit,
} from "../controllers/teachingActivityLinksController.js";

const router = express.Router();

router.post("/assessment/create", addTAAssessmentLink);
router.delete("/assessment/delete", deleteTAAssessmentLink);
router.get("/assessment/view", viewTAAssessmentLinksByUnit);

router.post("/ulo/create", addTAULOLink);
router.delete("/ulo/delete", deleteTAULOLink);
router.get("/ulo/view", viewTAULOLinksByUnit);

router.post("/ta/create", addTATALink);
router.delete("/ta/delete", deleteTATALink);
router.get("/ta/view", viewTATALinksByUnit);

export default router;
