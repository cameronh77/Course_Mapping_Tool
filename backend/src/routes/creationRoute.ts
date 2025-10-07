import express from "express";
import { addCourse } from "../controllers/creationController.js";

const router = express.Router();

router.get("/course", addCourse);

export default router;
