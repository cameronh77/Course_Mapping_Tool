import prisma from "../../database/prismaClient.js";

export const addCourse = async (req, res) => {
  const { courseId, courseDesc, expectedDuration, numberTeachingPeriods } =
    req.body;
  try {
    if (
      !courseId ||
      !courseDesc ||
      !expectedDuration ||
      !numberTeachingPeriods
    ) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    // Check if a course with the given courseId already exists
    const existingCourse = await prisma.course.findUnique({
      where: {
        courseId: parseInt(courseId),
      },
    });

    if (existingCourse) {
      return res
        .status(400)
        .json({ message: "Course with this ID already exists" });
    }

    const newCourse = await prisma.course.create({
      data: {
        courseId: parseInt(courseId),
        courseDesc,
        expectedDuration: parseInt(expectedDuration),
        numberTeachingPeriods: parseInt(numberTeachingPeriods),
      },
    });
    return res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
