import prisma from "../../../database/prismaClient.js";

export const addAssessment = async (req, res) => {
  const {
    assessmentId,
    description,
    type,
    unitId,
    name,
    value,
    hurdleReq,
    dueWeek,
    conditions,
    feedBackWeek,
    feedBackDetails,
    position,
    unit,
  } = req.body;
  try {
    const newAssessment = await prisma.assessment.create({
      data: {
        assessmentName: name,
        assessmentDesc: description,
        assessmentType: type,
        unitId: unitId,
        value: value,
        hurdleReq: hurdleReq,
        dueWeek: dueWeek,
        assessmentConditions: conditions,
        feedBackWeek: feedBackWeek,
        feedBackDetails: feedBackDetails,
        position: position,
        //unit: unit,
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
  const {
    description,
    type,
    unitId,
    name,
    value,
    hurdleReq,
    dueWeek,
    conditions,
    feedBackWeek,
    feedBackDetails,
    position,
  } = req.body;

  try {
    console.log(req.body);
    const trueId = Number(assessmentId);
    const updatedAssessment = await prisma.assessment.update({
      where: {
        assessmentId: trueId,
      },
      data: {
        assessmentName: name,
        assessmentDesc: description,
        assessmentType: type,
        unitId: unitId,
        value: value,
        hurdleReq: hurdleReq,
        dueWeek: dueWeek,
        assessmentConditions: conditions,
        feedBackWeek: feedBackWeek,
        feedBackDetails: feedBackDetails,
        position: position,
      },
    });
    console.log("This is the updated assessment", updatedAssessment);
    return res.status(200).json(updatedAssessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAssessments = async (req, res) => {
  try {
    const searchTerm = req.query.search as string;
    //console.log(req);
    console.log(searchTerm, "<- search term");
    if (searchTerm) {
      const assessments = await prisma.assessment.findMany({
        where: {
          unitId: searchTerm,
        },
      });
      console.log("here", assessments);
      return res.status(200).json(assessments);
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
