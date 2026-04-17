import React, { useState } from "react";

interface ULOFormProps {
  onSave: (description: string) => void;
  onCancel?: () => void;
  initialData?: string;
}

const UnitLearningOutcomeForm: React.FC<ULOFormProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  const [description, setDescription] = useState(initialData || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSave(description);
  };

  const inputClass =
    "w-full border p-2 rounded text-gray-800 placeholder-gray-500";

  const labelClass = "block text-sm font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Unit Learning Outcome Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter unit learning outcome..."
          className={inputClass}
          rows={4}
          required
        />
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
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
          className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors text-lg"
        >
          Save ULO
        </button>
      </div>
    </form>
  );
};

export default UnitLearningOutcomeForm;
