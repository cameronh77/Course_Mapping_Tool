import type { Request, Response } from "express";
import prisma from "../../../database/prismaClient.js";

// ─── Pathway (Specialisation) CRUD ───────────────────────────────────────────

export const getPathwaysByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.query;
  if (!courseId) return res.status(400).json({ message: "courseId is required" });

  try {
    const pathways = await prisma.specialisation.findMany({
      where: { courseId: courseId as string },
      include: {
        requirements: {
          include: { unitOptions: { include: { unit: true } } },
        },
        courseUnits: true,
      },
      orderBy: [{ entryYear: "asc" }, { entrySemester: "asc" }],
    });
    return res.status(200).json(pathways);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createPathway = async (req: Request, res: Response) => {
  const { courseId, sName, color, entryYear, entrySemester, description } = req.body;
  if (!courseId || !sName) {
    return res.status(400).json({ message: "courseId and sName are required" });
  }

  try {
    const pathway = await prisma.specialisation.create({
      data: {
        courseId,
        sName,
        color: color ?? null,
        entryYear: entryYear ?? null,
        entrySemester: entrySemester ?? null,
        description: description ?? null,
      },
      include: {
        requirements: { include: { unitOptions: { include: { unit: true } } } },
      },
    });
    return res.status(201).json(pathway);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePathway = async (req: Request, res: Response) => {
  const sId = req.params.sId as string;
  const { sName, color, entryYear, entrySemester, description } = req.body;

  try {
    const updated = await prisma.specialisation.update({
      where: { sId: parseInt(sId) },
      data: {
        ...(sName !== undefined && { sName }),
        ...(color !== undefined && { color }),
        ...(entryYear !== undefined && { entryYear }),
        ...(entrySemester !== undefined && { entrySemester }),
        ...(description !== undefined && { description }),
      },
      include: {
        requirements: { include: { unitOptions: { include: { unit: true } } } },
      },
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deletePathway = async (req: Request, res: Response) => {
  const sId = req.params.sId as string;

  try {
    await prisma.specialisation.delete({ where: { sId: parseInt(sId) } });
    return res.status(200).json({ message: "Pathway deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Assign / remove a unit from a pathway via CourseUnit.specialisationSId
export const assignUnitToPathway = async (req: Request, res: Response) => {
  const { courseId, unitId, sId } = req.body;
  if (!courseId || !unitId) {
    return res.status(400).json({ message: "courseId and unitId are required" });
  }

  try {
    const updated = await prisma.courseUnit.update({
      where: { courseId_unitId: { courseId, unitId } },
      data: { specialisationSId: sId ?? null },
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Requirement CRUD ─────────────────────────────────────────────────────────

export const createRequirement = async (req: Request, res: Response) => {
  const { sId, type, label, targetValue, logicGroup, unitOptions } = req.body;
  if (!sId || !type || !label) {
    return res.status(400).json({ message: "sId, type, and label are required" });
  }

  try {
    const requirement = await prisma.pathwayRequirement.create({
      data: {
        sId: parseInt(sId),
        type,
        label,
        targetValue: targetValue ?? null,
        logicGroup: logicGroup ?? "AND",
        unitOptions: unitOptions?.length
          ? { create: unitOptions.map((unitId: string) => ({ unitId })) }
          : undefined,
      },
      include: { unitOptions: { include: { unit: true } } },
    });
    return res.status(201).json(requirement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateRequirement = async (req: Request, res: Response) => {
  const reqId = req.params.reqId as string;
  const { label, targetValue, logicGroup, unitOptions } = req.body;

  try {
    // Replace unit options if provided
    if (unitOptions !== undefined) {
      await prisma.pathwayReqUnit.deleteMany({ where: { reqId: parseInt(reqId) } });
    }

    const updated = await prisma.pathwayRequirement.update({
      where: { reqId: parseInt(reqId) },
      data: {
        ...(label !== undefined && { label }),
        ...(targetValue !== undefined && { targetValue }),
        ...(logicGroup !== undefined && { logicGroup }),
        ...(unitOptions !== undefined && unitOptions.length > 0 && {
          unitOptions: { create: unitOptions.map((unitId: string) => ({ unitId })) },
        }),
      },
      include: { unitOptions: { include: { unit: true } } },
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteRequirement = async (req: Request, res: Response) => {
  const reqId = req.params.reqId as string;

  try {
    await prisma.pathwayRequirement.delete({ where: { reqId: parseInt(reqId) } });
    return res.status(200).json({ message: "Requirement deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
