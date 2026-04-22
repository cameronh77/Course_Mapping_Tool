import prisma from "../../../database/prismaClient.js";

export const createRelationship = async (req, res) => {
  const { unitId, relatedId, relationshipType, courseId, sId, entryType } = req.body;

  try {
    if (!unitId || !relatedId || !relationshipType) {
      return res.status(400).json({ message: "unitId, relatedId, and relationshipType are required" });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.unitRelationship.findFirst({
      where: {
        unitId,
        relatedId,
        courseId: courseId || null,
      },
    });

    if (existingRelationship) {
      return res.status(400).json({ message: "This relationship already exists" });
    }

    const newRelationship = await prisma.unitRelationship.create({
      data: {
        unitId,
        relatedId,
        relationshipType,
        courseId: courseId || null,
        sId: sId || null,
        entryType: entryType || 0,
      },
    });

    return res.status(201).json(newRelationship);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateRelationship = async (req, res) => {
  const { id } = req.params;
  const { relatedId, relationshipType } = req.body;

  try {
    const existing = await prisma.unitRelationship.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "Relationship not found" });
    }

    const nextRelatedId = relatedId ?? existing.relatedId;
    const nextRelType = relationshipType ?? existing.relationshipType;

    if (nextRelatedId === existing.unitId) {
      return res
        .status(400)
        .json({ message: "A unit cannot link to itself" });
    }

    if (nextRelatedId !== existing.relatedId) {
      const clash = await prisma.unitRelationship.findFirst({
        where: {
          unitId: existing.unitId,
          relatedId: nextRelatedId,
          courseId: existing.courseId ?? null,
          NOT: { id: existing.id },
        },
      });
      if (clash) {
        return res
          .status(400)
          .json({ message: "This relationship already exists" });
      }
    }

    const updated = await prisma.unitRelationship.update({
      where: { id: parseInt(id) },
      data: {
        relatedId: nextRelatedId,
        relationshipType: nextRelType,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteRelationship = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRelationship = await prisma.unitRelationship.delete({
      where: {
        id: parseInt(id),
      },
    });

    return res.status(200).json(deletedRelationship);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewRelationshipsByCourse = async (req, res) => {
  const { courseId } = req.query;

  try {
    const relationships = await prisma.unitRelationship.findMany({
      where: {
        courseId: courseId as string,
      },
      include: {
        unit: true,
        related: true,
      },
    });

    return res.status(200).json(relationships);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewAllRelationships = async (req, res) => {
  try {
    const relationships = await prisma.unitRelationship.findMany({
      include: {
        unit: true,
        related: true,
      },
    });

    return res.status(200).json(relationships);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
