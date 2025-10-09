import prisma from "../../../database/prismaClient.js";

export const addCourseLearningOutcome = async (req, res) => {
  const { cloDesc, courseId } = req.body;

  try {
    if (!cloDesc || !courseId) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const newCourseLearningOutcome = await prisma.courseLearningOutcome.create({
      data: {
        cloDesc,
        courseId,
      },
    });

    return res.status(201).json(newCourseLearningOutcome);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCourseLearningOutcome = async (req, res) => {
  const { cloId } = req.body;
  try {
    const deletedCourseLearningOutcome = await prisma.courseLearningOutcome.delete({
      where: {
        cloId: parseInt(cloId),
      },
    });
    console.log("deleted courseLearningOutcome", deletedCourseLearningOutcome);
    res.status(200).json(deletedCourseLearningOutcome);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewCourseLearningOutcomes = async (req, res) => {
  try {
    const courseLearningOutcomes = await prisma.courseLearningOutcome.findMany({});
    res.status(200).json(courseLearningOutcomes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCourseLearningOutcome = async (req, res) => {
    const { cloId } = req.params;
    const { cloDesc, courseId } = req.body;

    try {
        const updatedCourseLearningOutcome = await prisma.courseLearningOutcome.update({
            where: {
                cloId: parseInt(cloId),
            },
            data: {
                cloDesc,
                courseId
            }
        });

        return res.status(200).json(updatedCourseLearningOutcome);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}