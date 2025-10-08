import prisma from "../../../database/prismaClient.js";

export const addCourse = async (req, res) => {
  const {
    courseId,
    courseName,
    courseDesc,
    expectedDuration,
    numberTeachingPeriods,
  } = req.body;
  try {
    if (
      !courseId ||
      !courseName ||
      !courseDesc ||
      !expectedDuration ||
      !numberTeachingPeriods
    ) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    // Check if a course with the given courseId already exists
    const existingCourse = await prisma.course.findUnique({
      where: {
        courseId: courseId,
      },
    });

    if (existingCourse) {
      return res
        .status(400)
        .json({ message: "Course with this ID already exists" });
    }

    const newCourse = await prisma.course.create({
      data: {
        courseId: courseId,
        courseName,
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

export const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const { courseDesc, expectedDuration, numberTeachingPeriods } = req.body;

  try {
    if (!courseDesc || !expectedDuration || !numberTeachingPeriods) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const updatedCourse = await prisma.course.update({
      where: {
        courseId: courseId,
      },
      data: {
        courseDesc,
        expectedDuration: parseInt(expectedDuration),
        numberTeachingPeriods: parseInt(numberTeachingPeriods),
      },
    });

    return res.status(200).json(updatedCourse);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

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
