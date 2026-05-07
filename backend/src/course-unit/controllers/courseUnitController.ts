import type { Request, Response } from "express";
import prisma from "../../../database/prismaClient.js";

type CourseUnitCanvasEntry = {
  unitId?: string;
  x?: number;
  y?: number;
  color?: string | null;
  semester?: number;
  year?: number;
  elective?: boolean;
};

type UnitMappingEntry = {
  tags?: Array<{ tagId?: number | string }>;
  clos?: Array<{ cloId?: number | string }>;
};

type SaveCanvasBody = {
  pathwayId?: number;
  units?: CourseUnitCanvasEntry[];
  unitMappings?: Record<string, UnitMappingEntry>;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sendServerError = (res: Response, error: unknown) => {
  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: error instanceof Error ? error.message : "Unknown error",
  });
};

export const addCourseUnit = async (req: Request, res: Response) => {
  const { courseId, unitId, semester, year, elective, pathwayId, color, position } = req.body;

  try {
    if (!courseId || !unitId) {
      return res.status(400).json({ message: "courseId and unitId are required" });
    }

    if (semester === undefined || year === undefined || elective === undefined) {
      return res.status(400).json({ message: "semester, year, and elective are required" });
    }

    if (!pathwayId) {
      return res.status(400).json({ message: "pathwayId is required" });
    }

    const existingCourseUnit = await prisma.courseUnit.findUnique({
      where: {
        courseId_unitId_pathwayId: {
          courseId,
          unitId,
          pathwayId: toFiniteNumber(pathwayId, 0),
        },
      },
    });

    if (existingCourseUnit) {
      return res.status(400).json({ message: "CourseUnit already exists in this pathway" });
    }

    const newCourseUnit = await prisma.courseUnit.create({
      data: {
        courseId,
        unitId,
        semester: toFiniteNumber(semester, 0),
        year: toFiniteNumber(year, 0),
        elective: Boolean(elective),
        pathwayId: toFiniteNumber(pathwayId, 0),
        color: color || null,
        position: position ?? undefined,
      },
    });

    return res.status(201).json(newCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const deleteCourseUnit = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const deletedCourseUnit = await prisma.courseUnit.delete({
      where: { id: toFiniteNumber(id, 0) },
    });

    return res.status(200).json(deletedCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const saveCanvasState = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { pathwayId, units, unitMappings } = req.body as SaveCanvasBody;

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    if (!pathwayId) {
      return res.status(400).json({ message: "pathwayId is required" });
    }

    const normalizedUnits = new Map<string, CourseUnitCanvasEntry>();

    for (const unit of Array.isArray(units) ? units : []) {
      if (!unit?.unitId) {
        continue;
      }

      normalizedUnits.set(unit.unitId, unit);
    }

    const courseUnitsData = Array.from(normalizedUnits.values()).map((unit) => ({
      courseId,
      unitId: unit.unitId as string,
      pathwayId: toFiniteNumber(pathwayId, 0),
      semester: toFiniteNumber(unit.semester, 0),
      year: toFiniteNumber(unit.year, 0),
      elective: Boolean(unit.elective),
      position: {
        x: toFiniteNumber(unit.x, 0),
        y: toFiniteNumber(unit.y, 0),
      },
      color: unit.color || null,
    }));

    const unitIdsOnCanvas = Array.from(normalizedUnits.keys());

    // Build desired (unitId, tagId) set from the payload, scoped to units on the canvas.
    const desiredTagPairs: Array<{ unitId: string; tagId: number }> = [];
    if (unitMappings && typeof unitMappings === "object") {
      for (const unitId of unitIdsOnCanvas) {
        const mapping = unitMappings[unitId];
        const tags = Array.isArray(mapping?.tags) ? mapping!.tags : [];
        const seen = new Set<number>();
        for (const tag of tags) {
          const tagId = typeof tag?.tagId === "number" ? tag.tagId : Number(tag?.tagId);
          if (!Number.isFinite(tagId) || seen.has(tagId)) continue;
          seen.add(tagId);
          desiredTagPairs.push({ unitId, tagId });
        }
      }
    }

    await prisma.$transaction(async (tx: typeof prisma) => {
      // Delete only the units for this specific pathway
      await tx.courseUnit.deleteMany({
        where: { courseId, pathwayId: toFiniteNumber(pathwayId, 0) },
      });

      if (courseUnitsData.length > 0) {
        await tx.courseUnit.createMany({
          data: courseUnitsData,
          skipDuplicates: false,
        });
      }

      // Reconcile tag associations only for units present in the payload.
      if (unitIdsOnCanvas.length > 0) {
        await tx.courseUnitTags.deleteMany({
          where: { courseId, unitId: { in: unitIdsOnCanvas } },
        });

        if (desiredTagPairs.length > 0) {
          const referencedTagIds = Array.from(new Set(desiredTagPairs.map((p) => p.tagId)));
          const existingTags = await tx.tag.findMany({
            where: { courseId, tagId: { in: referencedTagIds } },
            select: { tagId: true },
          });
          const validTagIds = new Set(existingTags.map((t: { tagId: number }) => t.tagId));
          const validPairs = desiredTagPairs.filter((p) => validTagIds.has(p.tagId));

          if (validPairs.length > 0) {
            await tx.courseUnitTags.createMany({
              data: validPairs.map(({ unitId, tagId }) => ({ courseId, unitId, tagId })),
              skipDuplicates: true,
            });
          }
        }
      }
    });

    return res.status(200).json({
      message: "Canvas state saved successfully",
      savedUnits: courseUnitsData.length,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const viewCourseUnits = async (req: Request, res: Response) => {
  const courseId = typeof req.query.courseId === "string" ? req.query.courseId : null;
  const pathwayIdRaw = typeof req.query.pathwayId === "string" ? req.query.pathwayId : null;
  const pathwayId = pathwayIdRaw ? Number(pathwayIdRaw) : null;

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId query param is required" });
    }

    const courseUnits = await prisma.courseUnit.findMany({
      where: {
        courseId,
        ...(pathwayId && Number.isFinite(pathwayId) ? { pathwayId } : {}),
      },
      include: { unit: true },
      orderBy: [{ courseId: "asc" }, { unitId: "asc" }],
    });

    return res.status(200).json(courseUnits);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const updateCourseUnit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { semester, year, elective, pathwayId, color, position } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const updatedCourseUnit = await prisma.courseUnit.update({
      where: { id: toFiniteNumber(id, 0) },
      data: {
        semester: semester === undefined ? undefined : toFiniteNumber(semester, 0),
        year: year === undefined ? undefined : toFiniteNumber(year, 0),
        elective: elective === undefined ? undefined : Boolean(elective),
        pathwayId: pathwayId === undefined ? undefined : toFiniteNumber(pathwayId, 0),
        color: color || null,
        position: position === undefined ? undefined : position,
      },
    });

    return res.status(200).json(updatedCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const saveTagMappings = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { unitMappings } = req.body as { unitMappings?: Record<string, { tags?: Array<{ tagId?: number | string }> }> };

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const desiredTagPairs: Array<{ unitId: string; tagId: number }> = [];
    const unitIds: string[] = [];

    if (unitMappings && typeof unitMappings === "object") {
      for (const [unitId, mapping] of Object.entries(unitMappings)) {
        unitIds.push(unitId);
        const tags = Array.isArray(mapping?.tags) ? mapping.tags : [];
        const seen = new Set<number>();
        for (const tag of tags) {
          const tagId = typeof tag?.tagId === "number" ? tag.tagId : Number(tag?.tagId);
          if (!Number.isFinite(tagId) || seen.has(tagId)) continue;
          seen.add(tagId);
          desiredTagPairs.push({ unitId, tagId });
        }
      }
    }

    await prisma.$transaction(async (tx: typeof prisma) => {
      if (unitIds.length > 0) {
        await tx.courseUnitTags.deleteMany({
          where: { courseId, unitId: { in: unitIds } },
        });

        if (desiredTagPairs.length > 0) {
          const referencedTagIds = Array.from(new Set(desiredTagPairs.map((p) => p.tagId)));
          const existingTags = await tx.tag.findMany({
            where: { courseId, tagId: { in: referencedTagIds } },
            select: { tagId: true },
          });
          const validTagIds = new Set(existingTags.map((t: { tagId: number }) => t.tagId));
          const validPairs = desiredTagPairs.filter((p) => validTagIds.has(p.tagId));

          if (validPairs.length > 0) {
            await tx.courseUnitTags.createMany({
              data: validPairs.map(({ unitId, tagId }) => ({ courseId, unitId, tagId })),
              skipDuplicates: true,
            });
          }
        }
      }
    });

    return res.status(200).json({ message: "Tag mappings saved" });
  } catch (error) {
    return sendServerError(res, error);
  }
};
