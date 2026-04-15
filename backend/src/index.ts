import express from "express";
import courseRoutes from "./course/routes/courseRoutes.js";
import unitRoutes from "./unit/routes/unitRoutes.js";
import courseUnitRoutes from "./course-unit/routes/courseUnitRoutes.js";
import courseLearningOutcomeRoutes from "./course-learning-outcome/routes/courseLearningOutcomeRoutes.js";
import unitLearningOutcomeRoutes from "./unit-learning-outcome/routes/unitLearningOutcomeRoutes.js";
import assessmentRoutes from "./assessment/routes/assessmentRoutes.js";
import tagRoutes from "./tag/routes/tagRoutes.js";
import unitRelationshipRoutes from "./unit-relationship/routes/unitRelationshipRoutes.js";
import assessmentRoutes from "./Assessment/routes/assessmentRoutes.js";
import assessmentRelationshipRoutes from "./AssessmentRelationships/routes/assessmentRelationshipRoutes.js";
import assessmentULORoutes from "./assessment-ulo/routes/assessmentULORoutes.js";
import teachingActivityRoutes from "./teaching-activity/routes/teachingActivityRoutes.js";
import teachingActivityLinksRoutes from "./teaching-activity-links/routes/teachingActivityLinksRoutes.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/course", courseRoutes);
app.use("/api/unit", unitRoutes);
app.use("/api/course-unit", courseUnitRoutes);
app.use("/api/CLO", courseLearningOutcomeRoutes);
app.use("/api/ULO", unitLearningOutcomeRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/tag", tagRoutes);
app.use("/api/unit-relationship", unitRelationshipRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/assessment-relationship", assessmentRelationshipRoutes);
app.use("/api/assessment-ulo", assessmentULORoutes);
app.use("/api/teaching-activity", teachingActivityRoutes);
app.use("/api/teaching-activity-links", teachingActivityLinksRoutes);

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
