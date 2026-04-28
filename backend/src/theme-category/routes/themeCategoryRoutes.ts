import express from "express";
import {
  listByCourse,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/themeCategoryControllers.js";

const router = express.Router();

router.get("/by-course/:courseId", listByCourse);
router.post("/create", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
