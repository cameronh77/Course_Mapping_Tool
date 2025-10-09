import prisma from "../../../database/prismaClient.js";

export const addUnitLearningOutcome = async (req, res) => {
  const { uloDesc, unitId, cloId } = req.body;

  try {
    if (!uloDesc || !unitId) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const newUnitLearningOutcome = await prisma.unitLearningOutcome.create({
      data: {
        uloDesc,
        unitId,
        cloId: cloId ? parseInt(cloId) : null,
      },
    });

    return res.status(201).json(newUnitLearningOutcome);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUnitLearningOutcome = async (req, res) => {
  const { uloId } = req.body;
  try {
    const deletedUnitLearningOutcome = await prisma.unitLearningOutcome.delete({
      where: {
        uloId: parseInt(uloId),
      },
    });
    console.log("deleted unitLearningOutcome", deletedUnitLearningOutcome);
    res.status(200).json(deletedUnitLearningOutcome);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewUnitLearningOutcomes = async (req, res) => {
  try {
    const unitLearningOutcomes = await prisma.unitLearningOutcome.findMany({});
    res.status(200).json(unitLearningOutcomes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUnitLearningOutcome = async (req, res) => {
    const { uloId } = req.params;
    const { uloDesc, unitId, cloId } = req.body;

    try {
        const updatedUnitLearningOutcome = await prisma.unitLearningOutcome.update({
            where: {
                uloId: parseInt(uloId),
            },
            data: {
                uloDesc,
                unitId,
                cloId: cloId ? parseInt(cloId) : null,
            }
        });

        return res.status(200).json(updatedUnitLearningOutcome);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}