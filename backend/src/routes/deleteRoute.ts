import express from "express";
import { deleteCourse } from "../controllers/deleteController.js";

const router = express.Router();

router.delete("/course", deleteCourse);

export default router;
