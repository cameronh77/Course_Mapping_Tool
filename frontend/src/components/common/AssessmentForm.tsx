import React, { useState } from "react";

interface AssessmentFormProps {
  onSave: (data: AssessmentFormData) => void;
  onView?: () => void;
  initialData?: Partial<AssessmentFormData>;
}

export interface AssessmentFormData {
  description: string | null;
  type: "Project" | "Test" | null;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onSave,
  initialData,
  onView,
}) => {
  const [form, setForm] = useState<AssessmentFormData>({
    description: initialData?.description || null,
    type: initialData?.type || null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Type
          </label>
          <select
            name="type"
            value={form.type || ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-gray-900"
          >
            <option value="">Select type</option>
            <option value="Project">Project</option>
            <option value="Test">Test</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Description
          </label>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-vertical text-gray-900"
            placeholder="Describe the assessment..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onView}
          className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          View Assessment
        </button>

        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          Save Assessment
        </button>
      </div>
    </form>
  );
};

export default AssessmentForm;
