import express from "express";
import {
  addTag,
  addUnitsToTag,
  deleteTag,
  deleteUnitFromTag,
  viewTagsByCourse,
  viewTagsByUnit,
} from "../controllers/tagControllers.js";

const router = express.Router();

router.post("/create", addTag);
router.post("/associate-unit", addUnitsToTag);
router.get("/view-tags/:courseId", viewTagsByCourse);
router.get("/view-unit-tags", viewTagsByUnit);
router.delete("/delete", deleteTag);
router.delete("/delete-from-tag/", deleteUnitFromTag);

export default router;
