import express from "express";
import { addTeachingActivity, deleteTeachingActivity, updateTeachingActivity, viewTeachingActivitiesByUnit } from "../controllers/teachingActivityController.js";

const router = express.Router();
router.post("/create", addTeachingActivity);
router.delete("/delete", deleteTeachingActivity);
router.put("/update/:activityId", updateTeachingActivity);
router.get("/viewAll/:unitId", viewTeachingActivitiesByUnit);
export default router;
