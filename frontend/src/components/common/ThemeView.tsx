import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Tag, UnitBox as UnitBoxType, UnitMappings } from "../../types";
import { useThemeDrag } from "../../hooks/useThemeDrag";
import { loadThemeLayout, type ThemeViewStorage } from "../../lib/themeStorage";
import {
  THEME_COLORS,
  UNIT_CARD_W,
  UNIT_CARD_H,
  CARD_GAP,
  GROUP_HEADER_H,
  GROUP_PADDING,
  CARDS_PER_ROW,
  GROUP_W,
  GROUP_COL_GAP,
  GROUP_ROW_GAP,
  CANVAS_PAD,
  getGroupHeight,
  type GroupKey,
  type GroupMeta,
} from "./themeViewConstants";

export interface ThemeViewProps {
  courseId: string;
  unitBoxes: UnitBoxType[];
  unitMappings: UnitMappings;
  existingTags: Tag[];
  getCLOColor: (cloId: number) => string;
  onUnitGroupChange: (unitKey: string, fromTag: Tag | null, toTag: Tag | null) => void;
  /** Ref kept up-to-date with current layout so the parent can persist it on save. */
  layoutRef?: React.MutableRefObject<ThemeViewStorage | null>;
}

function buildFreshLayout(
  unitBoxes: UnitBoxType[],
  unitMappings: UnitMappings,
  existingTags: Tag[]
): ThemeViewStorage {
  const groupUnits: Record<GroupKey, string[]> = {};
  for (const tag of existingTags) groupUnits[`tag-${tag.tagId}`] = [];

  const freeUnitKeys: string[] = [];
  for (const unit of unitBoxes) {
    const key = unit.unitId || unit.id.toString();
    const tags = unitMappings[key]?.tags || [];
    let addedToAny = false;
    for (const tag of tags) {
      const groupKey = `tag-${tag.tagId}`;
      if (groupUnits[groupKey] !== undefined) {
        groupUnits[groupKey].push(key);
        addedToAny = true;
      }
    }
    if (!addedToAny) freeUnitKeys.push(key);
  }

  const groupPositions: Record<GroupKey, { x: number; y: number }> = {};
  let col = 0, rowY = CANVAS_PAD, rowMaxH = 0;
  for (const tag of existingTags) {
    const key = `tag-${tag.tagId}`;
    const h = getGroupHeight(groupUnits[key]?.length || 0);
    groupPositions[key] = { x: CANVAS_PAD + col * (GROUP_W + GROUP_COL_GAP), y: rowY };
    rowMaxH = Math.max(rowMaxH, h);
    col++;
    if (col >= 2) { col = 0; rowY += rowMaxH + GROUP_ROW_GAP; rowMaxH = 0; }
  }

  const freeBaseY =
    Object.entries(groupPositions).reduce(
      (max, [key, pos]) => Math.max(max, pos.y + getGroupHeight(groupUnits[key]?.length || 0)),
      CANVAS_PAD
    ) + GROUP_ROW_GAP;

  const freeUnits: Record<string, { x: number; y: number }> = {};
  freeUnitKeys.forEach((key, i) => {
    freeUnits[key] = { x: CANVAS_PAD + i * (UNIT_CARD_W + CARD_GAP), y: freeBaseY };
  });

  return { groupUnits, freeUnits, groupPositions };
}

/** Merges saved layout with fresh layout — saved positions win; new tags get fresh positions. */
function mergeWithSaved(fresh: ThemeViewStorage, saved: ThemeViewStorage): ThemeViewStorage {
  const groupUnits = { ...fresh.groupUnits, ...saved.groupUnits };
  for (const key of Object.keys(fresh.groupUnits)) {
    if (!groupUnits[key]) groupUnits[key] = [];
  }
  const groupPositions = { ...saved.groupPositions };
  for (const [key, pos] of Object.entries(fresh.groupPositions)) {
    if (!groupPositions[key]) groupPositions[key] = pos;
  }
  return { groupUnits, freeUnits: saved.freeUnits, groupPositions };
}

/**
 * Theme View
 */
export const ThemeView: React.FC<ThemeViewProps> = ({
  courseId,
  unitBoxes,
  unitMappings,
  existingTags,
  onUnitGroupChange,
  layoutRef,
}) => {
  const groupMetas = useMemo<GroupMeta[]>(
    () => existingTags.map((tag, i) => ({ key: `tag-${tag.tagId}`, tag, colorIdx: i })),
    [existingTags]
  );

  // Compute initial state exactly once via a ref — avoids calling buildFreshLayout 3x
  const initRef = useRef<ThemeViewStorage | null>(null);
  if (initRef.current === null) {
    const fresh = buildFreshLayout(unitBoxes, unitMappings, existingTags);
    const saved = loadThemeLayout(courseId);
    initRef.current = saved ? mergeWithSaved(fresh, saved) : fresh;
  }

  const [groupUnits, setGroupUnits] = useState(initRef.current.groupUnits);
  const [freeUnits, setFreeUnits] = useState(initRef.current.freeUnits);
  const [groupPositions, setGroupPositions] = useState(initRef.current.groupPositions);

  // Sync when new tags are added
  useEffect(() => {
    setGroupUnits((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const tag of existingTags) {
        if (!next[`tag-${tag.tagId}`]) { next[`tag-${tag.tagId}`] = []; changed = true; }
      }
      return changed ? next : prev;
    });
    setGroupPositions((prev) => {
      const next = { ...prev };
      let changed = false;
      const fresh = buildFreshLayout(unitBoxes, unitMappings, existingTags);
      for (const tag of existingTags) {
        const key = `tag-${tag.tagId}`;
        if (!next[key]) { next[key] = fresh.groupPositions[key] ?? { x: CANVAS_PAD, y: CANVAS_PAD }; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [existingTags]);

  // Sync when new units are added to canvas
  useEffect(() => {
    const allGrouped = new Set(Object.values(groupUnits).flat());
    const newFree = unitBoxes
      .map((u) => u.unitId || u.id.toString())
      .filter((k) => !allGrouped.has(k) && !freeUnits[k]);
    if (newFree.length === 0) return;
    setFreeUnits((prev) => {
      const freeBaseY =
        Object.entries(groupPositions).reduce(
          (max, [key, pos]) => Math.max(max, pos.y + getGroupHeight(groupUnits[key]?.length || 0)),
          CANVAS_PAD
        ) + GROUP_ROW_GAP;
      const next = { ...prev };
      newFree.forEach((key, i) => {
        next[key] = { x: CANVAS_PAD + (Object.keys(prev).length + i) * (UNIT_CARD_W + CARD_GAP), y: freeBaseY };
      });
      return next;
    });
  }, [unitBoxes]);

  // Keep layoutRef in sync so the parent can persist on save
  useEffect(() => {
    if (layoutRef) layoutRef.current = { groupPositions, groupUnits, freeUnits };
  }, [layoutRef, groupPositions, groupUnits, freeUnits]);

  const containerRef = useRef<HTMLDivElement>(null);

  const { draggingUnit, ghostViewport, dropTarget, handleUnitMouseDown, handleGroupHeaderMouseDown, handleRemoveFromGroup } =
    useThemeDrag({
      groupMetas,
      groupUnits,
      groupPositions,
      containerRef,
      setGroupUnits,
      setFreeUnits,
      setGroupPositions,
      onUnitGroupChange,
    });

  const unitMap = useMemo(() => {
    const m = new Map<string, UnitBoxType>();
    for (const u of unitBoxes) m.set(u.unitId || u.id.toString(), u);
    return m;
  }, [unitBoxes]);

  const canvasSize = useMemo(() => {
    let maxX = 800, maxY = 600;
    for (const gm of groupMetas) {
      const pos = groupPositions[gm.key];
      if (!pos) continue;
      const rows = Math.max(1, Math.ceil((groupUnits[gm.key]?.length || 0) / CARDS_PER_ROW));
      const estimatedH = GROUP_HEADER_H + GROUP_PADDING + rows * (UNIT_CARD_H + CARD_GAP) + CANVAS_PAD;
      maxX = Math.max(maxX, pos.x + GROUP_W + CANVAS_PAD);
      maxY = Math.max(maxY, pos.y + estimatedH);
    }
    for (const pos of Object.values(freeUnits)) {
      maxX = Math.max(maxX, pos.x + UNIT_CARD_W + CANVAS_PAD);
      maxY = Math.max(maxY, pos.y + UNIT_CARD_H + CANVAS_PAD);
    }
    return { width: maxX, height: maxY };
  }, [groupPositions, groupUnits, freeUnits, groupMetas]);

  if (unitBoxes.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No units on canvas</p>
          <p className="text-sm mt-1">Add units and assign tags to see theme groupings</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{ width: canvasSize.width, height: canvasSize.height, cursor: draggingUnit ? "grabbing" : "default" }}
    >
      {/* Theme groups */}
      {groupMetas.map((gm) => {
        const pos = groupPositions[gm.key];
        if (!pos) return null;
        const colors = THEME_COLORS[gm.colorIdx % THEME_COLORS.length];
        const unitKeys = groupUnits[gm.key] || [];
        const units = unitKeys.map((k) => unitMap.get(k)).filter(Boolean) as UnitBoxType[];
        const isDropTarget = dropTarget === gm.key && !unitKeys.includes(draggingUnit?.unitKey ?? "");

        return (
          <div
            id={`theme-group-${gm.key}`}
            key={gm.key}
            className="absolute rounded-2xl border-2"
            style={{
              left: pos.x,
              top: pos.y,
              width: GROUP_W,
              backgroundColor: colors.bg,
              borderColor: isDropTarget ? colors.label : colors.border,
              borderStyle: isDropTarget ? "dashed" : "solid",
              boxShadow: isDropTarget ? `0 0 0 3px ${colors.border}44` : undefined,
              transition: "border-color 0.1s, box-shadow 0.1s",
            }}
          >
            {/* Drag handle header */}
            <div
              className="flex items-center gap-2 px-4 rounded-t-2xl cursor-grab active:cursor-grabbing"
              style={{ height: GROUP_HEADER_H, backgroundColor: colors.border + "55" }}
              onMouseDown={(e) => handleGroupHeaderMouseDown(e, gm.key)}
            >
              <svg className="w-3 h-3 flex-shrink-0 opacity-50" viewBox="0 0 12 12" fill="none" style={{ color: colors.label }}>
                <circle cx="3.5" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="8.5" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="3.5" cy="8.5" r="1.2" fill="currentColor" />
                <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
              </svg>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.text }} />
              <h3 className="text-sm font-bold tracking-wide flex-1 truncate" style={{ color: colors.label }}>
                {gm.tag.tagName}
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors.border + "66", color: colors.text }}>
                {units.length}
              </span>
            </div>

            {/* Unit cards */}
            <div className="flex flex-wrap px-4 pt-2 pb-3" style={{ gap: CARD_GAP }}>
              {units.map((unit) => {
                const unitKey = unit.unitId || unit.id.toString();
                return (
                  <div
                    key={unit.id}
                    className="relative bg-white rounded-lg border shadow-sm overflow-hidden cursor-grab hover:shadow-md group/card"
                    style={{
                      width: UNIT_CARD_W,
                      height: UNIT_CARD_H,
                      opacity: draggingUnit?.unitKey === unitKey && draggingUnit?.fromGroup === gm.key ? 0.2 : 1,
                      transition: "opacity 0.1s",
                    }}
                    onMouseDown={(e) => handleUnitMouseDown(e, unitKey, gm.key)}
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: unit.color || "#3B82F6" }} />
                    <div className="px-3 py-1.5">
                      <div className="text-[11px] font-bold text-blue-600 truncate">{unit.unitId || unit.name}</div>
                      <div className="text-xs font-medium text-gray-800 truncate leading-tight">{unit.name}</div>
                      {unit.credits && <div className="text-[10px] text-gray-400 mt-0.5">{unit.credits} cr</div>}
                    </div>
                    <button
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-200 hover:bg-red-400 hover:text-white text-gray-500 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleRemoveFromGroup(e, unitKey, gm.key)}
                      title="Remove from this theme"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {units.length === 0 && (
                <div
                  className="flex items-center justify-center rounded-lg border-2 border-dashed text-xs italic"
                  style={{ width: "100%", height: UNIT_CARD_H, borderColor: colors.border, color: colors.text, opacity: 0.6 }}
                >
                  Drop units here
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Free-floating units (no theme assigned) */}
      {Object.entries(freeUnits).map(([unitKey, pos]) => {
        const unit = unitMap.get(unitKey);
        if (!unit) return null;
        return (
          <div
            key={unitKey}
            className="absolute bg-white rounded-lg border shadow-sm overflow-hidden cursor-grab hover:shadow-md transition-shadow"
            style={{
              left: pos.x,
              top: pos.y,
              width: UNIT_CARD_W,
              height: UNIT_CARD_H,
              opacity: draggingUnit?.unitKey === unitKey ? 0.2 : 1,
              transition: "opacity 0.1s",
            }}
            onMouseDown={(e) => handleUnitMouseDown(e, unitKey, null)}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: unit.color || "#3B82F6" }} />
            <div className="px-3 py-1.5">
              <div className="text-[11px] font-bold text-blue-600 truncate">{unit.unitId || unit.name}</div>
              <div className="text-xs font-medium text-gray-800 truncate leading-tight">{unit.name}</div>
              {unit.credits && <div className="text-[10px] text-gray-400 mt-0.5">{unit.credits} cr</div>}
            </div>
          </div>
        );
      })}

      {/* Ghost card */}
      {draggingUnit && ghostViewport && (() => {
        const unit = unitMap.get(draggingUnit.unitKey);
        if (!unit) return null;
        return (
          <div
            className="bg-white rounded-lg border-2 border-blue-400 shadow-2xl overflow-hidden pointer-events-none"
            style={{
              position: "fixed",
              left: ghostViewport.x - UNIT_CARD_W / 2,
              top: ghostViewport.y - UNIT_CARD_H / 2,
              width: UNIT_CARD_W,
              height: UNIT_CARD_H,
              zIndex: 9999,
              transform: "rotate(2deg) scale(1.06)",
            }}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: unit.color || "#3B82F6" }} />
            <div className="px-3 py-1.5">
              <div className="text-[11px] font-bold text-blue-600 truncate">{unit.unitId || unit.name}</div>
              <div className="text-xs font-medium text-gray-800 truncate leading-tight">{unit.name}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
