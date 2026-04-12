import prisma from "../../../database/prismaClient.js";
import type { Request, Response } from "express";

export const addAssessment = async (req: Request, res: Response) => {
  const { aDesc, unitId } = req.body;

  try {
    if (!aDesc || typeof aDesc !== "string" || !aDesc.trim()) {
      return res.status(400).json({ message: "Assessment description is required" });
    }

    let resolvedUnitId: string | null = null;
    if (typeof unitId === "string" && unitId.trim()) {
      resolvedUnitId = unitId.trim();
    } else {
      const fallbackUnit = await prisma.unit.findFirst({
        select: { unitId: true },
        orderBy: { unitId: "asc" },
      });
      resolvedUnitId = fallbackUnit?.unitId || null;
    }

    if (!resolvedUnitId) {
      return res.status(400).json({ message: "A valid unitId is required to create an assessment" });
    }

    const trimmedDesc = aDesc.trim();

    const assessment = await prisma.assessment.create({
      data: {
        aDesc: trimmedDesc,
        assessmentName: trimmedDesc,
        assessmentType: "General",
        assessmentConditions: "",
        value: 0,
        unitId: resolvedUnitId,
      },
    });

    return res.status(201).json(assessment);
  } catch (error) {
    console.error("Error creating assessment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssessment = async (req: Request, res: Response) => {
  const { assessmentId } = req.body;

  try {
    const parsedId = Number(assessmentId);
    if (!Number.isInteger(parsedId)) {
      return res.status(400).json({ message: "Valid assessmentId is required" });
    }

    const deleted = await prisma.assessment.delete({
      where: { assessmentId: parsedId },
    });

    return res.status(200).json(deleted);
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessments = async (_req: Request, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { assessmentId: "asc" },
    });

    return res.status(200).json(assessments);
  } catch (error) {
    console.error("Error viewing assessments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAssessment = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const { aDesc } = req.body;

  try {
    const parsedId = Number(assessmentId);
    if (!Number.isInteger(parsedId)) {
      return res.status(400).json({ message: "Valid assessmentId is required" });
    }

    if (!aDesc || typeof aDesc !== "string" || !aDesc.trim()) {
      return res.status(400).json({ message: "Assessment description is required" });
    }

    const updated = await prisma.assessment.update({
      where: { assessmentId: parsedId },
      data: {
        aDesc: aDesc.trim(),
        assessmentName: aDesc.trim(),
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating assessment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
