import React, { useState, useRef, useEffect } from "react";
import type { PlaceholderBox, JunctionUnit } from "../../types";

export const PLACEHOLDER_WIDTH = 256;

const TYPE_COLOR: Record<string, string> = {
  CORE:     "#6B7280",
  ELECTIVE: "#F59E0B",
  JUNCTION: "#8B5CF6",
  AND:      "#059669",
};

const TYPE_ICON: Record<string, string> = {
  CORE: "◆", ELECTIVE: "✦", JUNCTION: "⑂", AND: "⊕",
};

const DEFAULT_LABEL: Record<string, string> = {
  CORE: "Core Unit", ELECTIVE: "Elective", JUNCTION: "OR Junction", AND: "AND Junction",
};

interface Props {
  box: PlaceholderBox;
  onDelete: (id: number) => void;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onUpdate: (id: number, changes: Partial<PlaceholderBox>) => void;
  onDragUnitOut: (junctionId: number, unit: JunctionUnit, e: React.MouseEvent) => void;
  onEditUnit: (unit: JunctionUnit) => void;
}

const OrDivider = () => (
  <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold">
    <div className="flex-1 h-px bg-violet-100" />
    OR
    <div className="flex-1 h-px bg-violet-100" />
  </div>
);

const AndDivider = () => (
  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
    <div className="flex-1 h-px bg-emerald-100" />
    AND
    <div className="flex-1 h-px bg-emerald-100" />
  </div>
);

export const CanvasPlaceholder: React.FC<Props> = ({ box, onDelete, onMouseDown, onUpdate, onDragUnitOut, onEditUnit }) => {
  const isOrJunction  = box.placeholderType === "JUNCTION";
  const isAndJunction = box.placeholderType === "AND";
  const isJunctionLike = isOrJunction || isAndJunction;

  const [isExpanded, setIsExpanded] = useState(isJunctionLike);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(box.label ?? DEFAULT_LABEL[box.placeholderType]);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingLabel) labelInputRef.current?.focus(); }, [editingLabel]);

  const color = TYPE_COLOR[box.placeholderType];
  const icon  = TYPE_ICON[box.placeholderType];
  const displayLabel = box.label || DEFAULT_LABEL[box.placeholderType];

  const commitLabel = () => {
    onUpdate(box.id, { label: labelDraft.trim() || DEFAULT_LABEL[box.placeholderType] });
    setEditingLabel(false);
  };

  const removeUnitOption = (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    onUpdate(box.id, { unitOptions: (box.unitOptions ?? []).filter((u) => u.unitId !== unitId) });
  };

  const unitOptions = box.unitOptions ?? [];

  // Total credits for AND junction display
  const totalCredits = unitOptions.reduce((sum, u) => sum + (u.credits ?? 0), 0);

  // Shared credit number input component
  const CreditInput = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: number | undefined;
    onChange: (v: number | undefined) => void;
    placeholder: string;
  }) => (
    <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
      <span className="shrink-0 font-medium">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-gray-400 bg-white"
      />
      <span className="shrink-0">cr</span>
    </label>
  );

  return (
    <div
      className="absolute group transition-shadow duration-200 z-10 shadow-sm hover:shadow-md"
      style={{
        left: box.x,
        top: box.y,
        width: PLACEHOLDER_WIDTH,
        height: isExpanded ? "auto" : 80,
        minHeight: 80,
      }}
    >
      <div
        className="border-2 border-dashed bg-white rounded flex flex-col w-full h-full overflow-hidden"
        style={{ borderColor: color + "66" }}
      >
        {/* ── Header ── */}
        <div
          className="h-20 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0 relative"
          style={{ backgroundColor: color, color: "white" }}
          onMouseDown={(e) => onMouseDown(e, box.id)}
          onDoubleClick={(e) => {
            if (!isJunctionLike) { e.stopPropagation(); setLabelDraft(displayLabel); setEditingLabel(true); }
          }}
        >
          <div className="flex-1 truncate pr-6">
            {editingLabel ? (
              <input
                ref={labelInputRef}
                className="text-lg font-semibold bg-transparent border-b border-white/60 focus:outline-none w-full text-white placeholder-white/50"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => { if (e.key === "Enter") commitLabel(); if (e.key === "Escape") setEditingLabel(false); }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <h2 className="text-lg font-semibold truncate leading-tight" title={displayLabel}>
                <span className="mr-1 opacity-80">{icon}</span>{displayLabel}
              </h2>
            )}
            <p className="text-[10px] mt-0.5 opacity-50 uppercase tracking-widest font-medium">
              {isJunctionLike
                ? `${unitOptions.length} option${unitOptions.length !== 1 ? 's' : ''} · drag units in`
                : "placeholder · double-click to rename"}
            </p>
          </div>

          {/* Expand/collapse (junctions only) */}
          {isJunctionLike && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded((v) => !v); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-2 top-2 text-white bg-black/10 hover:bg-black/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors z-10"
              title={isExpanded ? "Collapse" : "Show options"}
            >
              {isExpanded
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              }
            </button>
          )}

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(box.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Remove placeholder"
          >
            ×
          </button>
        </div>

        {/* ── OR junction expanded body ── */}
        {isOrJunction && isExpanded && (
          <div
            className="flex flex-col bg-white border-t border-gray-100 px-2 py-2 gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Credit range rule */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-violet-50">
              <CreditInput
                label="Min"
                value={box.minCredits}
                onChange={(v) => onUpdate(box.id, { minCredits: v })}
                placeholder="—"
              />
              <span className="text-[10px] text-gray-300">–</span>
              <CreditInput
                label="Max"
                value={box.maxCredits}
                onChange={(v) => onUpdate(box.id, { maxCredits: v })}
                placeholder="—"
              />
              <span className="text-[9px] text-gray-400 italic shrink-0">per unit</span>
            </div>

            {unitOptions.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-2">
                Drag units here to add options
              </p>
            ) : (
              unitOptions.map((unit, idx) => (
                <React.Fragment key={unit.courseUnitId ?? unit.unitId}>
                  {idx > 0 && <OrDivider />}
                  <UnitCard unit={unit} onDragOut={(e) => onDragUnitOut(box.id, unit, e)} onRemove={(e) => removeUnitOption(e, unit.unitId)} onEdit={() => onEditUnit(unit)} />
                </React.Fragment>
              ))
            )}
          </div>
        )}

        {/* ── AND junction expanded body ── */}
        {isAndJunction && isExpanded && (
          <div
            className="flex flex-col bg-white border-t border-gray-100 px-2 py-2 gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Max total credits rule */}
            <div className="flex items-center justify-between gap-1 pb-1 border-b border-emerald-50">
              <CreditInput
                label="Max total"
                value={box.maxTotalCredits}
                onChange={(v) => onUpdate(box.id, { maxTotalCredits: v })}
                placeholder="—"
              />
              <span className="text-[9px] text-gray-400 italic shrink-0">
                total: <span className={box.maxTotalCredits !== undefined && totalCredits > box.maxTotalCredits ? "text-red-500 font-bold" : "text-emerald-600 font-semibold"}>{totalCredits}</span>
                {box.maxTotalCredits !== undefined && ` / ${box.maxTotalCredits}`} cr
              </span>
            </div>

            {unitOptions.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-2">
                Drag units here to add options
              </p>
            ) : (
              unitOptions.map((unit, idx) => (
                <React.Fragment key={unit.courseUnitId ?? unit.unitId}>
                  {idx > 0 && <AndDivider />}
                  <UnitCard unit={unit} onDragOut={(e) => onDragUnitOut(box.id, unit, e)} onRemove={(e) => removeUnitOption(e, unit.unitId)} onEdit={() => onEditUnit(unit)} />
                </React.Fragment>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared draggable unit card used inside both junction types
const UnitCard: React.FC<{
  unit: JunctionUnit;
  onDragOut: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  onEdit: () => void;
}> = ({ unit, onDragOut, onRemove, onEdit }) => (
  <div
    className="rounded overflow-hidden shadow-sm cursor-grab active:cursor-grabbing group/card"
    style={{ backgroundColor: unit.color || "#3B82F6" }}
    onMouseDown={(e) => { e.stopPropagation(); onDragOut(e); }}
    onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
    title="Drag to move · double-click to edit"
  >
    <div className="px-2.5 py-1.5 flex items-start gap-1.5 text-white">
      <svg className="w-3 h-3 mt-0.5 shrink-0 opacity-40 group-hover/card:opacity-70" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate leading-tight">{unit.unitId}</div>
        <div className="text-[10px] opacity-75 truncate leading-tight">{unit.unitName}</div>
      </div>
      <button
        className="text-white/50 hover:text-white text-base leading-none shrink-0 -mt-0.5"
        onClick={onRemove}
        onMouseDown={(e) => e.stopPropagation()}
        title="Remove from junction"
      >
        ×
      </button>
    </div>
    {unit.credits != null && (
      <div className="px-2.5 pb-1 text-[9px] text-white/50 leading-tight">
        {unit.credits} credits
      </div>
    )}
  </div>
);
