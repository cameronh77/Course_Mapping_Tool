import React, { useState } from "react";
import type { Assessment, AssessmentType } from "../../types";

const ASSESSMENT_TYPES: AssessmentType[] = [
  "Artefact",
  "Demonstration",
  "Examination",
  "Exercise",
  "Performance",
  "Portfolio",
  "Presentation",
  "Project",
  "Quiz / Test",
  "Work integrated",
  "Written",
];

interface AssessmentFormProps {
  onSave: (data: Assessment) => void;
  onView?: () => void;
  initialData?: Partial<Assessment>;
}

interface AssessmentFormData {
  description: string;
  unitId: string;
  type: AssessmentType;
  name: string;
  value: number;
  hurdleReq: number;
  dueWeek: number[];
  conditions: string;
  feedbackWeek: number[];
  feedbackDetails: string[];
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onSave,
  initialData,
  onView,
}) => {
  const [form, setForm] = useState<AssessmentFormData>({
    name: initialData?.name || "",
    value: initialData?.value || 0,
    hurdleReq: initialData?.hurdleReq ?? 0,
    dueWeek: initialData?.dueWeek || [],
    conditions: initialData?.conditions || "",
    feedbackWeek: initialData?.feedbackWeek || [],
    feedbackDetails: initialData?.feedbackDetails || [],
    description: initialData?.description || "",
    type: initialData?.type ?? null,
    unitId: initialData?.unitId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? null : Number(value),
    }));
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "number" | "string"
  ) => {
    const { name, value } = e.target;

    const parsed =
      type === "number"
        ? value
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((v) => !isNaN(v))
        : value.split(",").map((v) => v.trim());

    setForm((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const inputClass =
    "w-full border p-2 rounded text-gray-800 placeholder-gray-500";

  const labelClass = "block text-sm font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Assessment Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter name"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Assessment Type</label>
          <select
            name="type"
            value={form.type ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                type: e.target.value === "" ? null : (e.target.value as AssessmentType),
              }))
            }
            className={inputClass}
          >
            <option value="">Select type...</option>
            {ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t ?? ""}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Value (%)</label>
          <input
            type="number"
            name="value"
            value={form.value}
            onChange={handleNumberChange}
            placeholder="Enter value"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Hurdle Requirement</label>
          <input
            type="number"
            name="hurdleReq"
            value={form.hurdleReq ?? ""}
            onChange={handleNumberChange}
            placeholder="Optional"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Due Weeks</label>
          <input
            name="dueWeek"
            onChange={(e) => handleArrayChange(e, "number")}
            placeholder="e.g. 3,5,7"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Feedback Weeks</label>
          <input
            name="feedbackWeek"
            onChange={(e) => handleArrayChange(e, "number")}
            placeholder="e.g. 4,6"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Feedback Details</label>
          <input
            name="feedbackDetails"
            onChange={(e) => handleArrayChange(e, "string")}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Assessment Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter description"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Assessment Conditions</label>
          <textarea
            name="conditions"
            value={form.conditions}
            onChange={handleChange}
            placeholder="Enter conditions"
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-6">
        <button
          type="submit"
          className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-lg"
        >
          Save Assessment
        </button>
      </div>
    </form>
  );
};

export default AssessmentForm;
