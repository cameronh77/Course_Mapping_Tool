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
    const unitsPayload = Array.isArray(units) ? units : [];
    const mappedUnitIds = new Set(
      unitsPayload
        .map((unit: any) => unit?.unitId)
        .filter((unitId: unknown): unitId is string => typeof unitId === "string" && unitId.length > 0)
    );

    await prisma.$transaction(async (tx) => {
      // First, clear existing units for this course to handle deletions
      await tx.courseUnit.deleteMany({
        where: { courseId: courseId },
      });

      if (unitsPayload.length > 0) {
        // Then, create or update units with their new positions
        const courseUnitsData = unitsPayload.map((unit: any) => ({
          courseId: courseId,
          unitId: unit.unitId,
          semester: unit.semester || 0,
          year: unit.year || 0,
          elective: false,
          position: { x: unit.x, y: unit.y },
          color: unit.color || null,
        }));

        await tx.courseUnit.createMany({
          data: courseUnitsData,
          skipDuplicates: true,
        });
      }

      // Save CLO mappings (UnitLearningOutcomes)
      if (unitMappings) {
        for (const [unitId, mappings] of Object.entries(unitMappings)) {
          if (!mappedUnitIds.has(unitId)) continue;
          const mappingsData = mappings as any;

          const existingUlos = await tx.unitLearningOutcome.findMany({
            where: { unitId: unitId },
            select: { uloId: true },
          });

          const existingUloIds = existingUlos.map((ulo) => ulo.uloId);
          if (existingUloIds.length > 0) {
            await tx.assessmentULO.deleteMany({
              where: {
                uloId: { in: existingUloIds },
              },
            });
          }
          
          // Clear existing CLO mappings for this unit
          await tx.unitLearningOutcome.deleteMany({
            where: { unitId: unitId },
          });

          // Create new CLO mappings
          if (mappingsData.clos && mappingsData.clos.length > 0) {
            const cloMappingsData = mappingsData.clos.map((clo: any) => ({
              uloDesc: `CLO: ${clo.cloDesc}`,
              unitId: unitId,
              cloId: parseInt(clo.cloId),
            }));

            try {
              await tx.unitLearningOutcome.createMany({
                data: cloMappingsData,
                skipDuplicates: false,
              });
            } catch (cloError) {
              console.error(`Error creating CLO mappings for unit ${unitId}:`, cloError);
              throw cloError;
            }
          }
        }
      }

      // Save Tag mappings (CourseUnitTags)
      if (unitMappings) {
        for (const [unitId, mappings] of Object.entries(unitMappings)) {
          if (!mappedUnitIds.has(unitId)) continue;
          const mappingsData = mappings as any;
          
          // Clear existing tag mappings for this unit in this course
          await tx.courseUnitTags.deleteMany({
            where: {
              courseId: courseId,
              unitId: unitId,
            },
          });

          // Create new tag mappings
          if (mappingsData.tags && mappingsData.tags.length > 0) {
            const tagMappingsData = mappingsData.tags.map((tag: any) => ({
              courseId: courseId,
              unitId: unitId,
              tagId: parseInt(tag.tagId),
            }));

            try {
              await tx.courseUnitTags.createMany({
                data: tagMappingsData,
                skipDuplicates: false,
              });
            } catch (tagError) {
              console.error(`Error creating tag mappings for unit ${unitId}:`, tagError);
              throw tagError;
            }
          }
        }
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
    }, { maxWait: 10000, timeout: 15000 });

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