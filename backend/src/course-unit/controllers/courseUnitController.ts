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
  const { units } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // First, clear existing units for this course to handle deletions
      await tx.courseUnit.deleteMany({
        where: { courseId: courseId },
      });

      if (units && units.length > 0) {
        // Then, create or update units with their new positions
        const courseUnitsData = units.map((unit) => ({
          courseId: courseId,
          unitId: unit.unitId,
          semester: 0, // Default/placeholder value
          year: 0, // Default/placeholder value
          elective: false, // Default/placeholder value
          position: { x: unit.x, y: unit.y },
          color: unit.color || null,
        }));

        await tx.courseUnit.createMany({
          data: courseUnitsData,
          skipDuplicates: true, // This will prevent errors if a record already exists
        });
      }
    });

    return res.status(200).json({ message: "Canvas state saved successfully" });
  } catch (error) {
    console.error("Error saving canvas state:", error);
    return res.status(500).json({ message: "Server error" });
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