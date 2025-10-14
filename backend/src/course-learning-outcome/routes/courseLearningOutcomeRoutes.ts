import express from "express";
import {
  addCourseLearningOutcome,
  deleteCourseLearningOutcome,
  updateCourseLearningOutcome,
  viewCourseLearningOutcome,
  viewCourseLearningOutcomes,
} from "../controllers/courseLearningOutcomeController.js";

const router = express.Router();

router.post("/create", addCourseLearningOutcome);
router.delete("/delete", deleteCourseLearningOutcome);
router.get("/viewAll/:courseId", viewCourseLearningOutcomes);
router.get("/view/:cloId", viewCourseLearningOutcome);
router.put("/update/:cloId", updateCourseLearningOutcome);

export default router;
