import prisma from "../../../database/prismaClient.js";

export const addCourseUnit = async (req, res) => {
  const { courseId, unitId, semester, year, elective, specialisationSId } =
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

export const viewCourseUnits = async (req, res) => {
  try {
    const courseUnits = await prisma.courseUnit.findMany({});
    res.status(200).json(courseUnits);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCourseUnit = async (req, res) => {
  const { courseId, unitId } = req.params;
  const { semester, year, elective, specialisationSId } = req.body;

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
      },
    });

    return res.status(200).json(updatedCourseUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};