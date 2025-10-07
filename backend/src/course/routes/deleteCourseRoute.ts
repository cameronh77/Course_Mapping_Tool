import express from "express";
import { deleteCourse } from "../controllers/deleteCourseController.js";

const router = express.Router();

router.delete("/course", deleteCourse);

export default router;
