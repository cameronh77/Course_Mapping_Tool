import prisma from "../../database/prismaClient.js";

export const addCourse = async (req, res) => {
  const { id, description, expectedDuration, teachingPeriods } = req.body;
  try {
    if (!id || !description || !expectedDuration || !teachingPeriods) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const newCourse = prisma.course.create({
      data: {
        id,
        description,
        expectedDuration,
        teachingPeriods,
      },
    });

    return res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
