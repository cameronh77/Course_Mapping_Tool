import prisma from "../../../database/prismaClient.js";

export const addAssessmentULO = async (req: any, res: any) => {
  const { assessmentId, uloId, unitId, reversed } = req.body;

  try {
    if (!assessmentId || !uloId || !unitId) {
      return res.status(400).json({ message: "assessmentId, uloId, and unitId are required" });
    }

    const existing = await prisma.assessmentULO.findUnique({
      where: {
        assessmentId_uloId_unitId: {
          assessmentId: parseInt(assessmentId),
          uloId: parseInt(uloId),
          unitId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "This assessment-ULO link already exists" });
    }

    const newLink = await prisma.assessmentULO.create({
      data: {
        assessmentId: parseInt(assessmentId),
        uloId: parseInt(uloId),
        unitId,
        reversed: reversed ?? false,
      },
    });

    return res.status(201).json(newLink);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssessmentULO = async (req: any, res: any) => {
  const { assessmentId, uloId, unitId } = req.body;

  try {
    const deleted = await prisma.assessmentULO.delete({
      where: {
        assessmentId_uloId_unitId: {
          assessmentId: parseInt(assessmentId),
          uloId: parseInt(uloId),
          unitId,
        },
      },
    });

    return res.status(200).json(deleted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessmentULOsByUnit = async (req: any, res: any) => {
  const { unitId } = req.query;

  try {
    if (!unitId) {
      return res.status(400).json({ message: "unitId query param is required" });
    }

    const links = await prisma.assessmentULO.findMany({
      where: { unitId: unitId as string },
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
