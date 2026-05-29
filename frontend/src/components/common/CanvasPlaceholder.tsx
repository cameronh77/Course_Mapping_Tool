import React, { useState, useRef, useEffect } from "react";
import type { PlaceholderBox, JunctionUnit, Tag, UnitBox, UnitMappings } from "../../types";
import { getTagColor } from "./themeViewConstants";

export const PLACEHOLDER_WIDTH = 256;

const TYPE_COLOR: Record<string, string> = {
  CORE:               "#6B7280",
  ELECTIVE:           "#F59E0B",
  SELECTIVE_ELECTIVE: "#EA580C",
  JUNCTION:           "#8B5CF6",
  AND:                "#059669",
};

const TYPE_ICON: Record<string, string> = {
  CORE: "◆", ELECTIVE: "✦", SELECTIVE_ELECTIVE: "⊞", JUNCTION: "⑂", AND: "⊕",
};

const DEFAULT_LABEL: Record<string, string> = {
  CORE: "Core Unit", ELECTIVE: "Elective", SELECTIVE_ELECTIVE: "Selective Elective", JUNCTION: "OR Junction", AND: "AND Junction",
};

interface Props {
  box: PlaceholderBox;
  onDelete: (id: number) => void;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onUpdate: (id: number, changes: Partial<PlaceholderBox>) => void;
  onDragUnitOut: (junctionId: number, unit: JunctionUnit, e: React.MouseEvent) => void;
  onEditUnit: (unit: JunctionUnit) => void;
  existingTags?: Tag[];
  unitMappings?: UnitMappings;
  unitBoxes?: UnitBox[];
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

export const CanvasPlaceholder: React.FC<Props> = ({ box, onDelete, onMouseDown, onUpdate, onDragUnitOut, onEditUnit, existingTags = [], unitMappings = {}, unitBoxes = [] }) => {
  const isOrJunction  = box.placeholderType === "JUNCTION";
  const isAndJunction = box.placeholderType === "AND";
  const isSelectiveElective = box.placeholderType === "SELECTIVE_ELECTIVE";
  const isJunctionLike = isOrJunction || isAndJunction;

  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(box.label ?? DEFAULT_LABEL[box.placeholderType]);
  const menuRef = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLButtonElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingLabel) labelInputRef.current?.focus(); }, [editingLabel]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (kebabRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    setMenuOpen((v) => !v);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsExpanded((v) => !v);
  };

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
  const selectedTagIds = box.tagIds ?? [];

  // Total credits for AND junction display
  const totalCredits = unitOptions.reduce((sum, u) => sum + (u.credits ?? 0), 0);

  // Derive pool units for SELECTIVE_ELECTIVE from unitMappings filtered by selectedTagIds
  const poolUnits = React.useMemo(() => {
    if (!isSelectiveElective || selectedTagIds.length === 0) return [];
    const seen = new Set<string>();
    const results: { unitId: string; name: string; credits?: number; color?: string }[] = [];
    for (const [unitId, mapping] of Object.entries(unitMappings)) {
      if (seen.has(unitId)) continue;
      if (mapping.tags.some((t) => selectedTagIds.includes(t.tagId))) {
        seen.add(unitId);
        const box = unitBoxes.find((u) => u.unitId === unitId);
        results.push({ unitId, name: box?.name ?? unitId, credits: box?.credits, color: box?.color });
      }
    }
    return results;
  }, [isSelectiveElective, selectedTagIds, unitMappings, unitBoxes]);

  const toggleTag = (tagId: number) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onUpdate(box.id, { tagIds: next });
  };

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

  const canExpand = isJunctionLike || isSelectiveElective;

  return (
    <div
      className="absolute transition-shadow duration-200 shadow-sm hover:shadow-md"
      style={{
        left: box.x,
        top: box.y,
        width: PLACEHOLDER_WIDTH,
        height: 80,
        minHeight: 80,
        zIndex: isExpanded || menuOpen ? 40 : 10,
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
            if (!isJunctionLike && !isSelectiveElective) { e.stopPropagation(); setLabelDraft(displayLabel); setEditingLabel(true); }
          }}
        >
          <div className={`flex-1 truncate ${canExpand ? "pr-16" : "pr-9"}`}>
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
                : isSelectiveElective
                  ? selectedTagIds.length === 0
                    ? "select tags to define pool"
                    : `${selectedTagIds.length} tag${selectedTagIds.length !== 1 ? 's' : ''} · ${poolUnits.length} unit${poolUnits.length !== 1 ? 's' : ''}`
                  : "placeholder · double-click to rename"}
            </p>
          </div>

          {/* Header action buttons */}
          <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
            {canExpand && (
              <button
                onClick={handleToggleExpand}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-white bg-black/10 hover:bg-black/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                title={isExpanded ? "Collapse" : "Show options"}
              >
                {isExpanded
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                }
              </button>
            )}
            <button
              ref={kebabRef}
              onClick={handleToggleMenu}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-white bg-black/10 hover:bg-black/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
              title="More actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="12" cy="19" r="1.8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Actions menu ── */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute bg-white border border-gray-200 shadow-xl rounded-md text-gray-800 text-xs font-medium py-1 min-w-[170px]"
          style={{ left: PLACEHOLDER_WIDTH + 8, top: 0, zIndex: 50 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(box.id, { pinned: !box.pinned }); setMenuOpen(false); }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
          >
            <span className="text-base leading-none">📌</span>
            {box.pinned ? "Unpin" : "Pin to all pathways"}
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(box.id); setMenuOpen(false); }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
            Remove placeholder
          </button>
        </div>
      )}

      {/* ── OR junction side panel ── */}
      {isOrJunction && isExpanded && (
        <div
          className="absolute flex flex-col bg-white border border-gray-200 shadow-xl rounded overflow-hidden"
          style={{
            left: PLACEHOLDER_WIDTH + 8,
            top: 0,
            width: 252,
            height: 240,
            borderLeft: `4px solid ${color}`,
            zIndex: 50,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Credit range rule */}
          <div className="flex items-center justify-between gap-1 px-2 py-2 border-b border-violet-50 shrink-0">
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

          <div className="flex flex-col px-2 py-2 gap-1.5 overflow-y-auto flex-1">
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
        </div>
      )}

      {/* ── AND junction side panel ── */}
      {isAndJunction && isExpanded && (
        <div
          className="absolute flex flex-col bg-white border border-gray-200 shadow-xl rounded overflow-hidden"
          style={{
            left: PLACEHOLDER_WIDTH + 8,
            top: 0,
            width: 252,
            height: 240,
            borderLeft: `4px solid ${color}`,
            zIndex: 50,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Max total credits rule */}
          <div className="flex items-center justify-between gap-1 px-2 py-2 border-b border-emerald-50 shrink-0">
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

          <div className="flex flex-col px-2 py-2 gap-1.5 overflow-y-auto flex-1">
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
        </div>
      )}

      {/* ── Selective Elective side panel ── */}
      {isSelectiveElective && isExpanded && (
        <div
          className="absolute flex flex-col bg-white border border-gray-200 shadow-xl rounded overflow-hidden"
          style={{
            left: PLACEHOLDER_WIDTH + 8,
            top: 0,
            width: 272,
            height: 280,
            borderLeft: `4px solid ${color}`,
            zIndex: 50,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Tag selector */}
          <div className="px-2 pt-2 pb-1.5 border-b border-orange-50 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-1.5">Filter by Tag</p>
            {existingTags.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">No tags defined for this course.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {existingTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.tagId);
                  const tagColors = getTagColor(tag.tagId, existingTags);
                  return (
                    <button
                      key={tag.tagId}
                      type="button"
                      onClick={() => toggleTag(tag.tagId)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-[10px] px-2 py-0.5 rounded-full border font-semibold transition-all"
                      style={
                        active
                          ? { backgroundColor: tagColors.bg, borderColor: tagColors.border, color: tagColors.label }
                          : { backgroundColor: "transparent", borderColor: "#D1D5DB", color: "#9CA3AF" }
                      }
                      title={active ? `Remove ${tag.tagName} from filter` : `Add ${tag.tagName} to filter`}
                    >
                      {tag.tagName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Credit constraints */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-orange-50 shrink-0">
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
            <span className="text-[9px] text-gray-400 italic shrink-0">credits</span>
          </div>

          {/* Matching unit pool */}
          <div className="flex flex-col px-2 py-2 gap-1.5 overflow-y-auto flex-1">
            {selectedTagIds.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-3">
                Select tags above to see matching units.
              </p>
            ) : poolUnits.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-3">
                No canvas units match the selected tags.
              </p>
            ) : (
              <>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold shrink-0">
                  {poolUnits.length} eligible unit{poolUnits.length !== 1 ? 's' : ''}
                </p>
                {poolUnits.map((unit) => (
                  <div
                    key={unit.unitId}
                    className="rounded overflow-hidden shadow-sm"
                    style={{ backgroundColor: unit.color || "#3B82F6" }}
                  >
                    <div className="px-2.5 py-1.5 text-white">
                      <div className="text-[11px] font-bold truncate leading-tight">{unit.unitId}</div>
                      <div className="text-[10px] opacity-75 truncate leading-tight">{unit.name}</div>
                    </div>
                    {unit.credits != null && (
                      <div className="px-2.5 pb-1 text-[9px] text-white/50 leading-tight">
                        {unit.credits} credits
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
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
