import express from "express";
import creationRoutes from "./routes/creationRoute.js";
import viewRoutes from "./routes/viewRoute.js";

const app = express();

app.use(express.json());

app.use("/api/create", creationRoutes);
app.use("/api/view", viewRoutes);

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
