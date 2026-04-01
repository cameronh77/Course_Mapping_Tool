import prisma from "../../../database/prismaClient.js";

export const addAssessmentRelationship = async (req, res) => {
  const { assessmentId, relatedId } = req.body;
  try {
    const newAssessmentRelationship =
      await prisma.assessmentRelationship.create({
        data: {
          assessmentId: assessmentId,
          relatedId: relatedId,
        },
      });
    return res.status(201).json(newAssessmentRelationship);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAllAssessmentRelationships = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const deletedAssessmentRelationships =
      await prisma.assessmentRelationship.deleteMany({
        where: {
          assessmentId: assessmentId,
        },
      });
    console.log("deleted assessments", deletedAssessmentRelationships);
    res.status(200).json(deletedAssessmentRelationships);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssessmentRelationship = async (req, res) => {
  try {
    const { assessmentId, relatedId } = req.body;
    const deletedAssessmentRelationship =
      await prisma.assessmentRelationship.delete({
        where: {
          assessmentId: assessmentId, // Replace 1 with the ID of the user you want to delete
          relatedId: relatedId,
        },
      });
    console.log("deleted assessment", deletedAssessmentRelationship);
    res.status(200).json(deletedAssessmentRelationship);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAssessmentRelationship = async (req, res) => {
  const { assessmentId } = req.params;
  const { relatedId } = req.body;

  try {
    const updatedAssessment = await prisma.assessmentRelationship.update({
      where: {
        assessmentId: assessmentId,
      },
      data: {
        relatedId: relatedId,
      },
    });
    console.log("This is the updated assessment", updatedAssessment);
    return res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessmentRelationships = async (req, res) => {
  try {
    const searchTerm = req.query.search as string;
    if (searchTerm) {
      const assessmentRelationship =
        await prisma.assessmentRelationship.findMany({
          where: {
            assessmentId: searchTerm,
          },
        });
      return res.status(200).json(assessmentRelationship);
    } else {
      // If no search term is provided, return all assessments
      const assessments = await prisma.assessment.findMany({});
      return res.status(200).json(assessments);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
