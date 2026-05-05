import prisma from "../../../database/prismaClient.js";

const serialize = (cat: any) => ({
  id: cat.id,
  name: cat.name,
  indexLabel: cat.indexLabel,
  position: { x: cat.positionX, y: cat.positionY },
  courseId: cat.courseId,
  tagIds: (cat.tags ?? [])
    .slice()
    .sort((a: any, b: any) => a.order - b.order)
    .map((t: any) => t.tagId),
});

export const listByCourse = async (req: any, res: any) => {
  const { courseId } = req.params;
  try {
    const categories = await prisma.themeCategory.findMany({
      where: { courseId },
      include: { tags: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories.map(serialize));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCategory = async (req: any, res: any) => {
  const { courseId, name, indexLabel, position } = req.body;
  try {
    if (!courseId || !name) {
      return res.status(400).json({ message: "courseId and name are required" });
    }
    const created = await prisma.themeCategory.create({
      data: {
        courseId,
        name,
        indexLabel: indexLabel ?? "",
        positionX: position?.x ?? 0,
        positionY: position?.y ?? 0,
      },
      include: { tags: true },
    });
    res.status(201).json(serialize(created));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: any, res: any) => {
  const { id } = req.params;
  const { name, indexLabel, position, tagIds } = req.body;
  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (indexLabel !== undefined) data.indexLabel = indexLabel;
    if (position?.x !== undefined) data.positionX = position.x;
    if (position?.y !== undefined) data.positionY = position.y;

    await prisma.themeCategory.update({ where: { id: Number(id) }, data });

    if (Array.isArray(tagIds)) {
      await prisma.themeCategoryTag.deleteMany({ where: { categoryId: Number(id) } });
      if (tagIds.length > 0) {
        await prisma.themeCategoryTag.createMany({
          data: tagIds.map((tagId: number, order: number) => ({
            categoryId: Number(id),
            tagId,
            order,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.themeCategory.findUnique({
      where: { id: Number(id) },
      include: { tags: true },
    });
    res.status(200).json(updated ? serialize(updated) : null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await prisma.themeCategory.delete({ where: { id: Number(id) } });
    res.status(200).json({ id: Number(id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
