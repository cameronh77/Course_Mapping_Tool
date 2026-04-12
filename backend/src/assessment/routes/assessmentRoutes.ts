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
router.get("/view", viewAssessments);
router.put("/update/:assessmentId", updateAssessment);

export default router;
