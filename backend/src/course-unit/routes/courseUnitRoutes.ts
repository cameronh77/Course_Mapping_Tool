import express from "express";
import {
  addCourseUnit,
  deleteCourseUnit,
  updateCourseUnit,
  viewCourseUnits,
} from "../controllers/courseUnitController.js";

const router = express.Router();

router.post("/create", addCourseUnit);
router.delete("/delete", deleteCourseUnit);
router.get("/view", viewCourseUnits);
router.put("/update/:courseId/:unitId", updateCourseUnit);

export default router;