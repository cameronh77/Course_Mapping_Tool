import React, { useState } from "react";
import type { Assessment } from "../../types";

type UnitOption = {
  unitId: string;
  label: string;
};

type ULOOption = {
  uloId: number;
  uloDesc: string;
  unitId: string;
};

type AssessmentUpdatePayload = {
  aDesc: string;
  unitId: string;
  assessmentType: string;
  assessmentConditions: string;
  hurdleReq: number | null;
  unitLosIds: number[];
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
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  availableUnits: UnitOption[];
  availableULOs: ULOOption[];
  onDelete?: () => void;
  onUpdate?: (updated: AssessmentUpdatePayload) => void;
import React from "react";
import type { Assessment } from "../../types";

const BOX_WIDTH = 256;

interface AssessmentBoxProps {
  assessment: Assessment;
  draggedAssessment?: number | null;
  selectedAssessments?: string[];

  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onClick: (assessmentId: string) => void;
  deleteAssessment: (id: number) => void;
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
  onMouseEnter,
  onMouseLeave,
  availableUnits,
  availableULOs,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(assessment.aDesc || "");
  const [selectedUnitId, setSelectedUnitId] = useState(assessment.unitId || "");
  const [assessmentType, setAssessmentType] = useState(assessment.assessmentType || "General");
  const [assessmentConditions, setAssessmentConditions] = useState(assessment.assessmentConditions || "");
  const [hurdleReqInput, setHurdleReqInput] = useState(
    typeof assessment.hurdleReq === "number" ? String(assessment.hurdleReq) : ""
  );
  const [selectedUloIds, setSelectedUloIds] = useState<number[]>(assessment.unitLosIds || []);
  const [unitSearch, setUnitSearch] = useState(() => {
    const selected = availableUnits.find((u) => u.unitId === (assessment.unitId || ""));
    return selected?.label || assessment.unitId || "";
  });

  const filteredUnits = availableUnits.filter((unit) =>
    unit.label.toLowerCase().includes(unitSearch.toLowerCase())
  );
  const filteredULOs = availableULOs.filter((ulo) => !selectedUnitId || ulo.unitId === selectedUnitId);

  const parseHurdleReq = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate?.({
        aDesc: editText,
        unitId: selectedUnitId,
        assessmentType: assessmentType.trim() || "General",
        assessmentConditions,
        hurdleReq: parseHurdleReq(hurdleReqInput),
        unitLosIds: selectedUloIds,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(assessment.aDesc || "");
    setSelectedUnitId(assessment.unitId || "");
    const selected = availableUnits.find((u) => u.unitId === (assessment.unitId || ""));
    setUnitSearch(selected?.label || assessment.unitId || "");
    setAssessmentType(assessment.assessmentType || "General");
    setAssessmentConditions(assessment.assessmentConditions || "");
    setHurdleReqInput(typeof assessment.hurdleReq === "number" ? String(assessment.hurdleReq) : "");
    setSelectedUloIds(assessment.unitLosIds || []);
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={assessment.aDesc || "Assessment"}
    >
      <span className="px-1 text-center text-[11px] leading-tight line-clamp-3 break-words select-none">
        {assessment.aDesc || "Assessment"}
      </span>

      {isSelected && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[220px] max-w-[320px] p-2 rounded border border-gray-200 bg-white text-gray-700 text-xs leading-relaxed shadow-xl z-[60]"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <>
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-1 mb-2 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                rows={3}
                onMouseDown={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="mt-1 max-h-24 overflow-y-auto rounded border border-gray-300 p-1"
                  onMouseDown={(e) => e.stopPropagation()}
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

              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Assessment Type</label>
                <input
                  type="text"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  placeholder="General"
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Assessment Conditions</label>
                <textarea
                  value={assessmentConditions}
                  onChange={(e) => setAssessmentConditions(e.target.value)}
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  rows={2}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Hurdle Requirement</label>
                <input
                  type="number"
                  value={hurdleReqInput}
                  onChange={(e) => setHurdleReqInput(e.target.value)}
                  placeholder="Leave blank for none"
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Linked Unit LOs</label>
                <div
                  className="max-h-24 overflow-y-auto rounded border border-gray-300 p-1"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredULOs.map((ulo) => {
                    const checked = selectedUloIds.includes(ulo.uloId);
                    return (
                      <label key={ulo.uloId} className="mb-1 flex items-start gap-1 text-[11px] text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedUloIds, ulo.uloId]
                              : selectedUloIds.filter((id) => id !== ulo.uloId);
                            setSelectedUloIds(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{ulo.uloDesc || `ULO ${ulo.uloId}`}</span>
                      </label>
                    );
                  })}
                  {!filteredULOs.length && <div className="text-[11px] text-gray-400">No ULOs available</div>}
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
              <div className="mb-2 text-[11px] text-gray-500">Type: {assessment.assessmentType || "General"}</div>
              <div className="mb-2 text-[11px] text-gray-500">
                Conditions: {assessment.assessmentConditions || "None"}
              </div>
              <div className="mb-2 text-[11px] text-gray-500">
                Hurdle Req: {typeof assessment.hurdleReq === "number" ? assessment.hurdleReq : "None"}
              </div>
              <div className="mb-2 text-[11px] text-gray-500">
                Unit LOs: {(assessment.unitLosIds || []).join(", ") || "None"}
              </div>
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
  draggedAssessment,
  onDoubleClick,
  onClick,
  onMouseDown,
  deleteAssessment,
}) => {
  const key = assessment.id.toString();

  return (
    <div
      className={`absolute group transition-shadow duration-200 ${
        draggedAssessment === assessment.id
          ? "shadow-2xl scale-105 z-50"
          : "z-10 shadow-sm hover:shadow-md"
      }`}
      style={{
        left: `${assessment.x}px`,
        top: `${assessment.y}px`,
        width: `${BOX_WIDTH}px`,
        minHeight: "100px",
      }}
      onClick={
        assessment.id ? () => onClick(assessment.id.toString()!) : undefined
      }
      onMouseDown={(e) => onMouseDown(e, assessment.id!)}
    >
      {/* Header */}
      <div
        className="h-16 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing relative"
        style={{
          backgroundColor: "#8B5CF6",
          color: "white",
        }}
        onDoubleClick={() => onDoubleClick(assessment.id)}
      >
        <div className="flex-1 truncate pr-6">
          <h2
            className="text-lg font-semibold leading-tight"
            title={assessment.name}
          >
            {assessment.name}
          </h2>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteAssessment(assessment.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-3 text-sm text-gray-800 flex flex-col gap-2">
        {/* Type */}
        <div className="text-xs font-semibold text-gray-500">
          Type:
          <span className="ml-1 text-gray-900">{assessment.type || "N/A"}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-snug">
          {assessment.description || "No description provided."}
        </p>
      </div>
    </div>
  );
};
