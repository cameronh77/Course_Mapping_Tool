import express from "express";
import creationRoutes from "./course/routes/createCourseRoute.js";
import viewRoutes from "./course/routes/viewCourseRoute.js";
import deleteRoutes from "./course/routes/deleteCourseRoute.js";
import updateRoutes from "./course/routes/updateCourseRoute.js";

const app = express();

app.use(express.json());

app.use("/api/create", creationRoutes);
app.use("/api/view", viewRoutes);
app.use("/api/delete", deleteRoutes);
app.use("/api/update", updateRoutes);

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
