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

type SaveCanvasBody = {
  units?: CourseUnitCanvasEntry[];
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
  const { courseId, unitId, semester, year, elective, specialisationSId, color } = req.body;

  try {
    if (!courseId || !unitId) {
      return res.status(400).json({ message: "courseId and unitId are required" });
    }

    if (semester === undefined || year === undefined || elective === undefined) {
      return res.status(400).json({ message: "semester, year, and elective are required" });
    }

    const existingCourseUnit = await prisma.courseUnit.findUnique({
      where: {
        courseId_unitId: {
          courseId,
          unitId,
        },
      },
    });

    if (existingCourseUnit) {
      return res.status(400).json({ message: "CourseUnit already exists" });
    }

    const newCourseUnit = await prisma.courseUnit.create({
      data: {
        courseId,
        unitId,
        semester: toFiniteNumber(semester, 0),
        year: toFiniteNumber(year, 0),
        elective: Boolean(elective),
        specialisationSId:
          specialisationSId === undefined || specialisationSId === null || specialisationSId === ""
            ? null
            : toFiniteNumber(specialisationSId, 0),
        color: color || null,
      },
    });

    return res.status(201).json(newCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const deleteCourseUnit = async (req: Request, res: Response) => {
  const { courseId, unitId } = req.body;

  try {
    if (!courseId || !unitId) {
      return res.status(400).json({ message: "courseId and unitId are required" });
    }

    const deletedCourseUnit = await prisma.courseUnit.delete({
      where: {
        courseId_unitId: {
          courseId,
          unitId,
        },
      },
    });

    return res.status(200).json(deletedCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const saveCanvasState = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { units } = req.body as SaveCanvasBody;

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
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
      semester: toFiniteNumber(unit.semester, 0),
      year: toFiniteNumber(unit.year, 0),
      elective: Boolean(unit.elective),
      position: {
        x: toFiniteNumber(unit.x, 0),
        y: toFiniteNumber(unit.y, 0),
      },
      color: unit.color || null,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.courseUnit.deleteMany({
        where: { courseId },
      });

      if (courseUnitsData.length > 0) {
        await tx.courseUnit.createMany({
          data: courseUnitsData,
          skipDuplicates: false,
        });
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

  try {
    if (!courseId) {
      return res.status(400).json({ message: "courseId query param is required" });
    }

    const courseUnits = await prisma.courseUnit.findMany({
      where: {
        courseId,
      },
      include: {
        unit: true,
      },
      orderBy: [{ courseId: "asc" }, { unitId: "asc" }],
    });

    return res.status(200).json(courseUnits);
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const updateCourseUnit = async (req: Request, res: Response) => {
  const { courseId, unitId } = req.params;
  const { semester, year, elective, specialisationSId, color } = req.body;

  try {
    if (!courseId || !unitId) {
      return res.status(400).json({ message: "courseId and unitId are required" });
    }

    const updatedCourseUnit = await prisma.courseUnit.update({
      where: {
        courseId_unitId: {
          courseId,
          unitId,
        },
      },
      data: {
        semester: semester === undefined ? undefined : toFiniteNumber(semester, 0),
        year: year === undefined ? undefined : toFiniteNumber(year, 0),
        elective: elective === undefined ? undefined : Boolean(elective),
        specialisationSId:
          specialisationSId === undefined || specialisationSId === null || specialisationSId === ""
            ? null
            : toFiniteNumber(specialisationSId, 0),
        color: color || null,
      },
    });

    return res.status(200).json(updatedCourseUnit);
  } catch (error) {
    return sendServerError(res, error);
  }
};
