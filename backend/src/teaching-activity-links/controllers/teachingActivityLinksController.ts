import prisma from "../../../database/prismaClient.js";

// ---- TA-Assessment Links ----

export const addTAAssessmentLink = async (req: any, res: any) => {
  const { activityId, assessmentId, unitId, reversed } = req.body;

  try {
    if (!activityId || !assessmentId || !unitId) {
      return res.status(400).json({ message: "activityId, assessmentId, and unitId are required" });
    }

    const existing = await prisma.teachingActivityAssessment.findUnique({
      where: {
        activityId_assessmentId: {
          activityId: parseInt(activityId),
          assessmentId: parseInt(assessmentId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "This teaching activity-assessment link already exists" });
    }

    const newLink = await prisma.teachingActivityAssessment.create({
      data: {
        activityId: parseInt(activityId),
        assessmentId: parseInt(assessmentId),
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

export const deleteTAAssessmentLink = async (req: any, res: any) => {
  const { activityId, assessmentId } = req.body;

  try {
    const deleted = await prisma.teachingActivityAssessment.delete({
      where: {
        activityId_assessmentId: {
          activityId: parseInt(activityId),
          assessmentId: parseInt(assessmentId),
        },
      },
    });

    return res.status(200).json(deleted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTAAssessmentLinksByUnit = async (req: any, res: any) => {
  const { unitId } = req.query;

  try {
    if (!unitId) {
      return res.status(400).json({ message: "unitId query param is required" });
    }

    const links = await prisma.teachingActivityAssessment.findMany({
      where: { unitId: unitId as string },
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---- TA-ULO Links ----

export const addTAULOLink = async (req: any, res: any) => {
  const { activityId, uloId, unitId, reversed } = req.body;

  try {
    if (!activityId || !uloId || !unitId) {
      return res.status(400).json({ message: "activityId, uloId, and unitId are required" });
    }

    const existing = await prisma.teachingActivityULO.findUnique({
      where: {
        activityId_uloId: {
          activityId: parseInt(activityId),
          uloId: parseInt(uloId),
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "This teaching activity-ULO link already exists" });
    }

    const newLink = await prisma.teachingActivityULO.create({
      data: {
        activityId: parseInt(activityId),
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

export const deleteTAULOLink = async (req: any, res: any) => {
  const { activityId, uloId } = req.body;

  try {
    const deleted = await prisma.teachingActivityULO.delete({
      where: {
        activityId_uloId: {
          activityId: parseInt(activityId),
          uloId: parseInt(uloId),
        },
      },
    });

    return res.status(200).json(deleted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTAULOLinksByUnit = async (req: any, res: any) => {
  const { unitId } = req.query;

  try {
    if (!unitId) {
      return res.status(400).json({ message: "unitId query param is required" });
    }

    const links = await prisma.teachingActivityULO.findMany({
      where: { unitId: unitId as string },
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---- TA-TA Relationships ----

export const addTATALink = async (req: any, res: any) => {
  const { sourceId, targetId, unitId } = req.body;

  try {
    if (!sourceId || !targetId || !unitId) {
      return res.status(400).json({ message: "sourceId, targetId, and unitId are required" });
    }

    const existing = await prisma.teachingActivityRelationship.findFirst({
      where: {
        OR: [
          { sourceId: parseInt(sourceId), targetId: parseInt(targetId) },
          { sourceId: parseInt(targetId), targetId: parseInt(sourceId) },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ message: "This teaching activity link already exists" });
    }

    const newLink = await prisma.teachingActivityRelationship.create({
      data: {
        sourceId: parseInt(sourceId),
        targetId: parseInt(targetId),
        unitId,
      },
    });

    return res.status(201).json(newLink);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTATALink = async (req: any, res: any) => {
  const { sourceId, targetId } = req.body;

  try {
    await prisma.teachingActivityRelationship.delete({
      where: {
        sourceId_targetId: {
          sourceId: parseInt(sourceId),
          targetId: parseInt(targetId),
        },
      },
    });

    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTATALinksByUnit = async (req: any, res: any) => {
  const { unitId } = req.query;

  try {
    if (!unitId) {
      return res.status(400).json({ message: "unitId query param is required" });
    }

    const links = await prisma.teachingActivityRelationship.findMany({
      where: { unitId: unitId as string },
    });

    return res.status(200).json(links);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
