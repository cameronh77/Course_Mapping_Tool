import React, { useState } from "react";
import type { BloomsLevel } from "../../types";

interface ULOFormProps {
  onSave: (description: string, bloomsLevel: BloomsLevel | null) => void;
  onCancel?: () => void;
  initialData?: string;
  initialBloomsLevel?: BloomsLevel | null;
}

const BLOOMS_LEVELS: {
  value: BloomsLevel;
  label: string;
  color: string;
  selectedColor: string;
  verbs: string;
}[] = [
  {
    value: "REMEMBER",
    label: "Remember",
    color: "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50",
    selectedColor: "bg-red-100 border-red-400 text-red-800",
    verbs: "define, list, recall, identify",
  },
  {
    value: "UNDERSTAND",
    label: "Understand",
    color: "bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:bg-orange-50",
    selectedColor: "bg-orange-100 border-orange-400 text-orange-800",
    verbs: "explain, summarise, classify, describe",
  },
  {
    value: "APPLY",
    label: "Apply",
    color: "bg-white border-gray-200 text-gray-500 hover:border-yellow-300 hover:bg-yellow-50",
    selectedColor: "bg-yellow-100 border-yellow-400 text-yellow-800",
    verbs: "use, solve, demonstrate, execute",
  },
  {
    value: "ANALYSE",
    label: "Analyse",
    color: "bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50",
    selectedColor: "bg-green-100 border-green-400 text-green-800",
    verbs: "compare, differentiate, examine, break down",
  },
  {
    value: "EVALUATE",
    label: "Evaluate",
    color: "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50",
    selectedColor: "bg-blue-100 border-blue-400 text-blue-800",
    verbs: "justify, critique, assess, argue",
  },
  {
    value: "CREATE",
    label: "Create",
    color: "bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:bg-purple-50",
    selectedColor: "bg-purple-100 border-purple-400 text-purple-800",
    verbs: "design, construct, formulate, produce",
  },
];

const UnitLearningOutcomeForm: React.FC<ULOFormProps> = ({
  onSave,
  onCancel,
  initialData,
  initialBloomsLevel,
}) => {
  const [description, setDescription] = useState(initialData || "");
  const [bloomsLevel, setBloomsLevel] = useState<BloomsLevel | null>(
    initialBloomsLevel ?? null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSave(description, bloomsLevel);
  };

  const inputClass =
    "w-full border p-2 rounded text-gray-800 placeholder-gray-500";

  const labelClass = "block text-sm font-medium text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>
          Bloom&apos;s Taxonomy Level
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BLOOMS_LEVELS.map((level) => {
            const isSelected = bloomsLevel === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setBloomsLevel(isSelected ? null : level.value)
                }
                className={`p-2 rounded-md border-2 text-left transition-all ${
                  isSelected ? level.selectedColor : level.color
                }`}
              >
                <div className="text-xs font-bold">{level.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">
                  {level.verbs}
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
