import express from "express";
import {
  addCourseUnit,
  deleteCourseUnit,
  saveCanvasState,
  updateCourseUnit,
  viewCourseUnits,
} from "../controllers/courseUnitController.js";

const router = express.Router();

router.post("/create", addCourseUnit);
router.post("/canvas/:courseId", saveCanvasState);
router.delete("/delete", deleteCourseUnit);
router.get("/view", viewCourseUnits);
router.put("/update/:courseId/:unitId", updateCourseUnit);

export default router;