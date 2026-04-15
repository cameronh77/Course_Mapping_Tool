import React, { useState } from "react";

const ACTIVITY_TYPES = [
  "Lecture",
  "Tutorial",
  "Lab",
  "Workshop",
  "Seminar",
  "Field Work",
  "Online Module",
  "Other",
];

interface TeachingActivityFormProps {
  onSave: (data: { name: string; description: string; type: string }) => void;
  onCancel?: () => void;
  initialData?: { name?: string; description?: string; type?: string };
}

const TeachingActivityForm: React.FC<TeachingActivityFormProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || ACTIVITY_TYPES[0],
  });

  const inputClass = "w-full border p-2 rounded text-gray-800 placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Activity Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Enter activity name"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Activity Type</label>
        <select
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          className={inputClass}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Enter description"
          className={inputClass}
          rows={3}
        />
      </div>

      <div className="flex justify-center gap-4 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-lg"
        >
          Save Activity
        </button>
      </div>
    </form>
  );
};

export default TeachingActivityForm;
