import express from "express";
import {
  addCourseLearningOutcome,
  deleteCourseLearningOutcome,
  updateCourseLearningOutcome,
  viewCourseLearningOutcomes,
} from "../controllers/courseLearningOutcomeController.js";

const router = express.Router();

router.post("/create", addCourseLearningOutcome);
router.delete("/delete", deleteCourseLearningOutcome);
router.get("/view", viewCourseLearningOutcomes);
router.put("/update/:cloId", updateCourseLearningOutcome);

export default router;