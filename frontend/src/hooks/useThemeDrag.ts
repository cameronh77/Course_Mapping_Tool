import { useState, useRef, useEffect, useCallback } from "react";
import type React from "react";
import type { Tag } from "../types";
import {
  type GroupKey,
  type GroupMeta,
  UNIT_CARD_W,
  UNIT_CARD_H,
  CARD_GAP,
  CANVAS_PAD,
  GROUP_ROW_GAP,
  getGroupHeight,
} from "../components/common/themeViewConstants";
import type { ThemeCategory } from "../lib/themeStorage";

interface UseThemeDragOptions {
  groupMetas: GroupMeta[];
  groupUnits: Record<GroupKey, string[]>;
  groupPositions: Record<GroupKey, { x: number; y: number }>;
  categories: ThemeCategory[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  setGroupUnits: React.Dispatch<React.SetStateAction<Record<GroupKey, string[]>>>;
  setFreeUnits: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>;
  setGroupPositions: React.Dispatch<React.SetStateAction<Record<GroupKey, { x: number; y: number }>>>;
  /** Optimistic local setter for categories (e.g. zustand setLocal). */
  setCategoriesLocal: (updater: (prev: ThemeCategory[]) => ThemeCategory[]) => void;
  /** Called once at the end of a category drag with the final position. */
  onCategoryMoveCommit: (categoryId: number, position: { x: number; y: number }) => void;
  /** Called once at the end of a tag drag with each affected category's new tagIds. */
  onTagNestingCommit: (changes: { categoryId: number; tagIds: number[] }[]) => void;
  onUnitGroupChange: (unitKey: string, fromTag: Tag | null, toTag: Tag | null) => void;
}

export interface UseThemeDragResult {
  draggingUnit: { unitKey: string; fromGroup: GroupKey | null } | null;
  draggingTagKey: GroupKey | null;
  draggingCategoryId: number | null;
  ghostViewport: { x: number; y: number } | null;
  dropTarget: GroupKey | null;
  categoryDropTarget: number | null;
  handleUnitMouseDown: (e: React.MouseEvent, unitKey: string, fromGroup: GroupKey | null) => void;
  handleGroupHeaderMouseDown: (e: React.MouseEvent, groupKey: GroupKey, seedPos?: { x: number; y: number }) => void;
  handleCategoryHeaderMouseDown: (e: React.MouseEvent, categoryId: number) => void;
  handleRemoveFromGroup: (e: React.MouseEvent, unitKey: string, groupKey: GroupKey) => void;
}

export function useThemeDrag({
  groupMetas,
  groupUnits,
  groupPositions,
  categories,
  containerRef,
  setGroupUnits,
  setFreeUnits,
  setGroupPositions,
  setCategoriesLocal,
  onCategoryMoveCommit,
  onTagNestingCommit,
  onUnitGroupChange,
}: UseThemeDragOptions): UseThemeDragResult {
  const [draggingUnit, setDraggingUnit] = useState<{ unitKey: string; fromGroup: GroupKey | null } | null>(null);
  const [draggingTagKey, setDraggingTagKey] = useState<GroupKey | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<number | null>(null);
  const [ghostViewport, setGhostViewport] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<GroupKey | null>(null);
  const [categoryDropTarget, setCategoryDropTarget] = useState<number | null>(null);

  const draggingUnitRef = useRef<{ unitKey: string; fromGroup: GroupKey | null } | null>(null);
  const draggingGroupRef = useRef<{
    groupKey: GroupKey;
    originX: number;
    originY: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);
  const draggingCategoryRef = useRef<{
    categoryId: number;
    originX: number;
    originY: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const groupUnitsRef = useRef(groupUnits);
  const groupMetasRef = useRef(groupMetas);
  const groupPositionsRef = useRef(groupPositions);
  const categoriesRef = useRef(categories);
  useEffect(() => { groupUnitsRef.current = groupUnits; }, [groupUnits]);
  useEffect(() => { groupMetasRef.current = groupMetas; }, [groupMetas]);
  useEffect(() => { groupPositionsRef.current = groupPositions; }, [groupPositions]);
  useEffect(() => { categoriesRef.current = categories; }, [categories]);

  const findDropTarget = useCallback((clientX: number, clientY: number): GroupKey | null => {
    for (const gm of groupMetasRef.current) {
      const el = document.getElementById(`theme-group-${gm.key}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return gm.key;
      }
    }
    return null;
  }, []);

  const findCategoryDropTarget = useCallback((clientX: number, clientY: number): number | null => {
    for (const cat of categoriesRef.current) {
      const el = document.getElementById(`theme-category-${cat.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return cat.id;
      }
    }
    return null;
  }, []);

  /** Where (in tagIds order, after the dragged tag is removed) should the dragged tag be inserted? */
  const computeInsertIndex = useCallback(
    (categoryId: number, draggedTagId: number, mouseY: number): number => {
      const cat = categoriesRef.current.find((c) => c.id === categoryId);
      if (!cat) return 0;
      let idx = 0;
      for (const tagId of cat.tagIds) {
        if (tagId === draggedTagId) continue;
        const el = document.getElementById(`theme-group-tag-${tagId}`);
        if (!el) { idx++; continue; }
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (mouseY < mid) return idx;
        idx++;
      }
      return idx;
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggingUnitRef.current) {
        setGhostViewport({ x: e.clientX, y: e.clientY });
        setDropTarget(findDropTarget(e.clientX, e.clientY));
      }
      if (draggingGroupRef.current) {
        const dg = draggingGroupRef.current;
        setGroupPositions((prev) => ({
          ...prev,
          [dg.groupKey]: {
            x: Math.max(0, dg.originX + e.clientX - dg.startMouseX),
            y: Math.max(0, dg.originY + e.clientY - dg.startMouseY),
          },
        }));
        setCategoryDropTarget(findCategoryDropTarget(e.clientX, e.clientY));
      }
      if (draggingCategoryRef.current) {
        const dc = draggingCategoryRef.current;
        const newX = Math.max(0, dc.originX + e.clientX - dc.startMouseX);
        const newY = Math.max(0, dc.originY + e.clientY - dc.startMouseY);
        setCategoriesLocal((prev) =>
          prev.map((c) => (c.id === dc.categoryId ? { ...c, position: { x: newX, y: newY } } : c))
        );
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (draggingUnitRef.current) {
        const { unitKey, fromGroup } = draggingUnitRef.current;
        const target = findDropTarget(e.clientX, e.clientY);

        if (target && target !== fromGroup) {
          const alreadyInTarget = groupUnitsRef.current[target]?.includes(unitKey);
          if (!alreadyInTarget) {
            const toTag = groupMetasRef.current.find((g) => g.key === target)?.tag ?? null;
            setGroupUnits((prev) => ({ ...prev, [target]: [...(prev[target] || []), unitKey] }));
            if (fromGroup === null) {
              setFreeUnits((prev) => { const n = { ...prev }; delete n[unitKey]; return n; });
            }
            onUnitGroupChange(unitKey, null, toTag);
          }
        } else if (!target && fromGroup) {
          const newGroupUnits = { ...groupUnitsRef.current };
          newGroupUnits[fromGroup] = newGroupUnits[fromGroup].filter((k) => k !== unitKey);
          const inAnyGroup = Object.values(newGroupUnits).some((units) => units.includes(unitKey));
          setGroupUnits(newGroupUnits);
          if (!inAnyGroup) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setFreeUnits((prev) => ({
                ...prev,
                [unitKey]: { x: e.clientX - rect.left - UNIT_CARD_W / 2, y: e.clientY - rect.top - UNIT_CARD_H / 2 },
              }));
            }
          }
          const fromTag = groupMetasRef.current.find((g) => g.key === fromGroup)?.tag ?? null;
          onUnitGroupChange(unitKey, fromTag, null);
        } else if (!target && fromGroup === null) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setFreeUnits((prev) => ({
              ...prev,
              [unitKey]: { x: e.clientX - rect.left - UNIT_CARD_W / 2, y: e.clientY - rect.top - UNIT_CARD_H / 2 },
            }));
          }
        }

        draggingUnitRef.current = null;
        setDraggingUnit(null);
        setGhostViewport(null);
        setDropTarget(null);
      }

      if (draggingGroupRef.current) {
        const { groupKey } = draggingGroupRef.current;
        const tagIdNum = Number(groupKey.replace(/^tag-/, ""));
        const targetCatId = findCategoryDropTarget(e.clientX, e.clientY);
        const prevCat = categoriesRef.current.find((c) => c.tagIds.includes(tagIdNum));
        const prevCatId = prevCat?.id ?? null;

        const affected: { categoryId: number; tagIds: number[] }[] = [];
        const noChange =
          targetCatId === prevCatId &&
          (targetCatId == null ||
            // same-category drop: still recompute index — only "no change" if order would be identical
            false);

        if (!noChange) {
          // Compute new tagIds for affected categories
          let removedFromPrev: ThemeCategory | null = null;
          let updatedTarget: ThemeCategory | null = null;

          setCategoriesLocal((prev) => {
            // First pass: remove dragged tag from any category
            let next = prev.map((c) => {
              if (!c.tagIds.includes(tagIdNum)) return c;
              const filtered = { ...c, tagIds: c.tagIds.filter((t) => t !== tagIdNum) };
              if (c.id === prevCatId) removedFromPrev = filtered;
              return filtered;
            });

            // Second pass: insert into target at computed index (if there is a target)
            if (targetCatId != null) {
              next = next.map((c) => {
                if (c.id !== targetCatId) return c;
                const insertIdx = computeInsertIndex(targetCatId, tagIdNum, e.clientY);
                const tagIds = [...c.tagIds];
                tagIds.splice(insertIdx, 0, tagIdNum);
                const updated = { ...c, tagIds };
                updatedTarget = updated;
                return updated;
              });
            }

            return next;
          });

          if (prevCatId != null && prevCatId !== targetCatId && removedFromPrev) {
            affected.push({ categoryId: prevCatId, tagIds: (removedFromPrev as ThemeCategory).tagIds });
          }
          if (targetCatId != null && updatedTarget) {
            affected.push({ categoryId: targetCatId, tagIds: (updatedTarget as ThemeCategory).tagIds });
          }
          if (affected.length > 0) onTagNestingCommit(affected);
        }

        draggingGroupRef.current = null;
        setDraggingTagKey(null);
        setCategoryDropTarget(null);
      }

      if (draggingCategoryRef.current) {
        const { categoryId } = draggingCategoryRef.current;
        const cat = categoriesRef.current.find((c) => c.id === categoryId);
        if (cat) onCategoryMoveCommit(categoryId, cat.position);
        draggingCategoryRef.current = null;
        setDraggingCategoryId(null);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [
    findDropTarget,
    findCategoryDropTarget,
    computeInsertIndex,
    containerRef,
    onUnitGroupChange,
    onCategoryMoveCommit,
    onTagNestingCommit,
    setGroupUnits,
    setFreeUnits,
    setGroupPositions,
    setCategoriesLocal,
  ]);

  const handleUnitMouseDown = useCallback(
    (e: React.MouseEvent, unitKey: string, fromGroup: GroupKey | null) => {
      e.preventDefault();
      e.stopPropagation();
      draggingUnitRef.current = { unitKey, fromGroup };
      setDraggingUnit({ unitKey, fromGroup });
      setGhostViewport({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleGroupHeaderMouseDown = useCallback(
    (e: React.MouseEvent, groupKey: GroupKey, seedPos?: { x: number; y: number }) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = seedPos ?? groupPositionsRef.current[groupKey];
      if (!pos) return;
      if (seedPos) {
        setGroupPositions((prev) => ({ ...prev, [groupKey]: seedPos }));
      }
      draggingGroupRef.current = {
        groupKey,
        originX: pos.x,
        originY: pos.y,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      };
      setDraggingTagKey(groupKey);
    },
    [setGroupPositions]
  );

  const handleCategoryHeaderMouseDown = useCallback(
    (e: React.MouseEvent, categoryId: number) => {
      e.preventDefault();
      e.stopPropagation();
      const cat = categoriesRef.current.find((c) => c.id === categoryId);
      if (!cat) return;
      draggingCategoryRef.current = {
        categoryId,
        originX: cat.position.x,
        originY: cat.position.y,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      };
      setDraggingCategoryId(categoryId);
    },
    []
  );

  const handleRemoveFromGroup = useCallback(
    (e: React.MouseEvent, unitKey: string, groupKey: GroupKey) => {
      e.stopPropagation();
      const fromTag = groupMetasRef.current.find((g) => g.key === groupKey)?.tag ?? null;
      const newGroupUnits = { ...groupUnitsRef.current };
      newGroupUnits[groupKey] = newGroupUnits[groupKey].filter((k) => k !== unitKey);
      const inAnyGroup = Object.values(newGroupUnits).some((units) => units.includes(unitKey));
      setGroupUnits(newGroupUnits);
      if (!inAnyGroup) {
        const freeBaseY =
          Object.entries(groupPositionsRef.current).reduce(
            (max, [key, pos]) => Math.max(max, pos.y + getGroupHeight(newGroupUnits[key]?.length || 0)),
            CANVAS_PAD
          ) + GROUP_ROW_GAP;
        setFreeUnits((prev) => ({
          ...prev,
          [unitKey]: { x: CANVAS_PAD + Object.keys(prev).length * (UNIT_CARD_W + CARD_GAP), y: freeBaseY },
        }));
      }
      onUnitGroupChange(unitKey, fromTag, null);
    },
    [onUnitGroupChange, setGroupUnits, setFreeUnits]
  );

  return {
    draggingUnit,
    draggingTagKey,
    draggingCategoryId,
    ghostViewport,
    dropTarget,
    categoryDropTarget,
    handleUnitMouseDown,
    handleGroupHeaderMouseDown,
    handleCategoryHeaderMouseDown,
    handleRemoveFromGroup,
  };
}
