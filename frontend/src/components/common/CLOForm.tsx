import React, { useEffect, useState } from "react";
import type { CourseLearningOutcome } from "../../pages/CourseEdit";

interface CLOFormProps {
  onSave: (c: CourseLearningOutcome) => void;
  initialData?: Partial<CourseLearningOutcome>;
  courseId?: string;
}

const CLOForm = ({ onSave, initialData, courseId }: CLOFormProps) => {
  const [cloData, setCLOData] = useState<CourseLearningOutcome>({
    courseId: courseId,
    cloDesc: "",
    cloId: initialData?.cloId,
  });

  useEffect(() => {
    setCLOData({
      cloId: initialData?.cloId || null,
      cloDesc: initialData?.cloDesc || "",
      courseId: courseId || initialData?.courseId || "",
    });
  }, [initialData, courseId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCLOData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Learning Outcome Description
          </label>
          <input
            type="text"
            name="cloDesc"
            value={cloData.cloDesc}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          onClick={() => onSave(cloData)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save CLO
        </button>
      </div>
    </div>
  );
};

export default CLOForm;
