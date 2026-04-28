import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Tag, UnitBox as UnitBoxType, UnitMappings } from "../../types";
import { useThemeDrag } from "../../hooks/useThemeDrag";
import { loadThemeLayout, type ThemeViewStorage, type ThemeCategory } from "../../lib/themeStorage";
import { useTagStore } from "../../stores/useTagStore";
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
  CATEGORY_HEADER_H,
  CATEGORY_PAD,
  CATEGORY_BAND_GAP,
  CATEGORY_W,
  CATEGORY_COLOR,
  getGroupHeight,
  getCategoryHeight,
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

  return { groupUnits, freeUnits, groupPositions, categories: [] };
}

function mergeWithSaved(fresh: ThemeViewStorage, saved: ThemeViewStorage): ThemeViewStorage {
  const groupUnits = { ...fresh.groupUnits, ...saved.groupUnits };
  for (const key of Object.keys(fresh.groupUnits)) {
    if (!groupUnits[key]) groupUnits[key] = [];
  }
  const groupPositions = { ...saved.groupPositions };
  for (const [key, pos] of Object.entries(fresh.groupPositions)) {
    if (!groupPositions[key]) groupPositions[key] = pos;
  }
  return {
    groupUnits,
    freeUnits: saved.freeUnits,
    groupPositions,
    categories: saved.categories ?? [],
  };
}

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

  const initRef = useRef<ThemeViewStorage | null>(null);
  if (initRef.current === null) {
    const fresh = buildFreshLayout(unitBoxes, unitMappings, existingTags);
    const saved = loadThemeLayout(courseId);
    initRef.current = saved ? mergeWithSaved(fresh, saved) : fresh;
  }

  const [groupUnits, setGroupUnits] = useState(initRef.current.groupUnits);
  const [freeUnits, setFreeUnits] = useState(initRef.current.freeUnits);
  const [groupPositions, setGroupPositions] = useState(initRef.current.groupPositions);
  const [categories, setCategories] = useState<ThemeCategory[]>(initRef.current.categories ?? []);

  const deleteTagFromStore = useTagStore((s) => s.deleteTag);
  const updateTagInStore = useTagStore((s) => s.updateTag);

  // Map: tagId -> categoryId for fast lookup
  const tagToCategory = useMemo(() => {
    const m = new Map<number, string>();
    for (const cat of categories) for (const tagId of cat.tagIds) m.set(tagId, cat.id);
    return m;
  }, [categories]);

  // Derived nested positions: tags inside a category get their position from the category layout,
  // overriding any free-floating groupPositions entry.
  const nestedPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const cat of categories) {
      let yOffset = CATEGORY_HEADER_H + CATEGORY_PAD;
      for (const tagId of cat.tagIds) {
        const key = `tag-${tagId}`;
        positions[key] = {
          x: cat.position.x + CATEGORY_PAD,
          y: cat.position.y + yOffset,
        };
        yOffset += getGroupHeight(groupUnits[key]?.length || 0) + CATEGORY_BAND_GAP;
      }
    }
    return positions;
  }, [categories, groupUnits]);

  const handleDeleteTag = async (tagId: number, groupKey: string) => {
    if (!confirm("Delete this theme? This will remove the theme and unassign its units.")) return;
    const removedUnits = groupUnits[groupKey] || [];

    setGroupUnits((prev) => { const n = { ...prev }; delete n[groupKey]; return n; });
    setGroupPositions((prev) => { const n = { ...prev }; delete n[groupKey]; return n; });
    setCategories((prev) => prev.map((c) => ({ ...c, tagIds: c.tagIds.filter((t) => t !== tagId) })));

    setFreeUnits((prev) => {
      const next = { ...prev };
      const freeBaseY =
        Object.entries(groupPositions).reduce(
          (max, [key, pos]) => Math.max(max, pos.y + getGroupHeight(groupUnits[key]?.length || 0)),
          CANVAS_PAD
        ) + GROUP_ROW_GAP;
      const startIdx = Object.keys(prev).length;
      removedUnits.forEach((key, i) => {
        next[key] = { x: CANVAS_PAD + (startIdx + i) * (UNIT_CARD_W + CARD_GAP), y: freeBaseY };
      });
      return next;
    });

    try {
      await deleteTagFromStore(tagId);
    } catch (err) {
      console.error("Failed to delete tag", err);
    }
  };

  const handleEditTag = async (tagId: number) => {
    const newName = prompt("Enter new theme name:");
    if (!newName || newName.trim().length === 0) return;
    try {
      await updateTagInStore(tagId, newName.trim());
    } catch (err) {
      console.error("Failed to update tag", err);
    }
  };

  // Category CRUD
  const handleAddCategory = () => {
    const name = prompt("Category name (e.g. Specialist Core):");
    if (!name || name.trim().length === 0) return;
    const indexLabel = prompt("Index label (e.g. 1, 2, 3):", String(categories.length + 1)) ?? String(categories.length + 1);
    const baseY =
      categories.reduce(
        (max, c) => Math.max(max, c.position.y + getCategoryHeight(c.tagIds.map((t) => groupUnits[`tag-${t}`]?.length || 0))),
        CANVAS_PAD
      ) + GROUP_ROW_GAP;
    const newCat: ThemeCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      indexLabel: indexLabel.trim() || String(categories.length + 1),
      position: { x: CANVAS_PAD, y: baseY },
      tagIds: [],
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleEditCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const newName = prompt("Category name:", cat.name);
    if (newName === null) return;
    const newIndex = prompt("Index label:", cat.indexLabel);
    if (newIndex === null) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, name: newName.trim() || c.name, indexLabel: newIndex.trim() || c.indexLabel }
          : c
      )
    );
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm("Delete this category? Nested themes will become free-floating.")) return;
    // Place unnested tags at the category's previous position
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setGroupPositions((prev) => {
        const next = { ...prev };
        let yOffset = 0;
        for (const tagId of cat.tagIds) {
          const key = `tag-${tagId}`;
          next[key] = { x: cat.position.x, y: cat.position.y + yOffset };
          yOffset += getGroupHeight(groupUnits[key]?.length || 0) + GROUP_ROW_GAP;
        }
        return next;
      });
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // Sync when tags change (additions or removals)
  useEffect(() => {
    setGroupUnits((prev) => {
      const next = { ...prev };
      let changed = false;
      const currentKeys = new Set(existingTags.map((t) => `tag-${t.tagId}`));

      for (const tag of existingTags) {
        const key = `tag-${tag.tagId}`;
        if (!next[key]) { next[key] = []; changed = true; }
      }

      for (const key of Object.keys(next)) {
        if (key.startsWith("tag-") && !currentKeys.has(key)) {
          delete next[key];
          changed = true;
        }
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

      const currentKeys = new Set(existingTags.map((t) => `tag-${t.tagId}`));
      for (const key of Object.keys(next)) {
        if (key.startsWith("tag-") && !currentKeys.has(key)) {
          delete next[key];
          changed = true;
        }
      }

      return changed ? next : prev;
    });

    // Drop deleted tags from categories
    setCategories((prev) => {
      const validIds = new Set(existingTags.map((t) => t.tagId));
      let changed = false;
      const next = prev.map((c) => {
        const filtered = c.tagIds.filter((t) => validIds.has(t));
        if (filtered.length !== c.tagIds.length) changed = true;
        return changed ? { ...c, tagIds: filtered } : c;
      });
      return changed ? next : prev;
    });

    setFreeUnits((prev) => {
      const next = { ...prev };
      const allGrouped = new Set(Object.values(groupUnits).flat());
      const missing = unitBoxes.map((u) => u.unitId || u.id.toString()).filter((k) => !allGrouped.has(k) && !next[k]);
      if (missing.length === 0) return prev;
      const freeBaseY =
        Object.entries(groupPositions).reduce(
          (max, [key, pos]) => Math.max(max, pos.y + getGroupHeight(groupUnits[key]?.length || 0)),
          CANVAS_PAD
        ) + GROUP_ROW_GAP;
      const startIdx = Object.keys(prev).length;
      missing.forEach((key, i) => {
        next[key] = { x: CANVAS_PAD + (startIdx + i) * (UNIT_CARD_W + CARD_GAP), y: freeBaseY };
      });
      return next;
    });
  }, [existingTags]);

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

  useEffect(() => {
    if (layoutRef) layoutRef.current = { groupPositions, groupUnits, freeUnits, categories };
  }, [layoutRef, groupPositions, groupUnits, freeUnits, categories]);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    draggingUnit,
    draggingTagKey,
    ghostViewport,
    dropTarget,
    categoryDropTarget,
    handleUnitMouseDown,
    handleGroupHeaderMouseDown,
    handleCategoryHeaderMouseDown,
    handleRemoveFromGroup,
  } = useThemeDrag({
    groupMetas,
    groupUnits,
    groupPositions,
    categories,
    containerRef,
    setGroupUnits,
    setFreeUnits,
    setGroupPositions,
    setCategories,
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
      const pos = nestedPositions[gm.key] ?? groupPositions[gm.key];
      if (!pos) continue;
      const rows = Math.max(1, Math.ceil((groupUnits[gm.key]?.length || 0) / CARDS_PER_ROW));
      const estimatedH = GROUP_HEADER_H + GROUP_PADDING + rows * (UNIT_CARD_H + CARD_GAP) + CANVAS_PAD;
      maxX = Math.max(maxX, pos.x + GROUP_W + CANVAS_PAD);
      maxY = Math.max(maxY, pos.y + estimatedH);
    }
    for (const cat of categories) {
      const h = getCategoryHeight(cat.tagIds.map((t) => groupUnits[`tag-${t}`]?.length || 0));
      maxX = Math.max(maxX, cat.position.x + CATEGORY_W + CANVAS_PAD);
      maxY = Math.max(maxY, cat.position.y + h + CANVAS_PAD);
    }
    for (const pos of Object.values(freeUnits)) {
      maxX = Math.max(maxX, pos.x + UNIT_CARD_W + CANVAS_PAD);
      maxY = Math.max(maxY, pos.y + UNIT_CARD_H + CANVAS_PAD);
    }
    return { width: maxX, height: maxY };
  }, [groupPositions, nestedPositions, groupUnits, freeUnits, groupMetas, categories]);

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
      {/* Toolbar */}
      <div className="sticky top-2 left-2 z-50 inline-flex" style={{ position: "absolute", top: 8, left: 8 }}>
        <button
          className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-100 rounded-md hover:bg-slate-700 border border-slate-600 shadow"
          onClick={handleAddCategory}
        >
          + Add Category
        </button>
      </div>

      {/* Categories (outer wrappers) */}
      {categories.map((cat) => {
        const h = getCategoryHeight(cat.tagIds.map((t) => groupUnits[`tag-${t}`]?.length || 0));
        const isDropTarget = categoryDropTarget === cat.id;
        return (
          <div
            id={`theme-category-${cat.id}`}
            key={cat.id}
            className="absolute rounded-2xl border-2"
            style={{
              left: cat.position.x,
              top: cat.position.y,
              width: CATEGORY_W,
              height: h,
              backgroundColor: CATEGORY_COLOR.bg,
              borderColor: isDropTarget ? "#60A5FA" : CATEGORY_COLOR.border,
              borderStyle: isDropTarget ? "dashed" : "solid",
              boxShadow: isDropTarget ? "0 0 0 3px #60A5FA44" : undefined,
              transition: "border-color 0.1s, box-shadow 0.1s",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 cursor-grab active:cursor-grabbing rounded-t-2xl"
              style={{ height: CATEGORY_HEADER_H, backgroundColor: CATEGORY_COLOR.header }}
              onMouseDown={(e) => handleCategoryHeaderMouseDown(e, cat.id)}
            >
              <span
                className="text-sm font-bold px-2 py-0.5 rounded"
                style={{ color: CATEGORY_COLOR.label, backgroundColor: "#0F172A88" }}
              >
                {cat.indexLabel}
              </span>
              <h3 className="text-sm font-semibold flex-1 text-center truncate" style={{ color: CATEGORY_COLOR.text }}>
                {cat.name}
              </h3>
              <button
                className="text-xs text-slate-300 hover:text-white p-1"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleEditCategory(cat.id); }}
                title="Edit category"
              >
                Edit
              </button>
              <button
                className="text-xs text-red-300 hover:text-red-100 p-1"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                title="Delete category"
              >
                ✖
              </button>
            </div>
            {cat.tagIds.length === 0 && (
              <div
                className="absolute inset-x-4 flex items-center justify-center text-xs italic rounded-lg border-2 border-dashed"
                style={{
                  top: CATEGORY_HEADER_H + CATEGORY_PAD,
                  bottom: CATEGORY_PAD,
                  borderColor: CATEGORY_COLOR.border,
                  color: CATEGORY_COLOR.label,
                }}
              >
                Drag a theme here to nest it
              </div>
            )}
          </div>
        );
      })}

      {/* Theme groups (rendered after categories so they sit on top) */}
      {groupMetas.map((gm) => {
        const nested = nestedPositions[gm.key];
        const pos = nested ?? groupPositions[gm.key];
        if (!pos) return null;
        const colors = THEME_COLORS[gm.colorIdx % THEME_COLORS.length];
        const unitKeys = groupUnits[gm.key] || [];
        const units = unitKeys.map((k) => unitMap.get(k)).filter(Boolean) as UnitBoxType[];
        const isDropTarget = dropTarget === gm.key && !unitKeys.includes(draggingUnit?.unitKey ?? "");
        const isDraggingThis = draggingTagKey === gm.key;

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
              opacity: isDraggingThis ? 0.85 : 1,
              zIndex: isDraggingThis ? 100 : nested ? 10 : 1,
              transition: isDraggingThis ? "none" : "border-color 0.1s, box-shadow 0.1s",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 rounded-t-2xl cursor-grab active:cursor-grabbing"
              style={{ height: GROUP_HEADER_H, backgroundColor: colors.border + "55" }}
              onMouseDown={(e) => handleGroupHeaderMouseDown(e, gm.key, pos)}
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
              <button
                className="ml-2 text-yellow-600 hover:text-gray-800 p-1 rounded"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleEditTag(gm.tag.tagId); }}
                title="Edit theme"
              >
                Edit
              </button>
              <button
                className="ml-2 text-red-600 hover:text-red-800 p-1 rounded"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleDeleteTag(gm.tag.tagId, gm.key); }}
                title="Delete theme"
              >
                ✖
              </button>
            </div>

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
