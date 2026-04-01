import express from "express";
import {
  addAssessmentRelationship,
  deleteAssessmentRelationship,
  updateAssessmentRelationship,
  viewAssessmentRelationships,
} from "../controllers/assessmentRelationshipController.js";

const router = express.Router();

router.post("/create", addAssessmentRelationship);
router.delete("/delete", deleteAssessmentRelationship);
router.put("/update", updateAssessmentRelationship);
router.get("/view", viewAssessmentRelationships);

export default router;
