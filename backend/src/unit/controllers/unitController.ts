import prisma from "../../../database/prismaClient.js";

export const addUnit = async (req, res) => {
  const { unitId, unitName, unitDesc, credits, semestersOffered } = req.body;

  try {
    if (
      !unitId ||
      !unitName ||
      !unitDesc ||
      !credits ||
      !semestersOffered
    ) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const existingUnit = await prisma.unit.findUnique({
      where: {
        unitId: unitId,
      },
    });

    if (existingUnit) {
      return res
        .status(400)
        .json({ message: "Unit with this ID already exists" });
    }

    const newUnit = await prisma.unit.create({
      data: {
        unitId,
        unitName,
        unitDesc,
        credits: parseInt(credits),
        semestersOffered: semestersOffered, // Assuming this is already an array of integers
      },
    });

    return res.status(201).json(newUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const { unitId } = req.body;
    const deletedUnit = await prisma.unit.delete({
      where: {
        unitId: unitId,
      },
    });

    console.log("deleted unit", deletedUnit);
    res.status(200).json(deletedUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUnit = async (req, res) => {
  const { unitId } = req.params;
  const { unitName, unitDesc, credits, semestersOffered } = req.body;

  try {
    if (!unitName || !unitDesc || !credits || !semestersOffered) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const updatedUnit = await prisma.unit.update({
      where: {
        unitId: unitId,
      },
      data: {
        unitName,
        unitDesc,
        credits: parseInt(credits),
        semestersOffered: semestersOffered,
      },
    });

    return res.status(200).json(updatedUnit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewUnits = async (req, res) => {
  try {
    const units = await prisma.unit.findMany({});
    res.status(200).json(units);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};