import prisma from "../../../database/prismaClient.js";

export const addAssessmentRelationship = async (req: any, res: any) => {
  const { assessmentId, relatedId, unitId } = req.body;
  try {
    const existing = await prisma.assessmentRelationship.findUnique({
      where: { assessmentId_relatedId: { assessmentId: parseInt(assessmentId), relatedId: parseInt(relatedId) } },
    });
    if (existing) return res.status(409).json({ message: "Link already exists" });

    const newRelationship = await prisma.assessmentRelationship.create({
      data: {
        assessmentId: parseInt(assessmentId),
        relatedId: parseInt(relatedId),
        unitId,
      },
    });
    return res.status(201).json(newRelationship);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssessmentRelationship = async (req: any, res: any) => {
  const { assessmentId, relatedId } = req.body;
  try {
    await prisma.assessmentRelationship.delete({
      where: {
        assessmentId_relatedId: {
          assessmentId: parseInt(assessmentId),
          relatedId: parseInt(relatedId),
        },
      },
    });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessmentRelationshipsByUnit = async (req: any, res: any) => {
  const { unitId } = req.query;
  try {
    const relationships = await prisma.assessmentRelationship.findMany({
      where: { unitId: unitId as string },
    });
    return res.status(200).json(relationships);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
