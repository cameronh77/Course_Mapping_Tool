import prisma from "../../../database/prismaClient.js";

export const addCourseUnit = async (req, res) => {
  const { courseId, unitId, semester, year, elective, specialisationSId, color } =
    req.body;

  try {
    if (!courseId || !unitId || !semester || !year || elective === undefined) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const existingCourseUnit = await prisma.courseUnit.findUnique({
      where: {
        courseId_unitId: {
          courseId: courseId,
          unitId: unitId,
        },
      },
    });

    if (existingCourseUnit) {
      return res
        .status(400)
        .json({ message: "CourseUnit already exists" });
    }

    const newCourseUnit = await prisma.courseUnit.create({
      data: {
        courseId,
        unitId,
        semester: parseInt(semester),
        year: parseInt(year),
        elective,
        specialisationSId: specialisationSId ? parseInt(specialisationSId) : null,
        color: color || null,
      },
    });

    return res.status(201).json(newCourseUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCourseUnit = async (req, res) => {
  const { courseId, unitId } = req.body;
  try {
    const deletedCourseUnit = await prisma.courseUnit.delete({
      where: {
        courseId_unitId: {
          courseId: courseId,
          unitId: unitId,
        },
      },
    });
    console.log("deleted courseUnit", deletedCourseUnit);
    res.status(200).json(deletedCourseUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const saveCanvasState = async (req, res) => {
  const { courseId } = req.params;
  const { units, unitMappings } = req.body;

  try {
    // Build all insert data upfront before entering the transaction
    const courseUnitsData = (units ?? []).map((unit) => ({
      courseId,
      unitId: unit.unitId,
      semester: 0,
      year: 0,
      elective: false,
      position: { x: unit.x, y: unit.y },
      color: unit.color || null,
    }));

    const allUnitIds: string[] = Object.keys(unitMappings ?? {});

    const allCloData: { uloDesc: string; unitId: string; cloId: number }[] = [];
    const allTagData: { courseId: string; unitId: string; tagId: number }[] = [];

    for (const [unitId, mappings] of Object.entries(unitMappings ?? {})) {
      const m = mappings as any;
      for (const clo of m.clos ?? []) {
        allCloData.push({ uloDesc: `CLO: ${clo.cloDesc}`, unitId, cloId: parseInt(clo.cloId) });
      }
      for (const tag of m.tags ?? []) {
        allTagData.push({ courseId, unitId, tagId: parseInt(tag.tagId) });
      }
    }

    // Single transaction with bulk operations — O(6) round-trips regardless of unit count
    await prisma.$transaction(async (tx) => {
      await tx.courseUnit.deleteMany({ where: { courseId } });

      if (courseUnitsData.length > 0) {
        await tx.courseUnit.createMany({ data: courseUnitsData, skipDuplicates: true });
      }

      if (allUnitIds.length > 0) {
        await tx.unitLearningOutcome.deleteMany({ where: { unitId: { in: allUnitIds } } });
        await tx.courseUnitTags.deleteMany({ where: { courseId, unitId: { in: allUnitIds } } });
      }

      if (allCloData.length > 0) {
        await tx.unitLearningOutcome.createMany({ data: allCloData, skipDuplicates: true });
      }

      if (allTagData.length > 0) {
        await tx.courseUnitTags.createMany({ data: allTagData, skipDuplicates: true });
      }
    });

    return res.status(200).json({ message: "Canvas state saved successfully" });
  } catch (error) {
    console.error("Error saving canvas state:", error);
    return res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : "Unknown error" });
  }
};

export const viewCourseUnits = async (req, res) => {
  const { courseId } = req.query;
  try {
    const courseUnits = await prisma.courseUnit.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        unit: true, // Include the full Unit object
      },
    });
    res.status(200).json(courseUnits);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCourseUnit = async (req, res) => {
  const { courseId, unitId } = req.params;
  const { semester, year, elective, specialisationSId, color } = req.body;

  try {
    const updatedCourseUnit = await prisma.courseUnit.update({
      where: {
        courseId_unitId: {
          courseId: courseId,
          unitId: unitId,
        },
      },
      data: {
        semester: parseInt(semester),
        year: parseInt(year),
        elective,
        specialisationSId: specialisationSId ? parseInt(specialisationSId) : null,
        color: color || null,
      },
    });

    return res.status(200).json(updatedCourseUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};