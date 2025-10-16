import prisma from "../../../database/prismaClient.js";

export const addTag = async (req, res) => {
  const { tagName, courseId } = req.body;
  try {
    if (!tagName || !courseId) {
      return res.status(400).json({ message: "All fields must be filled in" });
    }

    const newTag = await prisma.tag.create({
      data: {
        tagName: tagName,
        courseId: courseId,
      },
    });
    return res.status(201).json(newTag);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const addUnitsToTag = async (req, res) => {
  try {
    const dataArray = req.body;

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return res
        .status(400)
        .json({ message: "Request body must be a non-empty array" });
    }
    console.log(dataArray);
    const result = await prisma.courseUnitTags.createMany({
      data: dataArray,
      skipDuplicates: true,
    });

    return res.status(201).json({ result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTagsByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const tags = await prisma.tag.findMany({
      where: {
        courseId: courseId,
      },
    });
    res.status(200).json(tags);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewTagsByUnit = async (req, res) => {
  const { unitId, courseId } = req.body;

  try {
    const validTags = await prisma.tag.findMany({
      where: {
        courseId: courseId,
        unitId: unitId,
      },
    });

    const tagIds = validTags.map((ut) => ut.tagId);

    const tags = await prisma.tag.findMany({
      where: {
        tagId: { in: tagIds },
      },
    });
    res.status(200).json(tags);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const deletedTag = await prisma.tag.delete({
      where: {
        tagId: tagId, // Replace 1 with the ID of the user you want to delete
      },
    });

    console.log("deleted tag", deletedTag);
    res.status(200).json(deletedTag);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteUnitFromTag = async (req, res) => {
  try {
    const { tagId, unitId } = req.params;
    const deletedTag = await prisma.courseUnitTag.delete({
      where: {
        tagId: tagId,
        unitId: unitId,
      },
    });

    console.log("deleted association", deletedTag);
    res.status(200).json(deletedTag);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
