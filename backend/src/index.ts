import { PrismaClient } from "../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";
import express from "express";

const prisma = new PrismaClient().$extends(withAccelerate());

const app = express();

app.use(express.json());

/**
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
*/

app.get(`/signup`, async (req, res) => {});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server running at localhost:3000`)
);
