import express from "express";
import {
  addUnitLearningOutcome,
  deleteUnitLearningOutcome,
  updateUnitLearningOutcome,
  viewUnitLearningOutcomes,
  viewUnitLearningOutcomesByUnit,
} from "../controllers/unitLearningOutcomeController.js";

const router = express.Router();

router.post("/create", addUnitLearningOutcome);
router.delete("/delete", deleteUnitLearningOutcome);
router.get("/view", viewUnitLearningOutcomes);
router.get("/viewAll/:unitId", viewUnitLearningOutcomesByUnit);
router.put("/update/:uloId", updateUnitLearningOutcome);

export default router;