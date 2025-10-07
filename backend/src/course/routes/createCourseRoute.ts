import express from "express";
import { addCourse } from "../controllers/createCourseController.js";

const router = express.Router();

router.post("/course", addCourse);

export default router;
