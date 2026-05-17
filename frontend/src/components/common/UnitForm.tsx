import React, { useState } from "react";
import { useUnitStore } from "../../stores/useUnitStore";
import { FieldTooltip } from "./FieldTooltip";

interface UnitFormProps {
  onSave: (data: UnitFormData) => void;
  onView?: () => void;
  initialData?: Partial<UnitFormData>;
}

export interface UnitFormData {
  unitId: string | null;
  unitName: string | null;
  unitDesc: string | null;
  credits: number | null;
  semestersOffered: number[] | null;
  color?: string | null;
}

const UnitForm: React.FC<UnitFormProps> = ({ onSave, initialData, onView }) => {
  const [form, setForm] = useState<UnitFormData>({
    unitId: initialData?.unitId || null,
    unitName: initialData?.unitName || null,
    unitDesc: initialData?.unitDesc || null,
    credits: initialData?.credits ?? null,
    semestersOffered: initialData?.semestersOffered || null,
    color: initialData?.color || "#3B82F6", // Default blue
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "credits" ? Number(value) : value,
    }));
  };

  const handleSemestersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert comma-separated string to array of numbers
    const semestersArray = value
      ? value
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n))
      : null;

    setForm((prev) => ({
      ...prev,
      semestersOffered: semestersArray,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit ID
            <FieldTooltip text="The unique code identifying this unit (e.g. FIT3170). Used across the system to reference and link this unit." />
          </label>
          <input
            type="text"
            name="unitId"
            value={form.unitId || ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
            placeholder="e.g., ATS3006, FIT3170"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit Name
            <FieldTooltip text="The full display name of the unit shown on the canvas and in reports (e.g. Introduction to Computer Science)." />
          </label>
          <input
            type="text"
            name="unitName"
            value={form.unitName || ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
            placeholder="e.g., Introduction to Computer Science"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit Description
            <FieldTooltip text="A brief overview of what this unit covers. Displayed in unit detail panels and exported reports." />
          </label>
          <textarea
            name="unitDesc"
            value={form.unitDesc || ""}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical text-gray-900"
            placeholder="Describe what this unit covers..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credits
            <FieldTooltip text="The credit point value of this unit. A standard unit is typically 6 credits. Used to calculate total course load." />
          </label>
          <input
            type="number"
            name="credits"
            value={form.credits ?? ""}
            onChange={handleChange}
            min={0}
            max={20}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
            placeholder="e.g. 6"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semesters Offered
            <span className="text-gray-500 text-xs ml-2">(comma-separated)</span>
            <FieldTooltip text="Which teaching periods this unit runs in (e.g. 1, 2). Used to validate semester placement on the canvas timeline." />
          </label>
          <input
            type="text"
            name="semestersOffered"
            value={form.semestersOffered?.join(", ") || ""}
            onChange={handleSemestersChange}
            placeholder="e.g. 1, 2"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter semester numbers separated by commas (e.g. 1, 2)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit Color
            <FieldTooltip text="The colour used to display this unit on the canvas. Helps visually distinguish units from one another. Enter a hex code or use the colour picker." />
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              name="color"
              value={form.color || "#3B82F6"}
              onChange={handleChange}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <div className="flex-1">
              <input
                type="text"
                name="color"
                value={form.color || "#3B82F6"}
                onChange={handleChange}
                placeholder="#3B82F6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
              />
            </div>
            <div
              className="w-10 h-10 rounded border border-gray-300"
              style={{ backgroundColor: form.color || "#3B82F6" }}
              title="Color preview"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Choose a color for this unit or enter a hex code
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onView?.();
          }}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          View Unit
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save Unit
        </button>
      </div>
    </form>
  );
};

export default UnitForm;
