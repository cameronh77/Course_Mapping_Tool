import prisma from "../../../database/prismaClient.js";

export const addTeachingActivity = async (req, res) => {
  const { name, description, type, unitId, position } = req.body;

  try {
    const newActivity = await prisma.teachingActivity.create({
      data: {
        activityName: name,
        activityDesc: description || "",
        activityType: type,
        unitId,
        position: position || null,
      },
    });
    return res.status(201).json(newActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTeachingActivity = async (req, res) => {
  const { activityId } = req.body;

  try {
    await prisma.teachingActivityAssessment.deleteMany({ where: { activityId } });
    await prisma.teachingActivityULO.deleteMany({ where: { activityId } });

    const deletedActivity = await prisma.teachingActivity.delete({
      where: { activityId },
    });

    console.log("deleted teaching activity", deletedActivity);
    return res.status(200).json(deletedActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateTeachingActivity = async (req, res) => {
  const { activityId } = req.params;
  const { name, description, type, unitId, position } = req.body;

  try {
    const trueId = Number(activityId);
    const updatedActivity = await prisma.teachingActivity.update({
      where: { activityId: trueId },
      data: {
        activityName: name,
        activityDesc: description,
        activityType: type,
        unitId,
        position: position || null,
      },
    });
    console.log("updated teaching activity", updatedActivity);
    return res.status(200).json(updatedActivity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTeachingActivitiesByUnit = async (req, res) => {
  const { unitId } = req.params;

  try {
    const activities = await prisma.teachingActivity.findMany({
      where: { unitId },
    });
    return res.status(200).json(activities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
