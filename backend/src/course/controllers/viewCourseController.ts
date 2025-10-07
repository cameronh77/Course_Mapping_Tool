import prisma from "../../../database/prismaClient.js";

export const viewCourses = async (req, res) => {
  try {
    console.log("hey");
    const courses = await prisma.course.findMany({});
    console.log(courses);
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
