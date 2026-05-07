import express from "express";
import {
  getCanvasPlaceholders,
  createCanvasPlaceholder,
  updateCanvasPlaceholder,
  deleteCanvasPlaceholder,
} from "../controllers/canvasPlaceholderController.js";

const router = express.Router();

router.get("/", getCanvasPlaceholders);
router.post("/", createCanvasPlaceholder);
router.put("/:id", updateCanvasPlaceholder);
router.delete("/:id", deleteCanvasPlaceholder);

export default router;
