import express from "express";
import { viewCourses } from "../controllers/viewCourseController.js";

const router = express.Router();

router.get("/course", viewCourses);

export default router;
