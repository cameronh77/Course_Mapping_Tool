import express from "express";
import courseRoutes from "./course/routes/courseRoutes.js";
import unitRoutes from "./unit/routes/unitRoutes.js";
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

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
