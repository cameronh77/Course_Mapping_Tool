import prisma from "../../../database/prismaClient.js";

export const updateCourse = async (req, res) => {
    const { courseId } = req.params;
    const { courseDesc, expectedDuration, numberTeachingPeriods } = req.body;

    try {
        if (!courseDesc || !expectedDuration || !numberTeachingPeriods) {
            return res.status(400).json({ message: "All fields must be filled in" });
        }

        const updatedCourse = await prisma.course.update({
            where: {
                courseId: courseId,
            },
            data: {
                courseDesc,
                expectedDuration: parseInt(expectedDuration),
                numberTeachingPeriods: parseInt(numberTeachingPeriods),
            },
        });

        return res.status(200).json(updatedCourse);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};