import express from "express";
import {
  addCourseUnit,
  deleteCourseUnit,
  saveCanvasState,
  saveTagMappings,
  updateCourseUnit,
  viewCourseUnits,
} from "../controllers/courseUnitController.js";

const router = express.Router();

router.post("/create", addCourseUnit);
router.post("/canvas/:courseId", saveCanvasState);
router.post("/tags/:courseId", saveTagMappings);
router.delete("/delete", deleteCourseUnit);
router.get("/view", viewCourseUnits);
router.put("/update/:id", updateCourseUnit);

export default router;