import express from "express";
import courseRoutes from "./course/routes/courseRoutes.js";
import unitRoutes from "./unit/routes/unitRoutes.js";
import courseUnitRoutes from "./course-unit/routes/courseUnitRoutes.js";
import courseLearningOutcomeRoutes from "./course-learning-outcome/routes/courseLearningOutcomeRoutes.js";
import unitLearningOutcomeRoutes from "./unit-learning-outcome/routes/unitLearningOutcomeRoutes.js";
import tagRoutes from "./tag/routes/tagRoutes.js";
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
app.use("/api/tag", tagRoutes);

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
