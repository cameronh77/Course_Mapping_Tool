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

interface UseThemeDragOptions {
  groupMetas: GroupMeta[];
  groupUnits: Record<GroupKey, string[]>;
  groupPositions: Record<GroupKey, { x: number; y: number }>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setGroupUnits: React.Dispatch<React.SetStateAction<Record<GroupKey, string[]>>>;
  setFreeUnits: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>;
  setGroupPositions: React.Dispatch<React.SetStateAction<Record<GroupKey, { x: number; y: number }>>>;
  onUnitGroupChange: (unitKey: string, fromTag: Tag | null, toTag: Tag | null) => void;
}

export interface UseThemeDragResult {
  draggingUnit: { unitKey: string; fromGroup: GroupKey | null } | null;
  ghostViewport: { x: number; y: number } | null;
  dropTarget: GroupKey | null;
  handleUnitMouseDown: (e: React.MouseEvent, unitKey: string, fromGroup: GroupKey | null) => void;
  handleGroupHeaderMouseDown: (e: React.MouseEvent, groupKey: GroupKey) => void;
  handleRemoveFromGroup: (e: React.MouseEvent, unitKey: string, groupKey: GroupKey) => void;
}

export function useThemeDrag({
  groupMetas,
  groupUnits,
  groupPositions,
  containerRef,
  setGroupUnits,
  setFreeUnits,
  setGroupPositions,
  onUnitGroupChange,
}: UseThemeDragOptions): UseThemeDragResult {
  const [draggingUnit, setDraggingUnit] = useState<{ unitKey: string; fromGroup: GroupKey | null } | null>(null);
  const [ghostViewport, setGhostViewport] = useState<{ x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<GroupKey | null>(null);

  const draggingUnitRef = useRef<{ unitKey: string; fromGroup: GroupKey | null } | null>(null);
  const draggingGroupRef = useRef<{
    groupKey: GroupKey;
    originX: number;
    originY: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  // Stable refs so event handlers always read current values without stale closures
  const groupUnitsRef = useRef(groupUnits);
  const groupMetasRef = useRef(groupMetas);
  const groupPositionsRef = useRef(groupPositions);
  useEffect(() => { groupUnitsRef.current = groupUnits; }, [groupUnits]);
  useEffect(() => { groupMetasRef.current = groupMetas; }, [groupMetas]);
  useEffect(() => { groupPositionsRef.current = groupPositions; }, [groupPositions]);

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
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (draggingUnitRef.current) {
        const { unitKey, fromGroup } = draggingUnitRef.current;
        const target = findDropTarget(e.clientX, e.clientY);

        if (target && target !== fromGroup) {
          // Drop on a group — add unit (stays in all other groups too)
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
          // Drop on empty canvas — remove from this group only
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
          // Free unit dropped on canvas — reposition
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
        draggingGroupRef.current = null;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [findDropTarget, containerRef, onUnitGroupChange, setGroupUnits, setFreeUnits, setGroupPositions]);

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

  const handleGroupHeaderMouseDown = useCallback((e: React.MouseEvent, groupKey: GroupKey) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = groupPositionsRef.current[groupKey];
    if (!pos) return;
    draggingGroupRef.current = {
      groupKey,
      originX: pos.x,
      originY: pos.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    };
  }, []);

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
    ghostViewport,
    dropTarget,
    handleUnitMouseDown,
    handleGroupHeaderMouseDown,
    handleRemoveFromGroup,
  };
}
