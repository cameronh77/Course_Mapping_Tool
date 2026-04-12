import prisma from "../../../database/prismaClient.js";
import type { Request, Response } from "express";

const parseUnitLoIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const parsed = value
    .map((item) => Number(item))
    .filter((id) => Number.isInteger(id) && id > 0);
  return Array.from(new Set(parsed));
};

const parseOptionalInt = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export const addAssessment = async (req: Request, res: Response) => {
  const { aDesc, unitId, assessmentType, assessmentConditions, hurdleReq, unitLos } = req.body;

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
    const trimmedType = typeof assessmentType === "string" && assessmentType.trim() ? assessmentType.trim() : "General";
    const trimmedConditions = typeof assessmentConditions === "string" ? assessmentConditions : "";
    const parsedHurdleReq = parseOptionalInt(hurdleReq);
    const unitLoIds = parseUnitLoIds(unitLos);

    const assessment = await prisma.$transaction(async (tx: any) => {
      const created = await tx.assessment.create({
        data: {
          aDesc: trimmedDesc,
          assessmentName: trimmedDesc,
          assessmentType: trimmedType,
          assessmentConditions: trimmedConditions,
          hurdleReq: parsedHurdleReq,
          value: 0,
          unitId: resolvedUnitId,
        },
      });

      if (unitLoIds.length > 0) {
        const unitLosForLinks = await tx.unitLearningOutcome.findMany({
          where: { uloId: { in: unitLoIds } },
          select: { uloId: true, unitId: true },
        });

        if (unitLosForLinks.length > 0) {
          await tx.assessmentULO.createMany({
            data: unitLosForLinks.map((ulo: { uloId: number; unitId: string }) => ({
              assessmentId: created.assessmentId,
              uloId: ulo.uloId,
              unitId: ulo.unitId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.assessment.findUnique({
        where: { assessmentId: created.assessmentId },
        include: { unitLos: true },
      });
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
      include: { unitLos: true },
    });

    return res.status(200).json(assessments);
  } catch (error) {
    console.error("Error viewing assessments:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAssessment = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;
  const { aDesc, unitId, assessmentType, assessmentConditions, hurdleReq, unitLos } = req.body;

  try {
    const parsedId = Number(assessmentId);
    if (!Number.isInteger(parsedId)) {
      return res.status(400).json({ message: "Valid assessmentId is required" });
    }

    if (!aDesc || typeof aDesc !== "string" || !aDesc.trim()) {
      return res.status(400).json({ message: "Assessment description is required" });
    }

    const parsedUnitLoIds = parseUnitLoIds(unitLos);
    const parsedHurdleReq = parseOptionalInt(hurdleReq);

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.assessment.update({
        where: { assessmentId: parsedId },
        data: {
          aDesc: aDesc.trim(),
          assessmentName: aDesc.trim(),
          ...(typeof unitId === "string" && unitId.trim() ? { unitId: unitId.trim() } : {}),
          ...(typeof assessmentType === "string" && assessmentType.trim()
            ? { assessmentType: assessmentType.trim() }
            : {}),
          ...(typeof assessmentConditions === "string" ? { assessmentConditions } : {}),
          ...(hurdleReq !== undefined ? { hurdleReq: parsedHurdleReq } : {}),
        },
      });

      if (Array.isArray(unitLos)) {
        await tx.assessmentULO.deleteMany({ where: { assessmentId: parsedId } });

        if (parsedUnitLoIds.length > 0) {
          const unitLosForLinks = await tx.unitLearningOutcome.findMany({
            where: { uloId: { in: parsedUnitLoIds } },
            select: { uloId: true, unitId: true },
          });

          if (unitLosForLinks.length > 0) {
            await tx.assessmentULO.createMany({
              data: unitLosForLinks.map((ulo: { uloId: number; unitId: string }) => ({
                assessmentId: parsedId,
                uloId: ulo.uloId,
                unitId: ulo.unitId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return tx.assessment.findUnique({
        where: { assessmentId: parsedId },
        include: { unitLos: true },
      });
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating assessment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
