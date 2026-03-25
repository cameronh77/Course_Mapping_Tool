import prisma from "../../../database/prismaClient.js";

export const addAssessment = async (req, res) => {
  const { assessmentId, assessmentDesc, assessmentType, unitId } = req.body;
  try {
    if (!assessmentDesc || !assessmentType || !unitId) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const newAssessment = await prisma.assessment.create({
      data: {
        assessmentDesc: assessmentDesc,
        assessmentType: assessmentType,
        unitId: unitId,
      },
    });
    return res.status(201).json(newAssessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const deletedAssessment = await prisma.assessment.delete({
      where: {
        assessmentId: assessmentId, // Replace 1 with the ID of the user you want to delete
      },
    });
    console.log("deleted assessment", deletedAssessment);
    res.status(200).json(deletedAssessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAssessment = async (req, res) => {
  const { assessmentId } = req.params;
  const { assessmentDesc, assessmentType } = req.body;

  try {
    const updatedAssessment = await prisma.assessment.update({
      where: {
        assessmentId: assessmentId,
      },
      data: {
        assessmentDesc: assessmentDesc,
        assessmentType: assessmentType,
      },
    });

    return res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessments = async (req, res) => {
  try {
    const searchTerm = req.query.search as string;

    if (searchTerm) {
      const assessments = await prisma.assessment.findMany({
        where: {
          assessmentID: parseInt(req.body),
        },
      });
      return res.status(200).json(assessments);
    } else {
      // If no search term is provided, return all units
      const assessments = await prisma.unit.findMany({});
      return res.status(200).json(assessments);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
