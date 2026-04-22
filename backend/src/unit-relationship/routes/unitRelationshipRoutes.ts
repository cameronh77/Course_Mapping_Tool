import express from "express";
import {
  createRelationship,
  updateRelationship,
  deleteRelationship,
  viewRelationshipsByCourse,
  viewAllRelationships,
} from "../controllers/unitRelationshipController.js";

const router = express.Router();

router.post("/create", createRelationship);
router.put("/update/:id", updateRelationship);
router.delete("/delete/:id", deleteRelationship);
router.get("/view", viewRelationshipsByCourse);
router.get("/view-all", viewAllRelationships);

export default router;
