import express from "express";
import { addCourse } from "../controllers/creationController.js";

const router = express.Router();

router.post("/course", addCourse);

export default router;
