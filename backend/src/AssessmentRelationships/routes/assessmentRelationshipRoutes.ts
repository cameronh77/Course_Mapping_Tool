import express from "express";
import {
  addAssessmentRelationship,
  deleteAssessmentRelationship,
  viewAssessmentRelationshipsByUnit,
} from "../controllers/assessmentRelationshipController.js";

const router = express.Router();

router.post("/create", addAssessmentRelationship);
router.delete("/delete", deleteAssessmentRelationship);
router.get("/view", viewAssessmentRelationshipsByUnit);

export default router;
