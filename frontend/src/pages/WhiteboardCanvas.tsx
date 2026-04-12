import React, { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { UnitBox } from "../components/common/UnitBox";
import { CLOBox } from "../components/common/CLOBox";
import { ULOBox } from "../components/common/ULOBox";
import { AssessmentBox } from "../components/common/AssessmentBox";
import { registerWhiteboardHandlers, clearWhiteboardHandlers } from "../lib/whiteboardHandlers";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import { useCLOStore } from "../stores/useCLOStore";
import { useTagStore } from "../stores/useTagStore";
import type {
  Unit,
  UnitBox as UnitBoxType,
  CourseLearningOutcome,
  UnitLearningOutcome,
  Assessment,
  Tag,
  UnitMappings,
} from "../types";

const NUM_COLUMNS = 9;
const CLO_BOX_SIZE = 72;
const CLO_VERTICAL_SPACING = 110;
const ULO_WIDTH_RATIO = 0.8;
const ULO_VERTICAL_SPACING = 90;
const ASSESSMENT_WIDTH_RATIO = 0.8;

type CLOBoxItem = {
  id: number;
  clo: CourseLearningOutcome;
  x: number;
  y: number;
  isCustom?: boolean;
};

type ULOBoxItem = {
  id: number;
  ulo: UnitLearningOutcome;
  x: number;
  y: number;
};

type AssessmentBoxItem = {
  id: number;
  assessment: Assessment;
  x: number;
  y: number;
};

type UnitOption = {
  unitId: string;
  label: string;
};

const CLO_COLOR_PALETTE = [
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
  "#06B6D4",
  "#D946EF",
];

const getCLOColor = (cloId: number): string => {
  return CLO_COLOR_PALETTE[cloId % CLO_COLOR_PALETTE.length];
};

const getCLOAlignedX = (canvasWidth: number): number => {
  const line4 = (canvasWidth / NUM_COLUMNS) * 4;
  const line5 = (canvasWidth / NUM_COLUMNS) * 5;
  const midpoint = (line4 + line5) / 2;
  return midpoint - CLO_BOX_SIZE / 2;
};

export const WhiteboardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const previousColumnWidthRef = useRef<number>(256);
  const cloCourseRef = useRef<string | null>(null);
  const [columnWidth, setColumnWidth] = useState<number>(256);
  const [draggedCLOId, setDraggedCLOId] = useState<number | null>(null);
  const [selectedCLOId, setSelectedCLOId] = useState<number | null>(null);
  const [draggedULOId, setDraggedULOId] = useState<number | null>(null);
  const [selectedULOId, setSelectedULOId] = useState<number | null>(null);
  const [draggedAssessmentId, setDraggedAssessmentId] = useState<number | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const [cloBoxes, setCloBoxes] = useState<CLOBoxItem[]>([]);
  const [uloBoxes, setUloBoxes] = useState<ULOBoxItem[]>([]);
  const [assessmentBoxes, setAssessmentBoxes] = useState<AssessmentBoxItem[]>([]);
  // Update column width on window or canvas resize
  useEffect(() => {
    const updateColumnWidth = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.offsetWidth;
        const nextColumnWidth = width / NUM_COLUMNS;
        const prevColumnWidth = previousColumnWidthRef.current || nextColumnWidth;

        setColumnWidth(nextColumnWidth);

        // Keep each unit in its logical column after resize.
        setUnitBoxes((prevUnits) =>
          prevUnits.map((unit) => {
            const columnIndex = Math.max(
              0,
              Math.min(NUM_COLUMNS - 1, Math.round(unit.x / prevColumnWidth))
            );
            return {
              ...unit,
              x: columnIndex * nextColumnWidth,
              width: nextColumnWidth,
            };
          })
        );

        setCloBoxes((prevCLOs) =>
          prevCLOs.map((cloBox) => ({
            ...cloBox,
            x: cloBox.isCustom
              ? Math.max(0, Math.min(cloBox.x, width - CLO_BOX_SIZE))
              : getCLOAlignedX(width),
          }))
        );

        setUloBoxes((prevULOs) =>
          prevULOs.map((uloBox) => ({
            ...uloBox,
            x: Math.max(0, Math.min(uloBox.x, width - nextColumnWidth * ULO_WIDTH_RATIO)),
          }))
        );

        setAssessmentBoxes((prevAssessments) =>
          prevAssessments.map((assessmentBox) => ({
            ...assessmentBox,
            x: Math.max(0, Math.min(assessmentBox.x, width - nextColumnWidth * ASSESSMENT_WIDTH_RATIO)),
          }))
        );

        previousColumnWidthRef.current = nextColumnWidth;
      }
    };
    updateColumnWidth();
    window.addEventListener('resize', updateColumnWidth);
    return () => window.removeEventListener('resize', updateColumnWidth);
  }, []);

  const unitStore = useUnitStore() as any;
  const { checkUnitExists, createUnit, updateUnit } = unitStore;
  const courseStore = useCourseStore() as any;
  const cloStore = useCLOStore() as any;
  const tagStore = useTagStore() as any;

  const { currentCourse } = courseStore;
  const { currentCLOs, viewCLOsByCourse } = cloStore;
  const { existingTags, addUnitTags, viewCourseTags } = tagStore;

  const [unitBoxes, setUnitBoxes] = useState<UnitBoxType[]>([]);
  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedNewUnit, setDraggedNewUnit] = useState<{ unit: Unit; x: number; y: number } | null>(null);

  const [sidebarTab, setSidebarTab] = useState<'units' | 'connections' | 'mapping'>('units');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [selectedUnits] = useState<string[]>([]);
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [selectedRelationType, setSelectedRelationType] = useState<any>("PREREQUISITE");
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [activeTabs, setActiveTabs] = useState<Record<number, 'info' | 'clos' | 'tags'>>({});
  const [unitMappings, setUnitMappings] = useState<UnitMappings>({});
  const [savedCourseUnits, setSavedCourseUnits] = useState<UnitOption[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    unitId?: string;
  }>({ visible: false, x: 0, y: 0 });


  // Load saved canvas units and their CLO/Tag mappings when course is loaded
  useEffect(() => {
    const loadAndPlaceSavedCanvasUnits = async () => {
      if (!currentCourse?.courseId || !canvasRef.current) return;
      try {
        const response = await axiosInstance.get(`/course-unit/view?courseId=${currentCourse.courseId}`);
        const courseUnits = response.data;
        const width = canvasRef.current.offsetWidth;
        const columnWidth = width / NUM_COLUMNS;

        // Dev updates may leave semester/year as 0. Normalize from position so units still render.
        const normalizedUnits = (courseUnits || []).map((cu: any) => {
          const normalizedYear = typeof cu.year === "number" && cu.year > 0 ? cu.year : 1;
          let normalizedSemester = typeof cu.semester === "number" ? cu.semester : 0;

          if (normalizedSemester !== 1 && normalizedSemester !== 2) {
            const x = cu.position?.x ?? 0;
            normalizedSemester = x >= width / 2 ? 2 : 1;
          }

          return {
            ...cu,
            year: normalizedYear,
            semester: normalizedSemester,
          };
        });

        const uniqueSavedUnits: UnitOption[] = Array.from(
          new Map<string, UnitOption>(
            normalizedUnits
              .filter((cu: any) => typeof cu.unitId === "string" && cu.unitId.length > 0)
              .map(
                (cu: any): [string, UnitOption] => [
                  cu.unitId,
                  {
                    unitId: cu.unitId,
                    label: `${cu.unitId} - ${cu.unit?.unitName || cu.unitId}`,
                  },
                ]
              )
          ).values()
        );
        setSavedCourseUnits(uniqueSavedUnits);

        // Sort units by year ascending, then by y position ascending (top to bottom)
        const sortedUnits = [...normalizedUnits].sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearA - yearB;
          const yA = (a.position?.y ?? 40);
          const yB = (b.position?.y ?? 40);
          return yA - yB;
        });

        // Group units by year
        const unitsByYear: Record<number, any[]> = {};
        for (const cu of sortedUnits) {
          const year = cu.year || 0;
          if (!unitsByYear[year]) unitsByYear[year] = [];
          unitsByYear[year].push(cu);
        }

        const placed: UnitBoxType[] = [];
        const semesterSpacing = 120;
        let currentY = 40;
        for (const year of Object.keys(unitsByYear).map(Number).sort((a, b) => a - b)) {
          const yearUnits = unitsByYear[year];
          const sem1Units = yearUnits.filter((u) => u.semester == 1);
          const sem2Units = yearUnits.filter((u) => u.semester == 2);

          // Place semester 1 units in leftmost column, spaced vertically
          let semester1Y = currentY;
          const sem1YPositions: number[] = [];
          for (const cu of sem1Units) {
            placed.push({
              id: Date.now() + Math.random(),
              name: cu.unit.unitName,
              unitId: cu.unitId,
              description: cu.unit.unitDesc,
              credits: cu.unit.credits,
              semestersOffered: cu.unit.semestersOffered,
              x: 0,
              y: semester1Y,
              color: cu.color || "#3B82F6",
              width: columnWidth,
              semester: cu.semester || 0,
              year: cu.year || 0,
            });
            sem1YPositions.push(semester1Y);
            semester1Y += semesterSpacing;
          }

          // Place semester 2 units in rightmost column
          // First semester 2 unit aligns y with first semester 1 unit, rest spaced below
          let semester2Y = sem1YPositions.length > 0 ? sem1YPositions[0] : currentY;
          let isFirstSem2 = true;
          for (const cu of sem2Units) {
            placed.push({
              id: Date.now() + Math.random(),
              name: cu.unit.unitName,
              unitId: cu.unitId,
              description: cu.unit.unitDesc,
              credits: cu.unit.credits,
              semestersOffered: cu.unit.semestersOffered,
              x: width - columnWidth,
              y: semester2Y,
              color: cu.color || "#3B82F6",
              width: columnWidth,
              semester: cu.semester || 0,
              year: cu.year || 0,
            });
            if (isFirstSem2) {
              semester2Y += semesterSpacing;
              isFirstSem2 = false;
            } else {
              semester2Y += semesterSpacing;
            }
          }

          // Update currentY for next year (max of last y used in this year + spacing)
          const lastY = Math.max(
            sem1YPositions.length > 0 ? sem1YPositions[sem1YPositions.length - 1] : currentY,
            semester2Y - semesterSpacing
          );
          currentY = lastY + semesterSpacing;
        }
        // Load existing CLO and Tag mappings for each unit
        const mappingsData: UnitMappings = {};

        let allCLOs: CourseLearningOutcome[] = [];
        try {
          const cloResponse = await axiosInstance.get(`/CLO/viewAll/${currentCourse.courseId}`);
          allCLOs = cloResponse.data || [];
        } catch (error) {
          console.error("Error loading CLOs for course:", error);
        }

        let allULOs: any[] = [];
        try {
          const uloResponse = await axiosInstance.get(`/ULO/view`);
          allULOs = uloResponse.data || [];
        } catch (error) {
          console.error("Error loading unit learning outcomes:", error);
        }

        let allAssessments: any[] = [];
        try {
          const assessmentResponse = await axiosInstance.get(`/assessment/view`);
          allAssessments = assessmentResponse.data || [];
        } catch (error) {
          console.error("Error loading assessments:", error);
        }

        const courseUnitIds = new Set(
          normalizedUnits
            .map((cu: any) => cu.unitId)
            .filter((unitId: unknown): unitId is string => typeof unitId === "string" && unitId.length > 0)
        );

        const uloWidth = columnWidth * ULO_WIDTH_RATIO;
        const uloColumnX: Record<1 | 2, number> = {
          1: columnWidth * 3 + (columnWidth - uloWidth) / 2, // 4th column (1-based)
          2: columnWidth * 5 + (columnWidth - uloWidth) / 2, // 6th column (1-based)
        };
        const assessmentWidth = columnWidth * ASSESSMENT_WIDTH_RATIO;
        const assessmentColumnX: Record<1 | 2, number> = {
          1: columnWidth * 2 + (columnWidth - assessmentWidth) / 2, // 3rd column (1-based)
          2: columnWidth * 6 + (columnWidth - assessmentWidth) / 2, // 7th column (1-based)
        };

        const orderedUloBoxes: ULOBoxItem[] = [];
        const orderedAssessmentBoxes: AssessmentBoxItem[] = [];
        const unitYByUnitId = new Map<string, number>();
        const nextBlockYBySemester: Record<1 | 2, number> = { 1: 40, 2: 40 };
        const toSemester = (value: unknown): 1 | 2 => (value === 2 ? 2 : 1);
        const orderedYears = Object.keys(unitsByYear).map(Number).sort((a, b) => a - b);

        for (const year of orderedYears) {
          const yearUnits = unitsByYear[year] || [];

          for (const semester of [1, 2] as const) {
            const semesterUnits = yearUnits.filter((cu: any) => toSemester(cu.semester) === semester);

            for (const cu of semesterUnits) {
            const ulosForUnit = allULOs
              .filter((ulo: any) => courseUnitIds.has(ulo.unitId) && ulo.unitId === cu.unitId)
              .sort((a: any, b: any) => {
                const aId = typeof a.uloId === "number" ? a.uloId : Number.MAX_SAFE_INTEGER;
                const bId = typeof b.uloId === "number" ? b.uloId : Number.MAX_SAFE_INTEGER;
                return aId - bId;
              });

            const assessmentsForUnit = allAssessments
              .filter((assessment: any) => courseUnitIds.has(assessment.unitId) && assessment.unitId === cu.unitId)
              .sort((a: any, b: any) => {
                const aId = typeof a.assessmentId === "number" ? a.assessmentId : Number.MAX_SAFE_INTEGER;
                const bId = typeof b.assessmentId === "number" ? b.assessmentId : Number.MAX_SAFE_INTEGER;
                return aId - bId;
              });

            const slotCount = Math.max(1, ulosForUnit.length, assessmentsForUnit.length);
            const blockTopY = nextBlockYBySemester[semester];
            const blockHeight = (slotCount - 1) * ULO_VERTICAL_SPACING;

            const getStartY = (itemCount: number) => {
              if (itemCount <= 1) return blockTopY + blockHeight / 2;
              const stackHeight = (itemCount - 1) * ULO_VERTICAL_SPACING;
              return blockTopY + (blockHeight - stackHeight) / 2;
            };

            const uloStartY = getStartY(ulosForUnit.length);
            ulosForUnit.forEach((ulo: any, index: number) => {
              orderedUloBoxes.push({
                id:
                  typeof ulo.uloId === "number"
                    ? ulo.uloId
                    : Date.now() + Math.floor(Math.random() * 1000),
                ulo,
                x: uloColumnX[semester],
                y: uloStartY + index * ULO_VERTICAL_SPACING,
              });
            });

            const assessmentStartY = getStartY(assessmentsForUnit.length);
            assessmentsForUnit.forEach((assessment: any, index: number) => {
              orderedAssessmentBoxes.push({
                id:
                  typeof assessment.assessmentId === "number"
                    ? assessment.assessmentId
                    : Date.now() + Math.floor(Math.random() * 1000),
                assessment: {
                  assessmentId:
                    typeof assessment.assessmentId === "number" ? assessment.assessmentId : null,
                  aDesc:
                    assessment.aDesc || assessment.assessmentDesc || assessment.assessmentName || "Assessment",
                  unitId: assessment.unitId || "",
                  assessmentType: assessment.assessmentType || "General",
                  assessmentConditions: assessment.assessmentConditions || "",
                  hurdleReq: typeof assessment.hurdleReq === "number" ? assessment.hurdleReq : null,
                  unitLosIds: Array.isArray(assessment.unitLos)
                    ? assessment.unitLos
                        .map((link: any) => Number(link.uloId))
                        .filter((id: number) => Number.isInteger(id) && id > 0)
                    : [],
                },
                x: assessmentColumnX[semester],
                y: assessmentStartY + index * ULO_VERTICAL_SPACING,
              });
            });

            const unitCenterY = blockTopY + blockHeight / 2;
            unitYByUnitId.set(cu.unitId, Math.max(0, unitCenterY));

            nextBlockYBySemester[semester] += blockHeight + ULO_VERTICAL_SPACING;
            }
          }

          const nextYearStartY = Math.max(nextBlockYBySemester[1], nextBlockYBySemester[2]);
          nextBlockYBySemester[1] = nextYearStartY;
          nextBlockYBySemester[2] = nextYearStartY;
        }

        setUloBoxes(orderedUloBoxes);
        setAssessmentBoxes(orderedAssessmentBoxes);

        const unitsAlignedToBlockCenter = placed.map((unitBox) => {
          const unitId = unitBox.unitId;
          if (!unitId) return unitBox;
          const nextY = unitYByUnitId.get(unitId);
          if (typeof nextY !== "number") return unitBox;
          return {
            ...unitBox,
            y: nextY,
          };
        });

        setUnitBoxes(unitsAlignedToBlockCenter);

        let allTagsForCourse: any[] = [];
        try {
          const tagResponse = await axiosInstance.get(`/tag/view-unit-course/${currentCourse.courseId}`);
          allTagsForCourse = tagResponse.data || [];
        } catch (error) {
          console.error("Error loading tags for course:", error);
        }

        for (const cu of normalizedUnits) {
          const unitId = cu.unitId;
          mappingsData[unitId] = { clos: [], tags: [] };

          const unitCLOMappings = allULOs.filter(
            (ulo: any) => ulo.unitId === unitId && ulo.cloId
          );
          mappingsData[unitId].clos = unitCLOMappings
            .map((ulo: any) => allCLOs.find((clo: CourseLearningOutcome) => clo.cloId === ulo.cloId))
            .filter((clo): clo is CourseLearningOutcome => Boolean(clo));

          mappingsData[unitId].tags = allTagsForCourse.filter(
            (ut: any) => ut.unitId === unitId
          );
        }

        setUnitMappings(mappingsData);
      } catch (error) {
        console.error("Error loading saved canvas units:", error);
        setSavedCourseUnits([]);
      }
    };
    loadAndPlaceSavedCanvasUnits();
  }, [currentCourse?.courseId]);

  useEffect(() => {
    if (currentCourse?.courseId) {
      viewCLOsByCourse(currentCourse);
      viewCourseTags(currentCourse.courseId);
    }
  }, [currentCourse?.courseId]);

  useEffect(() => {
    registerWhiteboardHandlers({
      addUnit: addPlaygroundUnit,
      addCLO: addPlaygroundCLO,
      addULO: addPlaygroundULO,
    });
    return () => clearWhiteboardHandlers();
  }, []);

  useEffect(() => {
    if (!currentCourse?.courseId) return;

    setCloBoxes((prev) => {
      const isNewCourse = cloCourseRef.current !== currentCourse.courseId;
      const middleX = getCLOAlignedX(columnWidth * NUM_COLUMNS);
      const courseCLOs = (currentCLOs || []) as CourseLearningOutcome[];
      const customBoxes = prev.filter((box) => box.isCustom);

      const existingById = new Map(prev.map((box) => [box.id, box]));
      const syncedCourseBoxes = courseCLOs
        .filter((clo): clo is CourseLearningOutcome & { cloId: number } => typeof clo.cloId === "number")
        .map((clo, index) => {
          const existing = !isNewCourse ? existingById.get(clo.cloId) : undefined;
          if (existing) {
            return { ...existing, clo, x: middleX, isCustom: false };
          }
          return {
            id: clo.cloId,
            clo,
            x: middleX,
            y: 40 + index * CLO_VERTICAL_SPACING,
            isCustom: false,
          };
        });

      cloCourseRef.current = currentCourse.courseId;
      return [...syncedCourseBoxes, ...customBoxes];
    });
  }, [currentCourse?.courseId, currentCLOs, columnWidth]);

  const getMouseCoords = (e: MouseEvent | React.MouseEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop,
    };
  };

  const addUnitToCanvasAtPos = (selectedUnit: Unit, x: number, y: number) => {
    const unitExists = unitBoxes.some((u) => u.unitId === selectedUnit.unitId);
    if (unitExists) {
      alert("This unit has already been added.");
      return;
    }

    // Snap x to nearest column
    const col = Math.max(0, Math.round(x / columnWidth));
    const snappedX = col * columnWidth;

    const newUnit: UnitBoxType = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x: snappedX,
      y,
      color: "#3B82F6",
      width: columnWidth,
    };

    setUnitBoxes((prev) => [...prev, newUnit]);
    setUnitMappings((prev) => ({
      ...prev,
      [selectedUnit.unitId]: prev[selectedUnit.unitId] || { clos: [], tags: [] },
    }));
  };

  const handleNewUnitMouseDown = (e: React.MouseEvent, unit: Unit) => {
    e.preventDefault();
    setDraggedNewUnit({ unit, x: e.clientX, y: e.clientY });

    const handleGlobalMove = (moveEvent: MouseEvent) => {
      setDraggedNewUnit((prev) => (prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : null));
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
          const canvasCoords = getMouseCoords(upEvent as unknown as React.MouseEvent, canvasRef.current);
          addUnitToCanvasAtPos(unit, canvasCoords.x - columnWidth / 2, canvasCoords.y - 40);
        }
      }

      setDraggedNewUnit(null);
    };

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const unit = unitBoxes.find((u) => u.id === id);
    if (!unit || !canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - unit.x, y: mouseY - unit.y };
    setDraggedUnit(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      setIsDragging(true);
      const { x: newMouseX, y: newMouseY } = getMouseCoords(moveEvent, canvasRef.current);
      setUnitBoxes((prevUnits) =>
        prevUnits.map((u) => {
          if (u.id === id) {
            const width = u.width ?? columnWidth;
            return {
              ...u,
              x: Math.max(0, Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - width)),
              y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 100)),
            };
          }
          return u;
        })
      );
    };

    const handleUp = () => {
      setDraggedUnit(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setTimeout(() => setIsDragging(false), 100);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleCLOMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const cloBox = cloBoxes.find((c) => c.id === id);
    if (!cloBox || !canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - cloBox.x, y: mouseY - cloBox.y };
    setDraggedCLOId(id);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x: newMouseX, y: newMouseY } = getMouseCoords(moveEvent, canvasRef.current);

      setCloBoxes((prev) =>
        prev.map((box) => {
          if (box.id !== id) return box;
          return {
            ...box,
            x: Math.max(0, Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - columnWidth * 0.9)),
            y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 80)),
          };
        })
      );
    };

    const handleUp = () => {
      setDraggedCLOId(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const getViewportAnchor = () => {
    if (!canvasRef.current) {
      return { x: 40, y: 40, width: NUM_COLUMNS * columnWidth };
    }
    const container = canvasRef.current;
    const width = container.offsetWidth;
    const x = container.scrollLeft + width / 2;
    const y = container.scrollTop + 140;
    return { x, y, width };
  };

  const addPlaygroundUnit = () => {
    const anchor = getViewportAnchor();
    const snappedX = Math.max(0, Math.min(anchor.x - columnWidth / 2, anchor.width - columnWidth));
    const newId = Date.now();

    setUnitBoxes((prev) => [
      ...prev,
      {
        id: newId,
        name: `Playground Unit ${prev.length + 1}`,
        unitId: `PLAY-${prev.length + 1}`,
        description: "Temporary unit for whiteboard exploration.",
        credits: 6,
        semestersOffered: [1, 2],
        x: snappedX,
        y: anchor.y,
        color: "#3B82F6",
        width: columnWidth,
      },
    ]);
  };

  const addPlaygroundCLO = () => {
    const anchor = getViewportAnchor();
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const cloNumber = (cloBoxes.filter((c) => c.isCustom).length + 1);

    setCloBoxes((prev) => [
      ...prev,
      {
        id,
        clo: {
          cloId: id,
          cloDesc: `Playground CLO ${cloNumber}`,
          courseId: currentCourse?.courseId,
        },
        x: Math.max(0, Math.min(anchor.x - CLO_BOX_SIZE / 2, anchor.width - CLO_BOX_SIZE)),
        y: anchor.y,
        isCustom: true,
      },
    ]);
  };

  const addPlaygroundULO = () => {
    const anchor = getViewportAnchor();
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const uloNumber = uloBoxes.length + 1;

    setUloBoxes((prev) => [
      ...prev,
      {
        id,
        ulo: {
          uloId: null,
          uloDesc: `Playground ULO ${uloNumber}`,
          unitId: "",
          cloId: null,
        },
        x: Math.max(
          0,
          Math.min(anchor.x - (columnWidth * ULO_WIDTH_RATIO) / 2, anchor.width - columnWidth * ULO_WIDTH_RATIO)
        ),
        y: anchor.y,
      },
    ]);
  };

  const addPlaygroundAssessment = () => {
    const anchor = getViewportAnchor();
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const assessmentNumber = assessmentBoxes.length + 1;

    setAssessmentBoxes((prev) => [
      ...prev,
      {
        id,
        assessment: {
          assessmentId: null,
          aDesc: `Playground Assessment ${assessmentNumber}`,
          unitId: "",
          assessmentType: "General",
          assessmentConditions: "",
          hurdleReq: null,
          unitLosIds: [],
        },
        x: Math.max(
          0,
          Math.min(
            anchor.x - (columnWidth * ASSESSMENT_WIDTH_RATIO) / 2,
            anchor.width - columnWidth * ASSESSMENT_WIDTH_RATIO
          )
        ),
        y: anchor.y,
      },
    ]);
  };

  const handleULOMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const uloBox = uloBoxes.find((u) => u.id === id);
    if (!uloBox || !canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - uloBox.x, y: mouseY - uloBox.y };
    setDraggedULOId(id);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x: newMouseX, y: newMouseY } = getMouseCoords(moveEvent, canvasRef.current);

      setUloBoxes((prev) =>
        prev.map((box) => {
          if (box.id !== id) return box;
          return {
            ...box,
            x: Math.max(
              0,
              Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - columnWidth * ULO_WIDTH_RATIO)
            ),
            y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 80)),
          };
        })
      );
    };

    const handleUp = () => {
      setDraggedULOId(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleAssessmentMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    const assessmentBox = assessmentBoxes.find((a) => a.id === id);
    if (!assessmentBox || !canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - assessmentBox.x, y: mouseY - assessmentBox.y };
    setDraggedAssessmentId(id);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x: newMouseX, y: newMouseY } = getMouseCoords(moveEvent, canvasRef.current);

      setAssessmentBoxes((prev) =>
        prev.map((box) => {
          if (box.id !== id) return box;
          return {
            ...box,
            x: Math.max(
              0,
              Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - columnWidth * ASSESSMENT_WIDTH_RATIO)
            ),
            y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 80)),
          };
        })
      );
    };

    const handleUp = () => {
      setDraggedAssessmentId(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  useEffect(() => {
    registerWhiteboardHandlers({
      addUnit: addPlaygroundUnit,
      addCLO: addPlaygroundCLO,
      addULO: addPlaygroundULO,
      addAssessment: addPlaygroundAssessment,
    });
    return () => clearWhiteboardHandlers();
  }, []);

  const startEdit = (id: number) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleFormSave = (formData: UnitFormData) => {
    if (!editingId) return;

    const editedUnit = unitBoxes.find((unit) => unit.id === editingId);
    if (!editedUnit) return;

    updateUnit(editedUnit.unitId!, {
      unitName: formData.unitName || editedUnit.name,
      unitDesc: formData.unitDesc || editedUnit.description,
      credits: formData.credits || editedUnit.credits,
      semestersOffered: formData.semestersOffered || editedUnit.semestersOffered,
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
                  semestersOffered: formData.semestersOffered || unit.semestersOffered,
                  color: formData.color || unit.color,
                }
              : unit
          )
        );
        setEditingId(null);
        setShowForm(false);
      })
      .catch((err: any) => console.error("Error updating unit:", err));
  };

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

  const handleSaveCanvas = () => {
    alert("Whiteboard view is currently unsaved.");
  };

  const handleUnitRightClick = (e: React.MouseEvent, unitKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, unitId: unitKey });
  };

  const handleToggleCLO = (unitKey: string, clo: CourseLearningOutcome, add: boolean) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (add) {
        if (unitData.clos.some((c) => c.cloId === clo.cloId)) return prev;
        return { ...prev, [unitKey]: { ...unitData, clos: [...unitData.clos, clo] } };
      }
      return {
        ...prev,
        [unitKey]: { ...unitData, clos: unitData.clos.filter((c) => c.cloId !== clo.cloId) },
      };
    });
  };

  const handleToggleTag = (unitKey: string, tag: Tag, add: boolean) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (add) {
        if (unitData.tags.some((t) => t.tagId === tag.tagId)) return prev;
        if (currentCourse?.courseId) {
          addUnitTags([{ courseId: currentCourse.courseId, unitId: unitKey, tagId: tag.tagId }]);
        }
        return { ...prev, [unitKey]: { ...unitData, tags: [...unitData.tags, tag] } };
      }
      return {
        ...prev,
        [unitKey]: { ...unitData, tags: unitData.tags.filter((t) => t.tagId !== tag.tagId) },
      };
    });
  };

  const handleDropOnUnit = (unitKey: string, transferItem: any) => {
    setUnitMappings((prev) => {
      const unitData = prev[unitKey] || { clos: [], tags: [] };
      if (transferItem.type === "clo") {
        if (!unitData.clos.find((c) => c.cloId === transferItem.data.cloId)) {
          return { ...prev, [unitKey]: { ...unitData, clos: [...unitData.clos, transferItem.data] } };
        }
      } else if (transferItem.type === "tag") {
        if (!unitData.tags.find((t) => t.tagId === transferItem.data.tagId)) {
          if (currentCourse?.courseId) {
            addUnitTags([{ courseId: currentCourse.courseId, unitId: unitKey, tagId: transferItem.data.tagId }]);
          }
          return { ...prev, [unitKey]: { ...unitData, tags: [...unitData.tags, transferItem.data] } };
        }
      }
      return prev;
    });
  };

  const handleUnitBoxDrop = (unitKey: string, parsed: any) => {
    handleDropOnUnit(unitKey, parsed);
    const unit = unitBoxes.find((u) => u.unitId === unitKey || u.id.toString() === unitKey);
    if (unit && !expandedUnits.has(unit.id)) {
      setExpandedUnits((prev) => new Set(prev).add(unit.id));
    }
    if (unit) {
      setActiveTabs((prev) => ({ ...prev, [unit.id]: parsed.type === "clo" ? "clos" : "tags" }));
    }
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

  // const innerWidth = 5000; // removed unused
  const innerHeight = 3000;
  const closeContextMenu = () => setContextMenu((prev) => ({ ...prev, visible: false }));

  return (
    <div className="flex h-screen relative overflow-hidden pt-16" onClick={closeContextMenu}>
      {/* Sidebar: 1/6 width, left */}
      <div className="flex flex-col h-full z-20 w-1/6 min-w-[200px] max-w-[400px] border-r shadow-xl">
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
        />
      </div>

      {/* Canvas: 5/6 width, right */}
      <div ref={canvasRef} className="w-5/6 bg-white overflow-auto relative" style={{ userSelect: "none" }}>
        <div
          className="relative"
          style={{
            width: `100%`,
            height: `${innerHeight}px`,
            backgroundColor: '#fff',
            backgroundImage:
              'radial-gradient(#d1d5db 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0',
          }}
        >
          {/* 9 column separators matching canvas width */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`col-separator-${i}`}
              style={{
                position: 'absolute',
                left: `calc(${((i + 1) / 9) * 100}% )`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'rgba(128,128,128,0.25)',
                zIndex: 1,
              }}
            />
          ))}
          {unitBoxes.map((unit) => (
            <UnitBox
              key={unit.id}
              unit={{ ...unit, width: columnWidth }}
              draggedUnit={draggedUnit}
              selectedUnits={selectedUnits}
              connectionMode={connectionMode}
              connectionSource={connectionSource}
              isExpanded={expandedUnits.has(unit.id)}
              activeTab={activeTabs[unit.id] || "info"}
              unitMappings={unitMappings[unit.unitId || unit.id.toString()] || { clos: [], tags: [] }}
              currentCLOs={currentCLOs || []}
              onMouseDown={handleMouseDown}
              onDoubleClick={(unitId) => {
                if (isDragging) return;
                startEdit(unitId);
              }}
              onClick={() => undefined}
              onMouseEnter={() => undefined}
              onMouseLeave={() => undefined}
              onContextMenu={handleUnitRightClick}
              onDrop={handleUnitBoxDrop}
              toggleExpand={toggleExpand}
              setActiveTab={(id, tab) => setActiveTabs((prev) => ({ ...prev, [id]: tab }))}
              deleteUnit={(unitId) => {
                const targetUnit = unitBoxes.find((u) => u.id === unitId);
                setUnitBoxes(unitBoxes.filter((u) => u.id !== unitId));
                if (targetUnit?.unitId) {
                  setUnitMappings((prev) => {
                    const next = { ...prev };
                    delete next[targetUnit.unitId!];
                    return next;
                  });
                }
              }}
              getCLOColor={getCLOColor}
            />
          ))}

          {cloBoxes.map((cloBox) => (
            <CLOBox
              key={cloBox.id}
              clo={cloBox.clo}
              x={cloBox.x}
              y={cloBox.y}
              width={CLO_BOX_SIZE}
              isDragging={draggedCLOId === cloBox.id}
              isSelected={selectedCLOId === cloBox.id}
              color={getCLOColor(cloBox.clo.cloId || 0)}
              onMouseDown={(e) => handleCLOMouseDown(e, cloBox.id)}
              onClick={() => setSelectedCLOId((prev) => (prev === cloBox.id ? null : cloBox.id))}
              onDescriptionUpdate={(newDescription) => {
                // Update local state
                setCloBoxes((prev) =>
                  prev.map((box) =>
                    box.id === cloBox.id
                      ? {
                          ...box,
                          clo: { ...box.clo, cloDesc: newDescription },
                        }
                      : box
                  )
                );
                
                // Update via API if not custom CLO
                if (!cloBox.isCustom && cloBox.clo.cloId && cloBox.clo.courseId) {
                  cloStore.updateCLO({
                    cloId: cloBox.clo.cloId,
                    cloDesc: newDescription,
                    courseId: cloBox.clo.courseId,
                  });
                }
              }}
              onDelete={() => {
                setCloBoxes((prev) => prev.filter((box) => box.id !== cloBox.id));
                setSelectedCLOId((prev) => (prev === cloBox.id ? null : prev));
              }}
            />
          ))}

          {uloBoxes.map((uloBox) => {
            const linkedUnit = unitBoxes.find((unit) => unit.unitId === uloBox.ulo.unitId);
            const uloColor = linkedUnit?.color || "#06B6D4";

            return (
            <ULOBox
              key={uloBox.id}
              ulo={uloBox.ulo}
              x={uloBox.x}
              y={uloBox.y}
              width={columnWidth * ULO_WIDTH_RATIO}
              isDragging={draggedULOId === uloBox.id}
              isSelected={selectedULOId === uloBox.id}
              color={uloColor}
              onMouseDown={(e) => handleULOMouseDown(e, uloBox.id)}
              onClick={() => setSelectedULOId((prev) => (prev === uloBox.id ? null : uloBox.id))}
              availableUnits={savedCourseUnits}
              availableCLOs={((currentCLOs || []) as CourseLearningOutcome[]).filter(
                (clo): clo is CourseLearningOutcome & { cloId: number } => typeof clo.cloId === "number"
              )}
              onUpdate={(updated) => {
                const nextCloIds = Array.from(new Set(updated.cloIds));
                const primaryCloId = nextCloIds.length > 0 ? nextCloIds[0] : null;

                setUloBoxes((prev) =>
                  prev.map((box) =>
                    box.id === uloBox.id
                      ? {
                          ...box,
                          ulo: {
                            ...box.ulo,
                            uloDesc: updated.uloDesc,
                            unitId: updated.unitId,
                            cloId: primaryCloId,
                            cloIds: nextCloIds,
                            assessmentIds: updated.assessmentIds,
                          },
                        }
                      : box
                  )
                );

                // Persist only when a real linked unit is selected.
                if (!updated.unitId) {
                  return;
                }

                if (typeof uloBox.ulo.uloId === "number") {
                  axiosInstance
                    .put(`/ULO/update/${uloBox.ulo.uloId}`, {
                      uloDesc: updated.uloDesc,
                      unitId: updated.unitId,
                      cloId: primaryCloId,
                    })
                    .catch((error) => {
                      console.error("Error updating ULO:", error);
                      alert("Failed to save linked ULO fields to backend.");
                    });
                } else {
                  axiosInstance
                    .post("/ULO/create", {
                      uloDesc: updated.uloDesc,
                      unitId: updated.unitId,
                      cloId: primaryCloId,
                    })
                    .then((response) => {
                      const created = response.data as UnitLearningOutcome;
                      const backendUloId = Number(created.uloId);

                      if (!Number.isInteger(backendUloId)) {
                        throw new Error("ULO was created but backend did not return a valid uloId.");
                      }

                      setUloBoxes((prev) =>
                        prev.map((box) =>
                          box.id === uloBox.id
                            ? {
                                ...box,
                                id: backendUloId,
                                ulo: {
                                  ...box.ulo,
                                  uloId: backendUloId,
                                },
                              }
                            : box
                        )
                      );

                      setSelectedULOId((prevSelected) =>
                        prevSelected === uloBox.id ? backendUloId : prevSelected
                      );
                      setDraggedULOId((prevDragged) =>
                        prevDragged === uloBox.id ? backendUloId : prevDragged
                      );
                    })
                    .catch((error) => {
                      console.error("Error creating ULO:", error);
                      alert("Failed to create ULO in backend.");
                    });
                }
              }}
              onDelete={() => {
                if (typeof uloBox.ulo.uloId === "number") {
                  axiosInstance
                    .delete("/ULO/delete", {
                      data: { uloId: uloBox.ulo.uloId },
                    })
                    .then(() => {
                      setUloBoxes((prev) => prev.filter((box) => box.id !== uloBox.id));
                      setSelectedULOId((prev) => (prev === uloBox.id ? null : prev));
                    })
                    .catch((error) => {
                      console.error("Error deleting ULO:", error);
                      alert("Failed to delete ULO from backend.");
                    });
                  return;
                }

                setUloBoxes((prev) => prev.filter((box) => box.id !== uloBox.id));
                setSelectedULOId((prev) => (prev === uloBox.id ? null : prev));
              }}
            />
            );
          })}

          {assessmentBoxes.map((assessmentBox) => {
            const linkedUnit = unitBoxes.find((unit) => unit.unitId === assessmentBox.assessment.unitId);
            const assessmentColor = linkedUnit?.color || "#D97706";

            return (
              <AssessmentBox
                key={assessmentBox.id}
                assessment={assessmentBox.assessment}
                x={assessmentBox.x}
                y={assessmentBox.y}
                width={columnWidth * ASSESSMENT_WIDTH_RATIO}
                isDragging={draggedAssessmentId === assessmentBox.id}
                isSelected={selectedAssessmentId === assessmentBox.id}
                color={assessmentColor}
                onMouseDown={(e) => handleAssessmentMouseDown(e, assessmentBox.id)}
                onClick={() =>
                  setSelectedAssessmentId((prev) => (prev === assessmentBox.id ? null : assessmentBox.id))
                }
                availableUnits={savedCourseUnits}
                availableULOs={uloBoxes
                  .map((box) => ({
                    uloId: box.ulo.uloId,
                    uloDesc: box.ulo.uloDesc,
                    unitId: box.ulo.unitId,
                  }))
                  .filter(
                    (ulo): ulo is { uloId: number; uloDesc: string; unitId: string } =>
                      typeof ulo.uloId === "number" && !!ulo.unitId
                  )}
                onUpdate={(updated) => {
                  setAssessmentBoxes((prev) =>
                    prev.map((box) =>
                      box.id === assessmentBox.id
                        ? {
                            ...box,
                            assessment: {
                              ...box.assessment,
                              aDesc: updated.aDesc,
                              unitId: updated.unitId,
                              assessmentType: updated.assessmentType,
                              assessmentConditions: updated.assessmentConditions,
                              hurdleReq: updated.hurdleReq,
                              unitLosIds: updated.unitLosIds,
                            },
                          }
                        : box
                    )
                  );

                  if (!updated.unitId) {
                    return;
                  }

                  if (typeof assessmentBox.assessment.assessmentId === "number") {
                    axiosInstance
                      .put(`/assessment/update/${assessmentBox.assessment.assessmentId}`, {
                        aDesc: updated.aDesc,
                        unitId: updated.unitId,
                        assessmentType: updated.assessmentType,
                        assessmentConditions: updated.assessmentConditions,
                        hurdleReq: updated.hurdleReq,
                        unitLos: updated.unitLosIds,
                      })
                      .catch((error) => {
                        console.error("Error updating assessment:", error);
                        alert("Failed to save linked assessment fields to backend.");
                      });
                  } else {
                    axiosInstance
                      .post("/assessment/create", {
                        aDesc: updated.aDesc,
                        unitId: updated.unitId,
                        assessmentType: updated.assessmentType,
                        assessmentConditions: updated.assessmentConditions,
                        hurdleReq: updated.hurdleReq,
                        unitLos: updated.unitLosIds,
                      })
                      .then((response) => {
                        const created = response.data as Assessment & { unitLos?: Array<{ uloId: number }> };
                        const backendAssessmentId = Number(created.assessmentId);

                        if (!Number.isInteger(backendAssessmentId)) {
                          throw new Error("Assessment was created but backend did not return a valid assessmentId.");
                        }

                        setAssessmentBoxes((prev) =>
                          prev.map((box) =>
                            box.id === assessmentBox.id
                              ? {
                                  ...box,
                                  id: backendAssessmentId,
                                  assessment: {
                                    ...box.assessment,
                                    assessmentId: backendAssessmentId,
                                    assessmentType: updated.assessmentType,
                                    assessmentConditions: updated.assessmentConditions,
                                    hurdleReq: updated.hurdleReq,
                                    unitLosIds: Array.isArray(created.unitLos)
                                      ? created.unitLos.map((link) => link.uloId)
                                      : updated.unitLosIds,
                                  },
                                }
                              : box
                          )
                        );

                        setSelectedAssessmentId((prevSelected) =>
                          prevSelected === assessmentBox.id ? backendAssessmentId : prevSelected
                        );
                        setDraggedAssessmentId((prevDragged) =>
                          prevDragged === assessmentBox.id ? backendAssessmentId : prevDragged
                        );
                      })
                      .catch((error) => {
                        console.error("Error creating assessment:", error);
                        alert("Failed to create assessment in backend.");
                      });
                  }
                }}
                onDelete={() => {
                  setAssessmentBoxes((prev) => prev.filter((box) => box.id !== assessmentBox.id));
                  setSelectedAssessmentId((prev) => (prev === assessmentBox.id ? null : prev));
                }}
              />
            );
          })}
        </div>

        {showForm && editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Unit</h2>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <UnitForm
                onSave={handleFormSave}
                initialData={{
                  unitId: unitBoxes.find((u) => u.id === editingId)?.unitId || null,
                  unitName: unitBoxes.find((u) => u.id === editingId)?.name || null,
                  unitDesc: unitBoxes.find((u) => u.id === editingId)?.description || null,
                  credits: unitBoxes.find((u) => u.id === editingId)?.credits || null,
                  semestersOffered: unitBoxes.find((u) => u.id === editingId)?.semestersOffered || null,
                  color: unitBoxes.find((u) => u.id === editingId)?.color || null,
                }}
              />
            </div>
          </div>
        )}

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

      {draggedNewUnit && (
        <div
          className="fixed pointer-events-none z-[200] opacity-80"
          style={{ left: draggedNewUnit.x - columnWidth / 2, top: draggedNewUnit.y - 40, width: columnWidth }}
        >
          <div className="bg-blue-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">{draggedNewUnit.unit.unitId}</h2>
            <p className="text-xs text-center opacity-80">{draggedNewUnit.unit.unitName}</p>
          </div>
        </div>
      )}

      {contextMenu.visible && contextMenu.unitId && (
        <div
          className="fixed bg-white border border-gray-200 shadow-2xl rounded-lg flex flex-col text-left z-[300] overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: "220px", maxWidth: "280px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
            <span className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">Quick Mapping - {contextMenu.unitId}</span>
            <button onClick={closeContextMenu} className="text-gray-400 hover:text-gray-700 leading-none">x</button>
          </div>

          <div className="overflow-y-auto max-h-[300px] p-2 flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-bold text-purple-600 mb-1 block uppercase tracking-wider">Course Outcomes</span>
              {currentCLOs && currentCLOs.length > 0 ? currentCLOs.map((clo: CourseLearningOutcome) => {
                const isMapped = unitMappings[contextMenu.unitId!]?.clos?.some((c) => c.cloId === clo.cloId);
                return (
                  <label key={clo.cloId} className="flex items-start gap-2 p-1.5 hover:bg-purple-50 rounded cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      checked={!!isMapped}
                      onChange={(e) => handleToggleCLO(contextMenu.unitId!, clo, e.target.checked)}
                    />
                    <span className="text-gray-700 text-xs leading-tight group-hover:text-purple-900">{clo.cloDesc}</span>
                  </label>
                );
              }) : <span className="text-xs text-gray-400 italic px-1">No CLOs to map.</span>}
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="text-[10px] font-bold text-green-600 mb-1 block uppercase tracking-wider">Tags</span>
              {existingTags && existingTags.length > 0 ? existingTags.map((tag: Tag) => {
                const isMapped = unitMappings[contextMenu.unitId!]?.tags?.some((t) => t.tagId === tag.tagId);
                return (
                  <label key={tag.tagId} className="flex items-center gap-2 p-1.5 hover:bg-green-50 rounded cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      checked={!!isMapped}
                      onChange={(e) => handleToggleTag(contextMenu.unitId!, tag, e.target.checked)}
                    />
                    <span className="text-gray-700 text-xs group-hover:text-green-900">{tag.tagName}</span>
                  </label>
                );
              }) : <span className="text-xs text-gray-400 italic px-1">No tags available.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardCanvas;
