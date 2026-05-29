import React, { useState } from "react";
import type { BloomsLevel, TaxonomySystem, CourseLearningOutcome, UnitLearningOutcome, unitLearningOutcomeBox } from "../../types";

const BLOOMS_STYLES: Record<BloomsLevel, { badge: string; label: string }> = {
  REMEMBER:   { badge: "bg-red-200 text-red-800",       label: "Remember" },
  UNDERSTAND: { badge: "bg-orange-200 text-orange-800",  label: "Understand" },
  APPLY:      { badge: "bg-yellow-200 text-yellow-800",  label: "Apply" },
  ANALYSE:    { badge: "bg-green-200 text-green-800",    label: "Analyse" },
  EVALUATE:   { badge: "bg-blue-200 text-blue-800",      label: "Evaluate" },
  CREATE:     { badge: "bg-purple-200 text-purple-800",  label: "Create" },
};

const SOLO_STYLES: Record<string, { badge: string; label: string }> = {
  PRESTRUCTURAL:    { badge: "bg-gray-200 text-gray-700",    label: "Pre-structural" },
  UNISTRUCTURAL:    { badge: "bg-sky-200 text-sky-800",      label: "Uni-structural" },
  MULTISTRUCTURAL:  { badge: "bg-teal-200 text-teal-800",    label: "Multi-structural" },
  RELATIONAL:       { badge: "bg-indigo-200 text-indigo-800",label: "Relational" },
  EXTENDED_ABSTRACT:{ badge: "bg-violet-200 text-violet-800",label: "Extended Abstract" },
};

const WEBB_STYLES: Record<string, { badge: string; label: string }> = {
  RECALL:              { badge: "bg-lime-200 text-lime-800",    label: "Recall" },
  SKILL_CONCEPT:       { badge: "bg-emerald-200 text-emerald-800", label: "Skill/Concept" },
  STRATEGIC_THINKING:  { badge: "bg-cyan-200 text-cyan-800",    label: "Strategic Thinking" },
  EXTENDED_THINKING:   { badge: "bg-fuchsia-200 text-fuchsia-800", label: "Extended Thinking" },
};

const FINK_STYLES: Record<string, { badge: string; label: string }> = {
  FOUNDATIONAL:     { badge: "bg-amber-200 text-amber-800",   label: "Foundational Knowledge" },
  APPLICATION:      { badge: "bg-rose-200 text-rose-800",     label: "Application" },
  INTEGRATION:      { badge: "bg-pink-200 text-pink-800",     label: "Integration" },
  HUMAN_DIMENSION:  { badge: "bg-orange-200 text-orange-900", label: "Human Dimension" },
  CARING:           { badge: "bg-red-200 text-red-700",       label: "Caring" },
  LEARNING_TO_LEARN:{ badge: "bg-purple-200 text-purple-700", label: "Learning to Learn" },
};

const TAXONOMY_META: Record<TaxonomySystem, { label: string; styles: Record<string, { badge: string; label: string }> }> = {
  BLOOMS: { label: "Bloom's Taxonomy",          styles: BLOOMS_STYLES },
  SOLO:   { label: "SOLO Taxonomy",             styles: SOLO_STYLES },
  WEBB:   { label: "Webb's Depth of Knowledge", styles: WEBB_STYLES },
  FINK:   { label: "Fink's Significant Learning",styles: FINK_STYLES },
};

export const getTaxonomyBadge = (ulo: UnitLearningOutcome): { badge: string; label: string } | null => {
  if (ulo.taxonomySystem && ulo.taxonomyLevel) {
    const meta = TAXONOMY_META[ulo.taxonomySystem as TaxonomySystem];
    return meta?.styles[ulo.taxonomyLevel] ?? null;
  }
  if (ulo.bloomsLevel) return BLOOMS_STYLES[ulo.bloomsLevel] ?? null;
  return null;
};

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
  onCLODrop?: (clo: CourseLearningOutcome) => void;
  isHighlighted?: boolean;
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
    onCLODrop,
    isHighlighted,
  } = props;

  const [isEditing, setIsEditing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editText, setEditText] = useState(ulo.uloDesc);
  const initialSystem = ulo.taxonomySystem ?? (ulo.bloomsLevel ? "BLOOMS" : "");
  const initialLevel = ulo.taxonomyLevel ?? ulo.bloomsLevel ?? "";
  const [editTaxonomySystem, setEditTaxonomySystem] = useState<TaxonomySystem | "">(initialSystem as TaxonomySystem | "");
  const [editTaxonomyLevel, setEditTaxonomyLevel] = useState<string>(initialLevel);
  const [editBloomsLevel, setEditBloomsLevel] = useState<BloomsLevel | "">(ulo.bloomsLevel ?? "");
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
      const isBlooms = editTaxonomySystem === "BLOOMS";
      onUpdate?.({
        uloDesc: editText,
        unitId: selectedUnitId,
        cloIds: selectedCloIds,
        assessmentIds: parseAssessmentIds(assessmentInput),
        bloomsLevel: isBlooms ? (editTaxonomyLevel as BloomsLevel || undefined) : undefined,
        taxonomySystem: editTaxonomySystem || undefined,
        taxonomyLevel: editTaxonomySystem && !isBlooms ? (editTaxonomyLevel || undefined) : undefined,
      } as ULOUpdatePayload & { bloomsLevel?: BloomsLevel; taxonomySystem?: TaxonomySystem; taxonomyLevel?: string });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(ulo.uloDesc);
    const sys = ulo.taxonomySystem ?? (ulo.bloomsLevel ? "BLOOMS" : "");
    const lvl = ulo.taxonomyLevel ?? ulo.bloomsLevel ?? "";
    setEditTaxonomySystem(sys as TaxonomySystem | "");
    setEditTaxonomyLevel(lvl);
    setEditBloomsLevel(ulo.bloomsLevel ?? "");
    setSelectedUnitId(ulo.unitId || "");
    const selected = availableUnits.find((u) => u.unitId === (ulo.unitId || ""));
    setUnitSearch(selected?.label || ulo.unitId || "");
    setSelectedCloIds(
      ulo.cloIds && ulo.cloIds.length > 0 ? ulo.cloIds : typeof ulo.cloId === "number" ? [ulo.cloId] : []
    );
    setAssessmentInput((ulo.assessmentIds || []).join(","));
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!onCLODrop) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("application/json")) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!onCLODrop) return;
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type === "clo" && parsed.data) onCLODrop(parsed.data);
    } catch {
      console.error("ULOBox drop parse failed");
    }
  };

  const bloomsStyle = getTaxonomyBadge(ulo);
  const boxHeight = 72;

  return (
    <div
      className={`absolute border shadow transition-shadow flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing ${
        isDragging ? "z-50 shadow-2xl" : isSelected ? "z-40 hover:shadow-lg" : "z-20 hover:shadow-lg"
      } ${isSelected ? "ring-2 ring-blue-300" : ""} ${
        isHighlighted ? "ring-2 ring-purple-400 ring-offset-1" : ""
      } ${isDragOver ? "brightness-110" : ""}`}
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title={ulo.uloDesc}
    >
      <span className="px-1 text-center text-[11px] leading-tight line-clamp-3 break-words select-none">
        {ulo.uloDesc || "ULO"}
      </span>

      {bloomsStyle && (
        <span className={`absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${bloomsStyle.badge}`}>
          {bloomsStyle.label}
        </span>
      )}

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
                <label className="mb-1 block font-semibold text-[11px] text-gray-600">Taxonomy System</label>
                <select
                  value={editTaxonomySystem}
                  onChange={(e) => { setEditTaxonomySystem(e.target.value as TaxonomySystem | ""); setEditTaxonomyLevel(""); }}
                  className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">None</option>
                  {(Object.keys(TAXONOMY_META) as TaxonomySystem[]).map((sys) => (
                    <option key={sys} value={sys}>{TAXONOMY_META[sys].label}</option>
                  ))}
                </select>
              </div>
              {editTaxonomySystem && (
                <div className="mb-2">
                  <label className="mb-1 block font-semibold text-[11px] text-gray-600">Level</label>
                  <select
                    value={editTaxonomyLevel}
                    onChange={(e) => setEditTaxonomyLevel(e.target.value)}
                    className="w-full rounded border border-gray-300 p-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">None</option>
                    {Object.entries(TAXONOMY_META[editTaxonomySystem].styles).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              )}
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
