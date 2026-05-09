import React, { useState, useRef, useEffect } from "react";
import type { PlaceholderBox, JunctionUnit } from "../../types";

export const PLACEHOLDER_WIDTH = 256;

// Header colours per type
const TYPE_COLOR: Record<string, string> = {
  CORE:     "#6B7280", // gray  – unknown unit
  ELECTIVE: "#F59E0B", // amber
  JUNCTION: "#8B5CF6", // violet
};

const TYPE_ICON: Record<string, string> = {
  CORE: "◆", ELECTIVE: "✦", JUNCTION: "⑂",
};

const DEFAULT_LABEL: Record<string, string> = {
  CORE: "Core Unit", ELECTIVE: "Elective", JUNCTION: "OR Junction",
};

interface Props {
  box: PlaceholderBox;
  onDelete: (id: number) => void;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onUpdate: (id: number, changes: Partial<PlaceholderBox>) => void;
  onDragUnitOut: (junctionId: number, unit: JunctionUnit, e: React.MouseEvent) => void;
}

// OR divider
const OrDivider = () => (
  <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-bold">
    <div className="flex-1 h-px bg-violet-100" />
    OR
    <div className="flex-1 h-px bg-violet-100" />
  </div>
);

export const CanvasPlaceholder: React.FC<Props> = ({ box, onDelete, onMouseDown, onUpdate, onDragUnitOut }) => {
  const isJunction = box.placeholderType === "JUNCTION";
  const [isExpanded, setIsExpanded] = useState(isJunction);
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(box.label ?? DEFAULT_LABEL[box.placeholderType]);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const optionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingLabel) labelInputRef.current?.focus(); }, [editingLabel]);
  useEffect(() => { if (editingOptionIdx !== null) optionInputRef.current?.focus(); }, [editingOptionIdx]);

  const color = TYPE_COLOR[box.placeholderType];
  const icon  = TYPE_ICON[box.placeholderType];
  const displayLabel = box.label || DEFAULT_LABEL[box.placeholderType];

  const commitLabel = () => {
    onUpdate(box.id, { label: labelDraft.trim() || DEFAULT_LABEL[box.placeholderType] });
    setEditingLabel(false);
  };

  const commitOption = (idx: number, value: string) => {
    const next = [...(box.options ?? [])];
    next[idx] = value.trim() || next[idx];
    onUpdate(box.id, { options: next });
    setEditingOptionIdx(null);
  };

  const addOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(box.id, { options: [...(box.options ?? []), "Option"] });
  };

  const removeTextOption = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    onUpdate(box.id, { options: (box.options ?? []).filter((_, i) => i !== idx) });
  };

  const removeUnitOption = (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    onUpdate(box.id, { unitOptions: (box.unitOptions ?? []).filter((u) => u.unitId !== unitId) });
  };

  const unitOptions = box.unitOptions ?? [];
  const textOptions = box.options ?? [];
  const totalEntries = unitOptions.length + textOptions.length;

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
      {/* Same outer wrapper as UnitBox */}
      <div
        className="border-2 border-dashed bg-white rounded flex flex-col w-full h-full overflow-hidden"
        style={{ borderColor: color + "66" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="h-20 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0 relative"
          style={{ backgroundColor: color, color: "white" }}
          onMouseDown={(e) => onMouseDown(e, box.id)}
          onDoubleClick={(e) => {
            if (!isJunction) { e.stopPropagation(); setLabelDraft(displayLabel); setEditingLabel(true); }
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
              {isJunction
                ? `${totalEntries} option${totalEntries !== 1 ? 's' : ''} · drag units in`
                : "placeholder · double-click to rename"}
            </p>
          </div>

          {/* Expand button (junction only) */}
          {isJunction && (
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

          {/* Delete (same position as UnitBox) */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(box.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Remove placeholder"
          >
            ×
          </button>
        </div>

        {/* ── Junction options (expanded) ─────────────────────────────────── */}
        {isJunction && isExpanded && (
          <div
            className="flex flex-col bg-white border-t border-gray-100 px-2 py-2 gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* ── Unit cards ── */}
            {unitOptions.map((unit, idx) => (
              <React.Fragment key={unit.unitId}>
                {idx > 0 && <OrDivider />}
                <div
                  className="rounded overflow-hidden shadow-sm border border-white/10 cursor-grab active:cursor-grabbing group/card"
                  style={{ backgroundColor: unit.color || "#3B82F6" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onDragUnitOut(box.id, unit, e);
                  }}
                  title="Drag to move out of junction"
                >
                  <div className="px-2.5 py-1.5 flex items-start gap-1.5 text-white">
                    {/* Drag grip icon */}
                    <svg className="w-3 h-3 mt-0.5 shrink-0 opacity-40 group-hover/card:opacity-70" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate leading-tight">{unit.unitId}</div>
                      <div className="text-[10px] opacity-75 truncate leading-tight">{unit.unitName}</div>
                    </div>
                    <button
                      className="text-white/50 hover:text-white text-base leading-none shrink-0 -mt-0.5"
                      onClick={(e) => removeUnitOption(e, unit.unitId)}
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
              </React.Fragment>
            ))}

            {/* ── Text options ── */}
            {textOptions.map((opt, idx) => (
              <React.Fragment key={`text-${idx}`}>
                {(unitOptions.length > 0 || idx > 0) && <OrDivider />}
                <div className="flex items-center gap-1">
                  {editingOptionIdx === idx ? (
                    <input
                      ref={optionInputRef}
                      className="flex-1 text-xs border border-violet-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      defaultValue={opt}
                      onBlur={(e) => commitOption(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitOption(idx, (e.target as HTMLInputElement).value);
                        if (e.key === "Escape") setEditingOptionIdx(null);
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-xs text-gray-600 truncate cursor-text hover:text-gray-900 px-1"
                      onDoubleClick={() => setEditingOptionIdx(idx)}
                      title="Double-click to edit"
                    >
                      {opt || <span className="italic text-gray-400">empty</span>}
                    </span>
                  )}
                  <button
                    className="text-[11px] text-gray-300 hover:text-red-400 leading-none px-0.5"
                    onClick={(e) => removeTextOption(e, idx)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </React.Fragment>
            ))}

            {totalEntries === 0 && (
              <p className="text-[10px] text-gray-400 italic text-center py-1">
                Drag units here or add a label below
              </p>
            )}

            <button
              className="mt-0.5 w-full text-[10px] text-violet-500 hover:text-violet-700 border border-dashed border-violet-200 rounded py-0.5 transition-colors"
              onClick={addOption}
            >
              + add label
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
