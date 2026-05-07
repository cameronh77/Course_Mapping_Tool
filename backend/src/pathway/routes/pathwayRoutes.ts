import { Router } from "express";
import {
  createPathway,
  getPathwaysByCourse,
  deletePathway,
  updatePathway,
  duplicatePathway,
} from "../controllers/pathwayController.js";

const router = Router();

router.get("/", getPathwaysByCourse);
router.post("/", createPathway);
router.post("/:pathwayId/duplicate", duplicatePathway);
router.put("/:pathwayId", updatePathway);
router.delete("/:pathwayId", deletePathway);

export default router;
