import type { Request, Response } from "express";
import prisma from "../../../database/prismaClient.js";

export const createPathway = async (req: Request, res: Response) => {
  const { name, type, courseId } = req.body;

  try {
    if (!name || !type || !courseId) {
      return res.status(400).json({ message: "name, type, and courseId are required" });
    }

    const pathway = await prisma.pathway.create({
      data: { name, type, courseId },
    });

    return res.status(201).json(pathway);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPathwaysByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.query;

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const pathways = await prisma.pathway.findMany({
      where: { courseId: courseId as string },
    });

    return res.status(200).json(pathways);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deletePathway = async (req: Request, res: Response) => {
  const { pathwayId } = req.params;

  try {
    const pathway = await prisma.pathway.findUnique({
      where: { pathwayId: parseInt(pathwayId as string) },
    });

    if (!pathway) {
      return res.status(404).json({ message: "Pathway not found" });
    }

    if (pathway.type === "CORE") {
      return res.status(400).json({ message: "Cannot delete the Core pathway" });
    }

    await prisma.pathway.delete({ where: { pathwayId: parseInt(pathwayId as string) } });

    return res.status(200).json({ message: "Pathway deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const duplicatePathway = async (req: Request, res: Response) => {
  const { pathwayId } = req.params;
  const { name, type } = req.body;

  try {
    const sourceId = parseInt(pathwayId as string);
    const source = await prisma.pathway.findUnique({
      where: { pathwayId: sourceId },
      include: { courseUnits: true, canvasPlaceholders: true },
    });

    if (!source) {
      return res.status(404).json({ message: "Pathway not found" });
    }

    if (!name || !type) {
      return res.status(400).json({ message: "name and type are required" });
    }

    const newPathway = await prisma.pathway.create({
      data: { name, type, courseId: source.courseId },
    });

    if (source.courseUnits.length > 0) {
      await prisma.courseUnit.createMany({
        data: source.courseUnits.map((cu: { courseId: string; unitId: string; semester: number; year: number; elective: boolean; position: object | null; color: string | null }) => ({
          courseId: cu.courseId,
          unitId: cu.unitId,
          pathwayId: newPathway.pathwayId,
          semester: cu.semester,
          year: cu.year,
          elective: cu.elective,
          position: cu.position ?? undefined,
          color: cu.color,
        })),
      });
    }

    if (source.canvasPlaceholders.length > 0) {
      await prisma.canvasPlaceholder.createMany({
        data: source.canvasPlaceholders.map((cp: { courseId: string; placeholderType: string; x: number; y: number; label: string | null; options: object | null; unitOptions: object | null; minCredits: number | null; maxCredits: number | null; maxTotalCredits: number | null }) => ({
          courseId: cp.courseId,
          pathwayId: newPathway.pathwayId,
          placeholderType: cp.placeholderType,
          x: cp.x,
          y: cp.y,
          label: cp.label,
          options: cp.options ?? undefined,
          unitOptions: cp.unitOptions ?? undefined,
          minCredits: cp.minCredits,
          maxCredits: cp.maxCredits,
          maxTotalCredits: cp.maxTotalCredits,
        })),
      });
    }

    return res.status(201).json(newPathway);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePathway = async (req: Request, res: Response) => {
  const { pathwayId } = req.params;
  const { name, type } = req.body;

  try {
    const updated = await prisma.pathway.update({
      where: { pathwayId: parseInt(pathwayId as string) },
      data: { name, type },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
