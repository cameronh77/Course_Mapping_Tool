import React, { useState, useEffect, useRef, useMemo } from "react";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { UnitBox } from "../components/common/UnitBox";
import { GridBackground } from "../components/common/GridBackground";
import { ConnectionLines } from "../components/common/ConnectionLines";
import { ThemeView } from "../components/common/ThemeView";
import { AddTagMenu } from "../components/common/AddTagMenu";
import { axiosInstance } from "../lib/axios";
import { saveThemeLayout, type ThemeViewStorage } from "../lib/themeStorage";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import { useCLOStore } from "../stores/useCLOStore";
import { useTagStore } from "../stores/useTagStore";
import { usePathwayStore } from "../stores/usePathwayStore";
import { useNavigate } from "react-router-dom";
import type {
  Unit,
  CourseLearningOutcome,
  Tag,
  UnitRelationship,
  UnitBox as UnitBoxType,
  UnitMappings,
} from "../types";

// Grid Layout Constants
const COL_WIDTH = 600;
const ROW_HEIGHT = 150;
const START_X = 80;
const START_Y = 80;
const DEFAULT_YEARS = 3;
const DEFAULT_SEMESTERS = 2;
const MAX_UNITS_PER_SEM = 4;
const UNIT_BOX_WIDTH = 256;

// Color palette for CLOs - vibrant and distinct colors
const CLO_COLOR_PALETTE = [
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#06B6D4", // Cyan
  "#D946EF", // Fuchsia
];

// Utility function to generate a unique color for each CLO
const getCLOColor = (cloId: number): string => {
  return CLO_COLOR_PALETTE[cloId % CLO_COLOR_PALETTE.length];
};

export const CanvasPage: React.FC = () => {
  const [unitBoxes, setUnitBoxes] = useState<UnitBoxType[]>([]);

  // UX State - View Mode & Sidebar Navigation Tab
  const [viewMode, setViewMode] = useState<'grid' | 'theme'>('grid');
  const [sidebarTab, setSidebarTab] = useState<'units' | 'connections' | 'mapping'>('units');

  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // State for dragging existing units
  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // State for dragging NEW units from sidebar
  const [draggedNewUnit, setDraggedNewUnit] = useState<{
    unit: Unit;
    x: number;
    y: number;
  } | null>(null);

  // State for hover highlighting connections
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  // ID of unit currently being overlapped by a dragged unit (blocks the drop)
  const [blockedUnitId, setBlockedUnitId] = useState<number | null>(null);

  // ID of year-long unit whose reserved "ghost" slot is being hovered
  const [ghostHoverId, setGhostHoverId] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const themeLayoutRef = useRef<ThemeViewStorage | null>(null);
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();
  const {
    pathways,
    activePathwayId,
    fetchPathways,
    setActivePathway,
    createPathway,
    deletePathway,
  } = usePathwayStore();

  useEffect(() => {
    if (currentCourse?.courseId) {
      fetchPathways(currentCourse.courseId);
    }
  }, [currentCourse?.courseId, fetchPathways]);

  const [showPathwayModal, setShowPathwayModal] = useState(false);
  const [newPathwayName, setNewPathwayName] = useState("");
  const [newPathwayType, setNewPathwayType] = useState<"MAJOR" | "MINOR" | "ENTRY_POINT">("MAJOR");

  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // States for unit search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const {
    currentUnit,
    checkUnitExists,
    viewUnits,
    createUnit,
    updateUnit,
    setUnit,
  } = useUnitStore();

  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const navigate = useNavigate();
  // Context Menu to identify specific units
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    unitId?: string; // Updated to handle string keys for unit selection
  }>({ visible: false, x: 0, y: 0 });

  const [viewingTagMenu, setViewingTagMenu] = useState<boolean>(false);
  const [tagData, setTagData] = useState<CourseLearningOutcome[] | null>(null);

  const {
    existingTags,
    existingTagConnections,
    createTag,
    addUnitTags,
    viewCourseTags,
    viewUnitTagsByCourse,
  } = useTagStore();

  const [selectedTagFilters, setSelectedTagFilters] = useState<number[]>([]);

  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<UnitRelationship[]>([]);
  const [selectedRelationType, setSelectedRelationType] =
    useState<UnitRelationship["relationshipType"]>("PREREQUISITE");

  // State for expanded units and active tabs
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [activeTabs, setActiveTabs] = useState<
    Record<number, "info" | "clos" | "tags">
  >({});
  const [unitMappings, setUnitMappings] = useState<UnitMappings>({});

  const tagFilteredUnitIds = useMemo<Set<string> | null>(() => {
    if (selectedTagFilters.length === 0) return null;
    const filterSet = new Set(selectedTagFilters);
    const matched = new Set<string>();
    for (const [unitId, mapping] of Object.entries(unitMappings)) {
      const tags = mapping?.tags || [];
      if (tags.some((t) => filterSet.has(t.tagId))) {
        matched.add(unitId);
      }
    }
    return matched;
  }, [selectedTagFilters, unitMappings]);

  const isUnitVisible = (unitId: string | undefined) =>
    tagFilteredUnitIds === null || (unitId ? tagFilteredUnitIds.has(unitId) : false);

  const toggleTagFilter = (tagId: number) =>
    setSelectedTagFilters((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  const clearTagFilters = () => setSelectedTagFilters([]);

  useEffect(() => {
    const loadUnits = async () => {
      await viewUnits();
      if (currentCourse?.courseId) {
        await viewCourseTags(currentCourse.courseId);
        await viewUnitTagsByCourse(currentCourse.courseId);
        await fetchPathways(currentCourse.courseId);
      }
    };
    loadUnits();
  }, [currentCourse?.courseId]);

  useEffect(() => {
    const loadRelationships = async () => {
      if (currentCourse?.courseId && activePathwayId) {
        try {
          const response = await axiosInstance.get(
            `/unit-relationship/view?courseId=${currentCourse.courseId}&pathwayId=${activePathwayId}`
          );
          setRelationships(response.data);
        } catch (error) {
          console.error("Error loading relationships:", error);
        }
      }
    };
    loadRelationships();
  }, [currentCourse?.courseId, activePathwayId]);

  useEffect(() => {
    const loadCanvasState = async () => {
      if (currentCourse?.courseId && activePathwayId !== null) {
        try {
          const response = await axiosInstance.get(
            `/course-unit/view?courseId=${currentCourse.courseId}&pathwayId=${activePathwayId}`
          );
          const allCourseUnits = response.data;
          const courseUnits = allCourseUnits.filter(
            (cu: any) => cu.pathwayId === activePathwayId
          );
          const loadedUnitBoxes = courseUnits.map((cu: any) => ({
            id: Date.now() + Math.random(),
            name: cu.unit.unitName,
            unitId: cu.unitId,
            pathwayId: cu.pathwayId,
            description: cu.unit.unitDesc,
            credits: cu.unit.credits,
            semestersOffered: cu.unit.semestersOffered,
            x: cu.position?.x ?? 0,
            y: cu.position?.y ?? 0,
            color: cu.color || "#3B82F6",
          }));
          setUnitBoxes(loadedUnitBoxes);

          // Load existing CLO and Tag mappings for each unit
          const mappingsData: UnitMappings = {};

          // Fetch CLOs directly for this course to avoid stale store timing
          let allCLOs: CourseLearningOutcome[] = [];
          try {
            const cloResponse = await axiosInstance.get(`/CLO/viewAll/${currentCourse.courseId}`);
            allCLOs = cloResponse.data || [];
          } catch (error) {
            console.error("Error loading CLOs for course:", error);
          }
          
          // Load all ULOs once instead of per unit
          let allULOs: any[] = [];
          try {
            const uloResponse = await axiosInstance.get(`/ULO/view`);
            allULOs = uloResponse.data || [];
          } catch (error) {
            console.error("Error loading unit learning outcomes:", error);
          }

          // Load all tags for this course once
          let allTagsForCourse: any[] = [];
          try {
            const tagResponse = await axiosInstance.get(
              `/tag/view-unit-course/${currentCourse.courseId}`
            );
            allTagsForCourse = tagResponse.data || [];
          } catch (error) {
            console.error("Error loading tags for course:", error);
          }

          // Process each unit and build mappings
          for (const cu of courseUnits) {
            const unitId = cu.unitId;
            mappingsData[unitId] = { clos: [], tags: [] };

            // Find CLO mappings for this unit
            const unitCLOMappings = allULOs.filter(
              (ulo: any) => ulo.unitId === unitId && ulo.cloId
            );

            const mappedCLOs = unitCLOMappings
              .map((ulo: any) => allCLOs.find((clo: CourseLearningOutcome) => clo.cloId === ulo.cloId))
              .filter((clo): clo is CourseLearningOutcome => Boolean(clo));
            
            mappingsData[unitId].clos = mappedCLOs;

            // Find Tag mappings for this unit
            const unitTags = allTagsForCourse.filter(
              (ut: any) => ut.unitId === unitId
            );

            mappingsData[unitId].tags = unitTags;
          }

          setUnitMappings(mappingsData);
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }
    };
    loadCanvasState();
  }, [currentCourse, activePathwayId]);

  useEffect(() => {
    const loadCLOs = async () => {
      if (currentCourse?.courseId) {
        await useCLOStore.getState().viewCLOsByCourse(currentCourse);
      }
    };
    loadCLOs();
  }, [currentCourse?.courseId]);

  const companionSlotY = (snappedY: number): number | null => {
    const row = Math.round((snappedY - START_Y - 20) / ROW_HEIGHT);
    const companionRow =
      row < MAX_UNITS_PER_SEM
        ? row + MAX_UNITS_PER_SEM
        : row - MAX_UNITS_PER_SEM;
    if (companionRow < 0) return null;
    return START_Y + companionRow * ROW_HEIGHT + 20;
  };

  const isSlotOccupied = (
    x: number,
    y: number,
    excludeId?: number
  ): boolean => {
    return unitBoxes.some((u) => {
      if (u.id === excludeId) return false;
      if (Math.abs(u.x - x) >= 1) return false;
      if (Math.abs(u.y - y) < 1) return true;
      if (u.spansYear) {
        const cy = companionSlotY(u.y);
        if (cy !== null && Math.abs(cy - y) < 1) return true;
      }
      return false;
    });
  };

  const getMouseCoords = (
    e: MouseEvent | React.MouseEvent,
    container: HTMLDivElement
  ) => {
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop,
    };
  };

  const handleUnitGroupChange = async (
    unitKey: string,
    fromTag: import("../types").Tag | null,
    toTag: import("../types").Tag | null
  ) => {
    // Update local unitMappings immediately
    setUnitMappings((prev) => {
      const mapping = { ...(prev[unitKey] || { clos: [], tags: [] }) };
      if (fromTag) {
        mapping.tags = mapping.tags.filter((t) => t.tagId !== fromTag.tagId);
      }
      if (toTag && !mapping.tags.find((t) => t.tagId === toTag.tagId)) {
        mapping.tags = [...mapping.tags, toTag];
      }
      return { ...prev, [unitKey]: mapping };
    });

  };

  const handleAddTagToUnits = (tag: number) => {
    const apiData = selectedUnits.map((unit) => ({
      courseId: currentCourse.courseId,
      unitId: unit,
      tagId: tag,
    }));
    const addData = async (data: any) => {
      await addUnitTags(data);
    };
    addData(apiData);
    setViewingTagMenu(false);
  };

  const handleSaveCanvas = async () => {
    if (currentCourse?.courseId) {
      try {
        const middleSemesterDividerY = START_Y + MAX_UNITS_PER_SEM * ROW_HEIGHT;

        const unitsWithSemester = unitBoxes.map((u) => {
          const col = Math.max(0, Math.round((u.x - START_X) / COL_WIDTH));
          const semester = u.y < middleSemesterDividerY ? 1 : 2;
          const year = col + 1;
          return { ...u, semester, year };
        });

        const unitIdsOnCanvas = new Set(
          unitsWithSemester
            .map((u) => u.unitId)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
        );

        const cleanedUnitMappings: UnitMappings = Object.fromEntries(
          Object.entries(unitMappings)
            .filter(([unitId]) => unitIdsOnCanvas.has(unitId))
            .map(([unitId, mapping]) => {
              const dedupClos = Array.from(
                new Map((mapping?.clos || []).map((clo) => [clo.cloId, clo])).values()
              );
              const dedupTags = Array.from(
                new Map((mapping?.tags || []).map((tag) => [tag.tagId, tag])).values()
              );
              return [unitId, { clos: dedupClos, tags: dedupTags }];
            })
        ) as UnitMappings;

        if (!activePathwayId) {
          alert("No pathway selected. Please create or select a pathway before saving.");
          return;
        }

        await axiosInstance.post(
          `/course-unit/canvas/${currentCourse.courseId}`,
          {
            pathwayId: activePathwayId,
            units: unitsWithSemester,
            unitMappings: cleanedUnitMappings,
          }
        );

        // Persist theme layout
        if (themeLayoutRef.current) {
          saveThemeLayout(currentCourse.courseId, themeLayoutRef.current);
        }

        alert("Canvas saved successfully!");
      } catch (error) {
        console.error("Error saving canvas:", error);
        const errorMessage =
          (error as any)?.response?.data?.error ||
          (error as any)?.response?.data?.message ||
          "Failed to save canvas.";
        alert(errorMessage);
      }
    }
  };

  const addUnitToCanvasAtPos = (
    selectedUnit: Unit,
    x: number,
    y: number,
    color?: string
  ) => {
    const unitExists = unitBoxes.some(
      (u) => u.unitId === selectedUnit.unitId && u.pathwayId === activePathwayId
    );
    if (unitExists) {
      alert("This unit has already been added to this pathway.");
      return;
    }

    const semestersPerYear =
      Number((currentCourse as any)?.numberTeachingPeriods) ||
      DEFAULT_SEMESTERS;
    const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;

    const col = Math.max(0, Math.round((x - START_X) / COL_WIDTH));
    let closestRow = 0;
    let minDistance = Infinity;
    for (let r = 0; r < totalRows; r++) {
      const expectedY = START_Y + r * ROW_HEIGHT + 20;
      const dist = Math.abs(y - expectedY);
      if (dist < minDistance) {
        minDistance = dist;
        closestRow = r;
      }
    }

    const snappedX =
      START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
    const snappedY = START_Y + closestRow * ROW_HEIGHT + 20;

    if (isSlotOccupied(snappedX, snappedY)) {
      return;
    }

    const newUnit = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      pathwayId: activePathwayId ?? undefined,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x: snappedX,
      y: snappedY,
      color: color || "#3B82F6",
    };

    setUnitBoxes((prev) => [...prev, newUnit]);
  };

  const handleNewUnitMouseDown = (e: React.MouseEvent, unit: Unit) => {
    e.preventDefault();
    setDraggedNewUnit({
      unit,
      x: e.clientX,
      y: e.clientY,
    });

    const handleGlobalMove = (moveEvent: MouseEvent) => {
      setDraggedNewUnit((prev) =>
        prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : null
      );
    };

    const handleGlobalUp = (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalUp);

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (
          upEvent.clientX >= rect.left &&
          upEvent.clientX <= rect.right &&
          upEvent.clientY >= rect.top &&
          upEvent.clientY <= rect.bottom
        ) {
          const canvasCoords = getMouseCoords(
            upEvent as unknown as React.MouseEvent,
            canvasRef.current
          );
          addUnitToCanvasAtPos(
            unit,
            canvasCoords.x - UNIT_BOX_WIDTH / 2,
            canvasCoords.y - 40
          );
        }
      }
      setDraggedNewUnit(null);
    };

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);
  };

  function startEdit(id: number) {
    setEditingId(id);
    setShowForm(true);
  }

  function handleFormSave(formData: UnitFormData) {
    if (editingId) {
      const editedUnit = unitBoxes.find((unit) => unit.id === editingId);
      if (editedUnit) {
        updateUnit(editedUnit.unitId!, {
          unitName: formData.unitName || editedUnit.name,
          unitDesc: formData.unitDesc || editedUnit.description,
          credits: formData.credits || editedUnit.credits,
          semestersOffered:
            formData.semestersOffered || editedUnit.semestersOffered,
        })
          .then(() => {
            setUnitBoxes(
              unitBoxes.map((unit) =>
                unit.id === editingId
                  ? {
                      ...unit,
                      name: formData.unitName || unit.name,
                      unitId: formData.unitId || unit.unitId,
                      description: formData.unitDesc || unit.description,
                      credits: formData.credits || unit.credits,
                      semestersOffered:
                        formData.semestersOffered || unit.semestersOffered,
                      color: formData.color || unit.color,
                    }
                  : unit
              )
            );
            setEditingId(null);
            setShowForm(false);
          })
          .catch((err) => console.error("Error updating unit:", err));
      }
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
  }

  function handleMouseDownCanvas(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if (selectedUnits.length !== 0) {
      setSelectedUnits([]);
      return;
    }
    setContextMenu({ visible: false, x: 0, y: 0, unitId: undefined });
    if (!canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const start = { initialX: mouseX, initialY: mouseY };

    const handleCanvasUp = (mouseEvent: MouseEvent) => {
      const { x: endX, y: endY } = getMouseCoords(
        mouseEvent,
        canvasRef.current!
      );
      const selectedRect = {
        x1: Math.min(start.initialX, endX),
        x2: Math.max(start.initialX, endX),
        y1: Math.min(start.initialY, endY),
        y2: Math.max(start.initialY, endY),
      };
      const selected = unitBoxes
        .filter(
          (unit) =>
            unit.x > selectedRect.x1 &&
            unit.x < selectedRect.x2 &&
            unit.y > selectedRect.y1 &&
            unit.y < selectedRect.y2
        )
        .map((unit) => unit.unitId as string);
      setSelectedUnits(selected);
      document.removeEventListener("mouseup", handleCanvasUp);
    };
    document.addEventListener("mouseup", handleCanvasUp);
  }

  function handleMouseDown(e: React.MouseEvent, id: number) {
    setContextMenu({ visible: false, x: 0, y: 0, unitId: undefined });
    e.preventDefault();
    e.stopPropagation();

    const unit = unitBoxes.find((u) => u.id === id);
    if (!unit || !canvasRef.current) return;

    const originalPos = { x: unit.x, y: unit.y };
    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - unit.x, y: mouseY - unit.y };
    setDragOffset(offset);
    setDraggedUnit(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      setIsDragging(true);
      const { x: newMouseX, y: newMouseY } = getMouseCoords(
        moveEvent,
        canvasRef.current
      );
      setUnitBoxes((prevUnits) => {
        const nextX = Math.max(
          0,
          Math.min(
            newMouseX - offset.x,
            canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH
          )
        );
        const nextY = Math.max(
          0,
          Math.min(
            newMouseY - offset.y,
            canvasRef.current!.scrollHeight - 100
          )
        );

        const semestersPerYear =
          Number((currentCourse as any)?.numberTeachingPeriods) ||
          DEFAULT_SEMESTERS;
        const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
        const col = Math.max(0, Math.round((nextX - START_X) / COL_WIDTH));
        let closestRow = 0;
        let minDistance = Infinity;
        for (let r = 0; r < totalRows; r++) {
          const expectedY = START_Y + r * ROW_HEIGHT + 20;
          const dist = Math.abs(nextY - expectedY);
          if (dist < minDistance) {
            minDistance = dist;
            closestRow = r;
          }
        }
        const snappedX =
          START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
        const snappedY = START_Y + closestRow * ROW_HEIGHT + 20;
        const draggedUnitObj = prevUnits.find((pu) => pu.id === id);
        const draggedSpans = draggedUnitObj?.spansYear === true;
        const targetYs = [snappedY];
        if (draggedSpans) {
          const cy = companionSlotY(snappedY);
          if (cy !== null) targetYs.push(cy);
        }
        const blocker = prevUnits.find((other) => {
          if (other.id === id) return false;
          if (Math.abs(other.x - snappedX) >= 1) return false;
          const otherYs = [other.y];
          if (other.spansYear) {
            const cy = companionSlotY(other.y);
            if (cy !== null) otherYs.push(cy);
          }
          return otherYs.some((oy) =>
            targetYs.some((ty) => Math.abs(oy - ty) < 1)
          );
        });
        setBlockedUnitId(blocker ? blocker.id : null);

        return prevUnits.map((u) =>
          u.id === id ? { ...u, x: nextX, y: nextY } : u
        );
      });
    };

    const handleUp = () => {
      setUnitBoxes((prevUnits) =>
        prevUnits.map((u) => {
          if (u.id === id) {
            let snappedX = u.x;
            let snappedY = u.y;
            if (u.x >= START_X - 100 && u.y >= START_Y - 50) {
              const semestersPerYear =
                Number((currentCourse as any)?.numberTeachingPeriods) ||
                DEFAULT_SEMESTERS;
              const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
              const col = Math.max(0, Math.round((u.x - START_X) / COL_WIDTH));
              let closestRow = 0;
              let minDistance = Infinity;
              for (let r = 0; r < totalRows; r++) {
                const expectedY = START_Y + r * ROW_HEIGHT + 20;
                const dist = Math.abs(u.y - expectedY);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestRow = r;
                }
              }
              snappedX =
                START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
              snappedY = START_Y + closestRow * ROW_HEIGHT + 20;

              const draggedSpans = u.spansYear === true;
              const slotBlocked = prevUnits.some((other) => {
                if (other.id === id) return false;
                if (Math.abs(other.x - snappedX) >= 1) return false;
                const otherYs = [other.y];
                if (other.spansYear) {
                  const cy = companionSlotY(other.y);
                  if (cy !== null) otherYs.push(cy);
                }
                const targetYs = [snappedY];
                if (draggedSpans) {
                  const cy = companionSlotY(snappedY);
                  if (cy !== null) targetYs.push(cy);
                }
                return otherYs.some((oy) =>
                  targetYs.some((ty) => Math.abs(oy - ty) < 1)
                );
              });
              if (slotBlocked) {
                snappedX = originalPos.x;
                snappedY = originalPos.y;
              }
            }
            return { ...u, x: snappedX, y: snappedY };
          }
          return u;
        })
      );
      setDraggedUnit(null);
      setBlockedUnitId(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setTimeout(() => setIsDragging(false), 100);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  function handleDoubleClick(unitId: number) {
    if (isDragging) return;
    startEdit(unitId);
  }

  function deleteUnit(unitId: number) {
    const targetUnit = unitBoxes.find((unit) => unit.id === unitId);
    setUnitBoxes(unitBoxes.filter((unit) => unit.id !== unitId));
    if (targetUnit?.unitId) {
      setUnitMappings((prev) => {
        const next = { ...prev };
        delete next[targetUnit.unitId!];
        return next;
      });
    }
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowSearchResults(true);
    if (term) {
      try {
        const response = await axiosInstance.get(`/unit/view?search=${term}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching units:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleCreateUnit = async (data: UnitFormData) => {
    try {
      if (data.unitId) {
        const checkResults = await checkUnitExists(data.unitId);
        if (checkResults.isDuplicate) {
          alert(`A unit with ID: "${data.unitId}" already exists.`);
          return;
        }
      }
      const newUnit = await createUnit(data);
      setShowCreateForm(false);
      if (newUnit && newUnit.unitId) {
        setSearchTerm(newUnit.unitId);
        handleSearchChange({ target: { value: newUnit.unitId } } as any);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create unit.");
    }
  };

  const handleCreateRelationship = async (targetUnitId: string) => {
    if (!connectionMode) return;
    if (!connectionSource || connectionSource === targetUnitId) {
      setConnectionSource(null);
      return;
    }
    if (!activePathwayId) {
      alert("Select a pathway before creating connections.");
      return;
    }
    try {
      const response = await axiosInstance.post("/unit-relationship/create", {
        unitId: connectionSource,
        relatedId: targetUnitId,
        relationshipType: selectedRelationType,
        courseId: currentCourse.courseId,
        pathwayId: activePathwayId,
        entryType: 0,
      });
      setRelationships([...relationships, response.data]);
      setConnectionSource(null);
      setConnectionMode(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create relationship");
      setConnectionSource(null);
    }
  };

  const handleDeleteRelationship = async (relationshipId: number) => {
    const rel = relationships.find((r) => r.id === relationshipId);
    const label = rel ? `${rel.unitId} → ${rel.relatedId}` : "this connection";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/unit-relationship/delete/${relationshipId}`);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
    } catch (err) {
      alert("Failed to delete relationship");
    }
  };

  const handleUnitClickForConnection = (unitId: string) => {
    if (!connectionMode) return;
    if (!connectionSource) setConnectionSource(unitId);
    else handleCreateRelationship(unitId);
  };

  // Restored: Canvas generic Right-Click (Bulk Tools)
  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      unitId: undefined,
    });
  }

  // Restored: Unit Box specific Right-Click (Quick Tick Tool)
  function handleUnitRightClick(e: React.MouseEvent, unitId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, unitId });
  }

  // Restored: Handle Quick-Tick Mappings
  const handleToggleCLO = (
    unitKey: string,
    clo: CourseLearningOutcome,
    add: boolean
  ) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (add) {
        if (unitData.clos.some((c) => c.cloId === clo.cloId)) return prev;
        return { ...prev, [unitKey]: { ...unitData, clos: [...unitData.clos, clo] } };
      } else {
        return {
          ...prev,
          [unitKey]: {
            ...unitData,
            clos: unitData.clos.filter((c) => c.cloId !== clo.cloId),
          },
        };
      }
    });
  };

  const handleToggleTag = (unitKey: string, tag: Tag, add: boolean) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (add) {
        if (unitData.tags.some((t) => t.tagId === tag.tagId)) return prev;
        if (currentCourse?.courseId) {
          addUnitTags([
            {
              courseId: currentCourse.courseId,
              unitId: unitKey,
              tagId: tag.tagId,
            },
          ]);
        }
        return {
          ...prev,
          [unitKey]: { ...unitData, tags: [...unitData.tags, tag] },
        };
      } else {
        return {
          ...prev,
          [unitKey]: {
            ...unitData,
            tags: unitData.tags.filter((t) => t.tagId !== tag.tagId),
          },
        };
      }
    });
  };

  // Handle Drop onto a Unit Box from Sidebar
  const handleDropOnUnit = (unitKey: string, transferItem: any) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (transferItem.type === "clo") {
        if (!unitData.clos.find((c) => c.cloId === transferItem.data.cloId)) {
          return {
            ...prev,
            [unitKey]: {
              ...unitData,
              clos: [...unitData.clos, transferItem.data],
            },
          };
        }
      } else if (transferItem.type === "tag") {
        if (!unitData.tags.find((t) => t.tagId === transferItem.data.tagId)) {
          if (currentCourse?.courseId) {
            addUnitTags([
              {
                courseId: currentCourse.courseId,
                unitId: unitKey,
                tagId: transferItem.data.tagId,
              },
            ]);
          }
          return {
            ...prev,
            [unitKey]: {
              ...unitData,
              tags: [...unitData.tags, transferItem.data],
            },
          };
        }
      }
      return prev;
    });
  };

  const toggleExpand = (e: React.MouseEvent, unitId: number) => {
    e.stopPropagation();
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const yearsCount =
    Number((currentCourse as any)?.expectedDuration) || DEFAULT_YEARS;
  const semPerYear =
    Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
  const innerWidth = Math.max(1200, START_X + yearsCount * COL_WIDTH + 100);
  const innerHeight = Math.max(
    800,
    START_Y + semPerYear * MAX_UNITS_PER_SEM * ROW_HEIGHT + 100
  );

  // Wrapper for the onDrop handler to process logic locally in UnitCanvas
  const handleUnitBoxDrop = (unitKey: string, parsed: any) => {
    handleDropOnUnit(unitKey, parsed);
    const unit = unitBoxes.find(
      (u) => u.unitId === unitKey || u.id.toString() === unitKey
    );
    if (unit && !expandedUnits.has(unit.id)) {
      setExpandedUnits((prev) => new Set(prev).add(unit.id));
    }
    if (unit) {
      setActiveTabs((prev) => ({
        ...prev,
        [unit.id]: parsed.type === "clo" ? "clos" : "tags",
      }));
    }
  };

  return (
    <div
      className="flex h-screen relative overflow-hidden pt-16"
      onClick={() => setContextMenu({ ...contextMenu, visible: false })}
    >
      <div className="flex flex-col h-full z-20 w-[300px] border-r shadow-xl">
        <CanvasSidebar
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          handleSaveCanvas={handleSaveCanvas}
          setShowCreateForm={setShowCreateForm}
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          showSearchResults={showSearchResults}
          setShowSearchResults={setShowSearchResults}
          searchResults={searchResults}
          handleNewUnitMouseDown={handleNewUnitMouseDown}
          connectionMode={connectionMode}
          setConnectionMode={setConnectionMode}
          setConnectionSource={setConnectionSource}
          selectedRelationType={selectedRelationType}
          setSelectedRelationType={setSelectedRelationType}
          getCLOColor={getCLOColor}
          selectedTagFilters={selectedTagFilters}
          onToggleTagFilter={toggleTagFilter}
          onClearTagFilters={clearTagFilters}
        />
      </div>

      <div ref={canvasRef} className="flex-1 bg-white overflow-auto relative" style={{ userSelect: "none" }} onMouseDown={viewMode === 'grid' ? handleMouseDownCanvas : undefined} onContextMenu={viewMode === 'grid' ? (e) => handleRightClick(e) : undefined}>
        {/* Toolbar: View Mode + Pathway Toggle */}
        <div className="sticky top-0 left-0 z-50 flex items-center gap-1 p-2 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          {/* View mode buttons */}
          <button
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            onClick={() => setViewMode('grid')}
          >
            Timeline View
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'theme' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            onClick={() => setViewMode('theme')}
          >
            Theme View
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Pathway tabs */}
          <span className="text-xs text-gray-400 font-medium mr-1">Pathway:</span>
          {pathways.map((pathway) => (
            <button
              key={pathway.pathwayId}
              onClick={() => setActivePathway(pathway.pathwayId)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                activePathwayId === pathway.pathwayId
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {pathway.type === 'CORE' && <span className="text-[10px]">◆</span>}
              {pathway.type === 'MAJOR' && <span className="text-[10px]">▲</span>}
              {pathway.type === 'MINOR' && <span className="text-[10px]">●</span>}
              {pathway.type === 'ENTRY_POINT' && <span className="text-[10px]">→</span>}
              {pathway.name}
              {pathway.type !== 'CORE' && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); deletePathway(pathway.pathwayId); }}
                  className="ml-1 text-gray-400 hover:text-red-500 leading-none"
                  title="Delete pathway"
                >
                  ×
                </span>
              )}
            </button>
          ))}

          {/* Add pathway button */}
          <button
            onClick={() => setShowPathwayModal(true)}
            className="px-2 py-1.5 text-xs font-bold rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
            title="Add pathway"
          >
            + Pathway
          </button>
        </div>

        {/* Add Pathway Modal */}
        {showPathwayModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-80">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Add Pathway</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Pathway name (e.g. Software Engineering)"
                  value={newPathwayName}
                  onChange={(e) => setNewPathwayName(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
                <select
                  value={newPathwayType}
                  onChange={(e) => setNewPathwayType(e.target.value as "MAJOR" | "MINOR" | "ENTRY_POINT")}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="MAJOR">Major</option>
                  <option value="MINOR">Minor</option>
                  <option value="ENTRY_POINT">Entry Point</option>
                </select>
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => { setShowPathwayModal(false); setNewPathwayName(""); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!newPathwayName.trim()}
                    onClick={async () => {
                      if (!newPathwayName.trim() || !currentCourse?.courseId) return;
                      const pathway = await createPathway(newPathwayName.trim(), newPathwayType, currentCourse.courseId);
                      setActivePathway(pathway.pathwayId);
                      setShowPathwayModal(false);
                      setNewPathwayName("");
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'grid' ? (
        <div className="relative bg-white" style={{ width: `${innerWidth}px`, height: `${innerHeight}px` }}>
          <GridBackground
            expectedDuration={yearsCount}
            numberTeachingPeriods={semPerYear}
          />

          {unitBoxes
            .filter((u) => u.spansYear && isUnitVisible(u.unitId))
            .map((u) => {
              const cy = companionSlotY(u.y);
              if (cy === null) return null;
              const color = u.color || "#3B82F6";
              return (
                <div
                  key={`ghost-${u.id}`}
                  className="absolute rounded border-2 border-dashed flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${u.x}px`,
                    top: `${cy}px`,
                    width: `${u.width ?? UNIT_BOX_WIDTH}px`,
                    height: "80px",
                    zIndex: 5,
                    borderColor: color,
                    backgroundImage: `repeating-linear-gradient(45deg, ${color}55 0, ${color}55 6px, transparent 6px, transparent 12px)`,
                  }}
                  onMouseEnter={() => setGhostHoverId(u.id)}
                  onMouseLeave={() => setGhostHoverId(null)}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/80"
                    style={{ color }}
                  >
                    Year-long · {u.unitId || u.name}
                  </span>
                </div>
              );
            })}

          {unitBoxes.filter((unit) => isUnitVisible(unit.unitId)).map((unit) => (
            <UnitBox
              key={unit.id}
              unit={unit}
              draggedUnit={draggedUnit}
              selectedUnits={selectedUnits}
              connectionMode={connectionMode}
              connectionSource={connectionSource}
              isExpanded={expandedUnits.has(unit.id)}
              activeTab={activeTabs[unit.id] || "info"}
              unitMappings={
                unitMappings[unit.unitId || unit.id.toString()] || {
                  clos: [],
                  tags: [],
                }
              }
              currentCLOs={currentCLOs || []}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              onClick={handleUnitClickForConnection}
              onMouseEnter={() =>
                setHoveredUnit(unit.unitId || unit.id.toString())
              }
              onMouseLeave={() => setHoveredUnit(null)}
              onContextMenu={handleUnitRightClick}
              onDrop={handleUnitBoxDrop}
              toggleExpand={toggleExpand}
              setActiveTab={(id, tab) =>
                setActiveTabs((prev) => ({ ...prev, [id]: tab }))
              }
              deleteUnit={deleteUnit}
              getCLOColor={getCLOColor}
              existingTags={existingTags || []}
              isBlocked={blockedUnitId !== null && draggedUnit === unit.id}
              isHighlighted={ghostHoverId === unit.id}
            />
          ))}
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <ConnectionLines
              relationships={relationships.filter(
                (r) => isUnitVisible(r.unitId) && isUnitVisible(r.relatedId)
              )}
              unitBoxes={unitBoxes}
              numberTeachingPeriods={semPerYear}
              hoveredUnit={hoveredUnit}
              onDeleteRelationship={handleDeleteRelationship}
            />
          </svg>
        </div>
        ) : (
          <ThemeView
            courseId={currentCourse?.courseId ?? ""}
            unitBoxes={unitBoxes}
            unitMappings={unitMappings}
            existingTags={existingTags}
            getCLOColor={getCLOColor}
            onUnitGroupChange={handleUnitGroupChange}
            layoutRef={themeLayoutRef}
          />
        )}

        {/* Modal: Edit Unit */}
        {showForm && editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Unit</h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <UnitForm
                onSave={handleFormSave}
                initialData={{
                  unitId:
                    unitBoxes.find((u) => u.id === editingId)?.unitId || null,
                  unitName:
                    unitBoxes.find((u) => u.id === editingId)?.name || null,
                  unitDesc:
                    unitBoxes.find((u) => u.id === editingId)?.description ||
                    null,
                  credits:
                    unitBoxes.find((u) => u.id === editingId)?.credits || null,
                  semestersOffered:
                    unitBoxes.find((u) => u.id === editingId)
                      ?.semestersOffered || null,
                  color:
                    unitBoxes.find((u) => u.id === editingId)?.color || null,
                }}
                onView={() => {
                  const selectedUnit = unitBoxes.find((item) => item.id === editingId);
                  if (!selectedUnit) {
                    return;
                  }

                  setUnit({
                    unitId: selectedUnit.unitId || "",
                    unitName: selectedUnit.name || "",
                    unitDesc: selectedUnit.description || "",
                    credits: selectedUnit.credits || 0,
                    semestersOffered: selectedUnit.semestersOffered || [],
                  });
                  navigate("/UnitInternalCanvas");
                }}
              />
            </div>
          </div>
        )}

        {/* Modal: Create Unit */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Create Unit</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <UnitForm
                onSave={handleCreateUnit}
                initialData={{
                  unitId: null,
                  unitName: null,
                  unitDesc: null,
                  credits: null,
                  semestersOffered: null,
                  color: null,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Drag Preview for New Units */}
      {draggedNewUnit && (
        <div
          className="fixed pointer-events-none z-[200] opacity-80"
          style={{
            left: draggedNewUnit.x - UNIT_BOX_WIDTH / 2,
            top: draggedNewUnit.y - 40,
            width: UNIT_BOX_WIDTH,
          }}
        >
          <div className="bg-blue-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">
              {draggedNewUnit.unit.unitId}
            </h2>
            <p className="text-xs text-center opacity-80">
              {draggedNewUnit.unit.unitName}
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Context Menu (Quick-Tick Mapping OR Bulk Tools) */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 shadow-2xl rounded-lg flex flex-col text-left z-[300] overflow-hidden"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            minWidth: "220px",
            maxWidth: "280px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.unitId ? (
            // Specific Unit Context Menu (Quick-Tick Checklist)
            <>
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">
                  Quick Mapping - {contextMenu.unitId}
                </span>
                <button
                  onClick={() =>
                    setContextMenu({ ...contextMenu, visible: false })
                  }
                  className="text-gray-400 hover:text-gray-700 leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto max-h-[300px] p-2 flex flex-col gap-3">
                {(() => {
                  const target = unitBoxes.find(
                    (u) => u.unitId === contextMenu.unitId
                  );
                  if (!target) return null;
                  const cy = companionSlotY(target.y);
                  const companionBlocked =
                    cy !== null &&
                    unitBoxes.some(
                      (o) =>
                        o.id !== target.id &&
                        Math.abs(o.x - target.x) < 1 &&
                        Math.abs(o.y - cy) < 1
                    );
                  const disableEnable = !target.spansYear && companionBlocked;
                  return (
                    <button
                      type="button"
                      disabled={disableEnable}
                      className={`w-full text-left text-xs font-semibold px-2 py-1.5 rounded border transition-colors ${
                        target.spansYear
                          ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                          : disableEnable
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      title={
                        disableEnable
                          ? "Companion slot in the other semester is occupied"
                          : undefined
                      }
                      onClick={() => {
                        setUnitBoxes((prev) =>
                          prev.map((u) =>
                            u.id === target.id
                              ? { ...u, spansYear: !u.spansYear }
                              : u
                          )
                        );
                      }}
                    >
                      {target.spansYear
                        ? "✓ Year-long (spans both semesters)"
                        : "Mark as Year-long"}
                    </button>
                  );
                })()}
                <div>
                  <span className="text-[10px] font-bold text-blue-600 mb-1 block uppercase tracking-wider">Mapped To This Unit</span>
                  {unitMappings[contextMenu.unitId!]?.clos?.length ? (
                    unitMappings[contextMenu.unitId!].clos.map((clo) => (
                      <div key={clo.cloId} className="p-1.5 rounded bg-blue-50 border border-blue-100 mb-1">
                        <div className="text-gray-700 text-xs leading-tight">{clo.cloDesc}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">CLO ID: {clo.cloId}</div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic px-1">No CLO currently mapped to this unit.</span>
                  )}
                </div>
                
                {/* CLOs Checklist */}
                <div className="border-t border-gray-100 pt-2">
                  <span className="text-[10px] font-bold text-purple-600 mb-1 block uppercase tracking-wider">Course Outcomes</span>
                  {currentCLOs && currentCLOs.length > 0 ? currentCLOs.map(clo => {
                    const isMapped = unitMappings[contextMenu.unitId!]?.clos?.some(c => c.cloId === clo.cloId);
                    return (
                      <label key={clo.cloId} className="flex items-start gap-2 p-1.5 hover:bg-purple-50 rounded cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" 
                          checked={!!isMapped} 
                          onChange={(e) => handleToggleCLO(contextMenu.unitId!, clo, e.target.checked)} 
                        />
                        <div className="leading-tight">
                          <div className="text-gray-700 text-xs group-hover:text-purple-900">{clo.cloDesc}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">CLO ID: {clo.cloId}</div>
                        </div>
                      </label>
                    );
                  }) : <span className="text-xs text-gray-400 italic px-1">No CLOs to map.</span>}
                </div>

                {/* Tags Checklist */}
                <div className="border-t border-gray-100 pt-2">
                  <span className="text-[10px] font-bold text-green-600 mb-1 block uppercase tracking-wider">
                    Tags
                  </span>
                  {existingTags && existingTags.length > 0 ? (
                    existingTags.map((tag) => {
                      const isMapped = unitMappings[
                        contextMenu.unitId!
                      ]?.tags?.some((t) => t.tagId === tag.tagId);
                      return (
                        <label
                          key={tag.tagId}
                          className="flex items-center gap-2 p-1.5 hover:bg-green-50 rounded cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            checked={!!isMapped}
                            onChange={(e) =>
                              handleToggleTag(
                                contextMenu.unitId!,
                                tag,
                                e.target.checked
                              )
                            }
                          />
                          <span className="text-gray-700 text-xs group-hover:text-green-900">
                            {tag.tagName}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-400 italic px-1">
                      No tags available.
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            // General Canvas Context Menu (Bulk Operations)
            <div className="py-1">
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Bulk Tools ({selectedUnits.length} selected)
                </span>
              </div>
              <button
                className="w-full text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 text-sm font-medium cursor-pointer text-left transition-colors"
                onClick={() => {
                  setViewingTagMenu(true);
                  setTagData(
                    currentCLOs.map((clo: CourseLearningOutcome) => ({
                      name: clo.cloDesc,
                      id: clo.cloId,
                    }))
                  );
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                Add Learning Outcome
              </button>
              <button
                className="w-full text-gray-700 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 text-sm font-medium cursor-pointer text-left transition-colors"
                onClick={() => {
                  setViewingTagMenu(true);
                  setTagData(
                    existingTags.map((tag: Tag) => ({
                      name: tag.tagName,
                      id: tag.tagId,
                    }))
                  );
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                Add Tag
              </button>
            </div>
          )}
        </div>
      )}

      {viewingTagMenu && (
        <AddTagMenu
          x={contextMenu.x}
          y={contextMenu.y}
          data={tagData}
          onClose={() => setViewingTagMenu(false)}
          onSave={handleAddTagToUnits}
        />
      )}
    </div>
  );
};

export default CanvasPage;
