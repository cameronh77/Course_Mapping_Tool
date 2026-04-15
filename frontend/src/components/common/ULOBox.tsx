import React, { useState } from "react";
import type { CourseLearningOutcome, UnitLearningOutcome, unitLearningOutcomeBox } from "../../types";

type UnitOption = {
  unitId: string;
  label: string;
};

type ULOUpdatePayload = {
  uloDesc: string;
  unitId: string;
  cloIds: number[];
  assessmentIds: number[];
};

interface WhiteboardULOBoxProps {
  ulo: UnitLearningOutcome;
  x: number;
  y: number;
  width: number;
  isDragging: boolean;
  isSelected: boolean;
  color: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  availableUnits: UnitOption[];
  availableCLOs: CourseLearningOutcome[];
  onDelete?: () => void;
  onUpdate?: (updated: ULOUpdatePayload) => void;
}

interface LegacyULOBoxProps {
  ulo: unitLearningOutcomeBox;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onDelete?: (id: number) => void;
}

type ULOBoxProps = WhiteboardULOBoxProps | LegacyULOBoxProps;

const isLegacyProps = (props: ULOBoxProps): props is LegacyULOBoxProps => {
  return "onDoubleClick" in props;
};

export const ULOBox: React.FC<ULOBoxProps> = (props) => {
  if (isLegacyProps(props)) {
    const { ulo, onMouseDown, onDoubleClick, onDelete } = props;

    return (
      <div
        className="absolute group bg-orange-100 border border-orange-300 rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition w-64"
        style={{
          left: ulo.x,
          top: ulo.y,
        }}
        onMouseDown={(e) => onMouseDown(e, ulo.id!)}
        onDoubleClick={() => onDoubleClick(ulo.id!)}
      >
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ulo.id!);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Remove ULO"
          >
            x
          </button>
        )}

        <h3 className="text-sm font-bold text-orange-700 mb-2">Unit Learning Outcome</h3>

        <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">{ulo.uloDesc || "No description"}</p>
      </div>
    );
  }

  const {
    ulo,
    x,
    y,
    width,
    isDragging,
    isSelected,
    color,
    onMouseDown,
    onClick,
    onHoverStart,
    onHoverEnd,
    availableUnits,
    availableCLOs,
    onDelete,
    onUpdate,
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(ulo.uloDesc);
  const [selectedUnitId, setSelectedUnitId] = useState(ulo.unitId || "");
  const [selectedCloIds, setSelectedCloIds] = useState<number[]>(
    ulo.cloIds && ulo.cloIds.length > 0 ? ulo.cloIds : typeof ulo.cloId === "number" ? [ulo.cloId] : []
  );
  const [assessmentInput, setAssessmentInput] = useState((ulo.assessmentIds || []).join(","));
  const [unitSearch, setUnitSearch] = useState(() => {
    const selected = availableUnits.find((u) => u.unitId === (ulo.unitId || ""));
    return selected?.label || ulo.unitId || "";
  });

  const filteredUnits = availableUnits.filter((unit) =>
    unit.label.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const parseAssessmentIds = (value: string) => {
    return value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v > 0);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate?.({
        uloDesc: editText,
        unitId: selectedUnitId,
        cloIds: selectedCloIds,
        assessmentIds: parseAssessmentIds(assessmentInput),
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(ulo.uloDesc);
    setSelectedUnitId(ulo.unitId || "");
    const selected = availableUnits.find((u) => u.unitId === (ulo.unitId || ""));
    setUnitSearch(selected?.label || ulo.unitId || "");
    setSelectedCloIds(
      ulo.cloIds && ulo.cloIds.length > 0 ? ulo.cloIds : typeof ulo.cloId === "number" ? [ulo.cloId] : []
    );
    setAssessmentInput((ulo.assessmentIds || []).join(","));
    setIsEditing(false);
  };

  const boxHeight = 72;

  return (
    <div
      className={`absolute border shadow transition-shadow flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing ${
        isDragging ? "z-50 shadow-2xl" : isSelected ? "z-40 hover:shadow-lg" : "z-20 hover:shadow-lg"
      } ${isSelected ? "ring-2 ring-blue-300" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${boxHeight}px`,
        backgroundColor: color,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      title={ulo.uloDesc}
    >
      <span className="px-1 text-center text-[11px] leading-tight line-clamp-3 break-words select-none">
        {ulo.uloDesc || "ULO"}
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
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Linked CLO(s)</label>
                <div className="max-h-24 overflow-y-auto rounded border border-gray-300 p-1">
                  {availableCLOs.map((clo) => {
                    const cloId = clo.cloId;
                    if (typeof cloId !== "number") return null;
                    const checked = selectedCloIds.includes(cloId);

                    return (
                      <label key={cloId} className="mb-1 flex items-start gap-1 text-[11px] text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...selectedCloIds, cloId]
                              : selectedCloIds.filter((id) => id !== cloId);
                            setSelectedCloIds(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{clo.cloDesc}</span>
                      </label>
                    );
                  })}
                  {!availableCLOs.length && <div className="text-[11px] text-gray-400">No CLOs available</div>}
                </div>
              </div>

              <div className="mb-2">
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Linked Assessment IDs</label>
                <input
                  type="text"
                  value={assessmentInput}
                  onChange={(e) => setAssessmentInput(e.target.value)}
                  placeholder="e.g. 1,2,5"
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
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
              <div className="mb-2">{ulo.uloDesc}</div>
              <div className="mb-2 text-[11px] text-gray-500">Unit: {ulo.unitId || "None"}</div>
              <div className="mb-2 text-[11px] text-gray-500">
                CLO(s): {(ulo.cloIds && ulo.cloIds.length > 0 ? ulo.cloIds : ulo.cloId ? [ulo.cloId] : []).join(", ") || "None"}
              </div>
              <div className="mb-2 text-[11px] text-gray-500">Assessments: {(ulo.assessmentIds || []).join(", ") || "None"}</div>
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
