import express from "express";
import creationRoutes from "./routes/creationRoute.js";
import viewRoutes from "./routes/viewRoute.js";
import deleteRoutes from "./routes/deleteRoute.js";

const app = express();

app.use(express.json());

app.use("/api/create", creationRoutes);
app.use("/api/view", viewRoutes);
app.use("/api/delete", deleteRoutes);

const server = app.listen(3000, () =>
  console.log(`
  Server running at localhost:3000`)
);
