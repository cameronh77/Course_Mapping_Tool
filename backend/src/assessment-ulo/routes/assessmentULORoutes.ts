import express from "express";
import {
  addAssessmentULO,
  deleteAssessmentULO,
  viewAssessmentULOsByUnit,
} from "../controllers/assessmentULOController.js";

const router = express.Router();

router.post("/create", addAssessmentULO);
router.delete("/delete", deleteAssessmentULO);
router.get("/view", viewAssessmentULOsByUnit);

export default router;
