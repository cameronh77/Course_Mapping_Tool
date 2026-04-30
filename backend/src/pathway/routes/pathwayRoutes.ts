import express from "express";
import {
  getPathwaysByCourse,
  createPathway,
  updatePathway,
  deletePathway,
  assignUnitToPathway,
  createRequirement,
  updateRequirement,
  deleteRequirement,
} from "../controllers/pathwayController.js";

const router = express.Router();

// Pathway (Specialisation) routes
router.get("/view", getPathwaysByCourse);
router.post("/create", createPathway);
router.put("/update/:sId", updatePathway);
router.delete("/delete/:sId", deletePathway);

// Unit assignment
router.post("/assign-unit", assignUnitToPathway);

// Requirement routes
router.post("/requirement/create", createRequirement);
router.put("/requirement/update/:reqId", updateRequirement);
router.delete("/requirement/delete/:reqId", deleteRequirement);

export default router;
