import express from "express";
import { updateCourse } from "../controllers/updateCourseController.js";

const router = express.Router();

router.put("/course/:courseId", updateCourse);

export default router;