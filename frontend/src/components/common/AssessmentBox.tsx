import React, { useState } from "react";
import type { Assessment } from "../../types";

type UnitOption = {
  unitId: string;
  label: string;
};

type AssessmentUpdatePayload = {
  aDesc: string;
  unitId: string;
};

interface AssessmentBoxProps {
  assessment: Assessment;
  x: number;
  y: number;
  width: number;
  isDragging: boolean;
  isSelected: boolean;
  color: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  availableUnits: UnitOption[];
  onDelete?: () => void;
  onUpdate?: (updated: AssessmentUpdatePayload) => void;
}

export const AssessmentBox: React.FC<AssessmentBoxProps> = ({
  assessment,
  x,
  y,
  width,
  isDragging,
  isSelected,
  color,
  onMouseDown,
  onClick,
  availableUnits,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(assessment.aDesc || "");
  const [selectedUnitId, setSelectedUnitId] = useState(assessment.unitId || "");
  const [unitSearch, setUnitSearch] = useState(() => {
    const selected = availableUnits.find((u) => u.unitId === (assessment.unitId || ""));
    return selected?.label || assessment.unitId || "";
  });

  const filteredUnits = availableUnits.filter((unit) =>
    unit.label.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate?.({
        aDesc: editText,
        unitId: selectedUnitId,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(assessment.aDesc || "");
    setSelectedUnitId(assessment.unitId || "");
    const selected = availableUnits.find((u) => u.unitId === (assessment.unitId || ""));
    setUnitSearch(selected?.label || assessment.unitId || "");
    setIsEditing(false);
  };

  const boxWidth = width;
  const boxHeight = 72;

  return (
    <div
      className={`absolute border shadow transition-shadow flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing ${
        isDragging ? "z-50 shadow-2xl" : isSelected ? "z-40 hover:shadow-lg" : "z-20 hover:shadow-lg"
      } ${isSelected ? "ring-2 ring-blue-300" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${boxWidth}px`,
        height: `${boxHeight}px`,
        backgroundColor: color,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={assessment.aDesc || "Assessment"}
    >
      <span className="px-1 text-center text-[11px] leading-tight line-clamp-3 break-words select-none">
        {assessment.aDesc || "Assessment"}
      </span>

      {isSelected && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[220px] max-w-[320px] p-2 rounded border border-gray-200 bg-white text-gray-700 text-xs leading-relaxed shadow-xl z-[60]">
          {isEditing ? (
            <>
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-1 mb-2 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Linked Unit</label>
                <input
                  type="text"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  placeholder="Search saved course units..."
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="mt-1 max-h-24 overflow-y-auto rounded border border-gray-300 p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`mb-1 w-full rounded px-1 py-1 text-left text-[11px] ${
                      selectedUnitId === "" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedUnitId("");
                      setUnitSearch("");
                    }}
                  >
                    None
                  </button>
                  {filteredUnits.map((unit) => (
                    <button
                      key={unit.unitId}
                      type="button"
                      className={`mb-1 w-full rounded px-1 py-1 text-left text-[11px] ${
                        selectedUnitId === unit.unitId ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedUnitId(unit.unitId);
                        setUnitSearch(unit.label);
                      }}
                    >
                      {unit.label}
                    </button>
                  ))}
                  {!filteredUnits.length && <div className="text-[11px] text-gray-400">No matching units</div>}
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  type="button"
                  className="flex-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="flex-1 rounded bg-gray-400 px-2 py-1 text-[11px] font-semibold text-white hover:bg-gray-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-2">{assessment.aDesc || "Assessment"}</div>
              <div className="mb-2 text-[11px] text-gray-500">Unit: {assessment.unitId || "None"}</div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="flex-1 rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className="flex-1 rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
