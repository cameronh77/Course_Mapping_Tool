import express from "express";
import {
  addUnit,
  deleteUnit,
  updateUnit,
  viewUnits,
} from "../controllers/unitController.js";

const router = express.Router();

router.post("/create", addUnit);
router.delete("/delete", deleteUnit);
router.put("/update/:unitId", updateUnit);
router.get("/view", viewUnits);

export default router;