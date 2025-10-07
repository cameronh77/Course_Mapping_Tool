import prisma from "../../../database/prismaClient.js";

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const deletedCourse = await prisma.course.delete({
      where: {
        courseId: courseId, // Replace 1 with the ID of the user you want to delete
      },
    });
    console.log("deleted course", deletedCourse);
    res.status(200).json(deletedCourse);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
