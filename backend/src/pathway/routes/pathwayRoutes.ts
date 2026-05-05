import { Router } from "express";
import {
  createPathway,
  getPathwaysByCourse,
  deletePathway,
  updatePathway,
} from "../controllers/pathwayController.js";

const router = Router();

router.get("/", getPathwaysByCourse);
router.post("/", createPathway);
router.put("/:pathwayId", updatePathway);
router.delete("/:pathwayId", deletePathway);

export default router;
