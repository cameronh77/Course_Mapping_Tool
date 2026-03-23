import express from "express";
import {
  addAssessment,
  deleteAssessment,
  updateAssessment,
  viewAssessments,
} from "../controllers/assessmentController.js";

const router = express.Router();

router.post("/create", addAssessment);
router.delete("/delete", deleteAssessment);
router.put("/update/:assessmentId", updateAssessment);
router.view("/view/assessments/:unitId", viewAssessments);

export default router;
