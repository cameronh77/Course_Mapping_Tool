import express from "express";
import { viewCourses } from "../controllers/viewController.js";

const router = express.Router();

router.get("/course", viewCourses);

export default router;
