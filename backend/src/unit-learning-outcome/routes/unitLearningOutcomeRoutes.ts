import express from "express";
import {
  addUnitLearningOutcome,
  deleteUnitLearningOutcome,
  updateUnitLearningOutcome,
  viewUnitLearningOutcomes,
} from "../controllers/unitLearningOutcomeController.js";

const router = express.Router();

router.post("/create", addUnitLearningOutcome);
router.delete("/delete", deleteUnitLearningOutcome);
router.get("/view", viewUnitLearningOutcomes);
router.put("/update/:uloId", updateUnitLearningOutcome);

export default router;