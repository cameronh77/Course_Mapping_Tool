import express from "express";
import {
  addCourse,
  deleteCourse,
  updateCourse,
  viewCourses,
} from "../controllers/courseController.js";

const router = express.Router();

router.post("/create", addCourse);
router.delete("/delete", deleteCourse);
router.put("/update/:courseId", updateCourse);
router.get("/view", viewCourses);

export default router;
