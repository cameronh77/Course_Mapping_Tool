import type { Request, Response } from "express";
import prisma from "../../../database/prismaClient.js";

const sendError = (res: Response, error: unknown) => {
  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: error instanceof Error ? error.message : "Unknown error",
  });
};

// GET /api/canvas-placeholder?courseId=X
export const getCanvasPlaceholders = async (req: Request, res: Response) => {
  const { courseId } = req.query;
  if (!courseId || typeof courseId !== "string") {
    return res.status(400).json({ message: "courseId is required" });
  }
  try {
    const placeholders = await prisma.canvasPlaceholder.findMany({
      where: { courseId },
    });
    return res.json(placeholders);
  } catch (err) {
    return sendError(res, err);
  }
};

// POST /api/canvas-placeholder
export const createCanvasPlaceholder = async (req: Request, res: Response) => {
  const { courseId, placeholderType, x, y, label, options, unitOptions, minCredits, maxCredits, maxTotalCredits } = req.body;
  if (!courseId || !placeholderType) {
    return res.status(400).json({ message: "courseId and placeholderType are required" });
  }
  try {
    const placeholder = await prisma.canvasPlaceholder.create({
      data: {
        courseId,
        placeholderType,
        x: Number(x) || 0,
        y: Number(y) || 0,
        label: label ?? null,
        options: options ?? undefined,
        unitOptions: unitOptions ?? undefined,
        minCredits: minCredits != null ? Number(minCredits) : null,
        maxCredits: maxCredits != null ? Number(maxCredits) : null,
        maxTotalCredits: maxTotalCredits != null ? Number(maxTotalCredits) : null,
      },
    });
    return res.status(201).json(placeholder);
  } catch (err) {
    return sendError(res, err);
  }
};

// PUT /api/canvas-placeholder/:id
export const updateCanvasPlaceholder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const { x, y, label, options, unitOptions, minCredits, maxCredits, maxTotalCredits } = req.body;
  try {
    const updated = await prisma.canvasPlaceholder.update({
      where: { id },
      data: {
        ...(x !== undefined && { x: Number(x) }),
        ...(y !== undefined && { y: Number(y) }),
        ...(label !== undefined && { label }),
        ...(options !== undefined && { options }),
        ...(unitOptions !== undefined && { unitOptions }),
        ...(minCredits !== undefined && { minCredits: minCredits != null ? Number(minCredits) : null }),
        ...(maxCredits !== undefined && { maxCredits: maxCredits != null ? Number(maxCredits) : null }),
        ...(maxTotalCredits !== undefined && { maxTotalCredits: maxTotalCredits != null ? Number(maxTotalCredits) : null }),
      },
    });
    return res.json(updated);
  } catch (err) {
    return sendError(res, err);
  }
};

// DELETE /api/canvas-placeholder/:id
export const deleteCanvasPlaceholder = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    await prisma.canvasPlaceholder.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return sendError(res, err);
  }
};
