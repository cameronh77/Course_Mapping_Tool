import React, { useState, useEffect, useRef } from "react";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { UnitBox } from "../components/common/UnitBox";
import { GridBackground } from "../components/common/GridBackground";
import { ConnectionLines } from "../components/common/ConnectionLines";
import { AddTagMenu } from "../components/common/AddTagMenu";
import { axiosInstance } from "../lib/axios";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import { useCLOStore } from "../stores/useCLOStore";
import { useTagStore } from "../stores/useTagStore";
import { useNavigate } from "react-router-dom";
import type {
  Unit,
  CourseLearningOutcome,
  UnitBox as UnitBoxType,
  AssessmentBox as AssessmentBoxType,
  unitLearningOutcomeBox as unitLearningOutcomeBoxType,
  UnitMappings,
  Assessment,
  unitLearningOutcome,
} from "../types";
import { useAssessmentStore } from "../stores/useAssessmentStore";
import { AssessmentBox } from "../components/common/AssessmentBox";
import type { AssessmentFormData } from "../components/common/AssessmentForm";
import AssessmentForm from "../components/common/AssessmentForm";
import {
  UnitSidebar,
  type AssessmentTemplate,
} from "../components/layout/UnitCanvasSideBar";
import { ULOBox } from "../components/common/ULOBox";
import UnitLearningOutcomeForm from "../components/common/ULOForm";
import { useULOStore } from "../stores/useULOStore";

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

export const UnitInternalCanvas: React.FC = () => {
  const [assessmentBoxes, setAssessmentBoxes] = useState<AssessmentBoxType[]>(
    []
  );

  const [uloBoxes, setULOBoxes] = useState<unitLearningOutcomeBoxType[]>([]);

  // UX State - Sidebar Navigation Tab
  const [sidebarTab, setSidebarTab] = useState<
    "unit components" | "connections" | "mapping"
  >("unit components");

  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // State for dragging existing Assessments
  const [draggedAssessment, setDraggedAssessment] = useState<number | null>(
    null
  );

  const [draggedULO, setDraggedULO] = useState<number | null>(null);

  const [showULOForm, setShowULOForm] = useState<boolean>(false);
  const [showCreateULOForm, setShowCreateULOForm] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // State for dragging NEW units from sidebar
  const [draggedNewAssessment, setDraggedNewAssessment] = useState<{
    assessment: Assessment;
    x: number;
    y: number;
  } | null>(null);

  const [draggedNewULO, setDraggedNewULO] = useState<{
    id: number;
    ulo: unitLearningOutcome;
    x: number;
    y: number;
  } | null>(null);

  // State for hover highlighting connections
  const [hoveredAssessment, setHoveredAssessment] = useState<string | null>(
    null
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const { currentUnit } = useUnitStore();
  const { currentCLOs } = useCLOStore();
  const { currentAssessments } = useAssessmentStore();
  const { currentCourse } = useCourseStore();

  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // States for unit search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const { checkUnitExists, viewUnits, createUnit, updateUnit } = useUnitStore();
  const { createAssessment, viewAssessments, updateAssessment } =
    useAssessmentStore();
  const { currentULOS, createULO, viewULOsByUnit, updateULO } = useULOStore();

  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [showCreateAssessmentForm, setShowCreateAssessmentForm] =
    useState<boolean>(false);

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
  const [showAssessmentForm, setShowAssessmentForm] = useState<Boolean>(false);

  useEffect(() => {
    const loadUnits = async () => {
      await viewUnits();
      if (currentCourse?.courseId) {
        await viewCourseTags(currentCourse.courseId);
        await viewUnitTagsByCourse(currentCourse.courseId);
      }
    };
    loadUnits();
  }, [currentCourse?.courseId]);

  useEffect(() => {
    const loadRelationships = async () => {
      if (currentCourse?.courseId) {
        try {
          const response = await axiosInstance.get(
            `/unit-relationship/view?courseId=${currentCourse.courseId}`
          );
          setRelationships(response.data);
        } catch (error) {
          console.error("Error loading relationships:", error);
        }
      }
    };
    loadRelationships();
  }, [currentCourse?.courseId]);

  useEffect(() => {
    const loadCanvasState = async () => {
      if (currentUnit?.unitId) {
        try {
          const response = await viewAssessments(currentUnit.unitId);
          console.log("This is the data", response);
          const courseUnits = response.data;
          const loadedAssessmentBoxes = courseUnits.map((assessment: any) => ({
            id: assessment.id,
            description: assessment.description,
            x: assessment.position.x,
            y: assessment.position.y,
          }));
          setAssessmentBoxes(loadedAssessmentBoxes);

          // Load existing CLO and Tag mappings for each unit
          const mappingsData: UnitMappings = {};

          // Get all CLOs for this course - fetch fresh data
          await useCLOStore.getState().viewCLOsByCourse(currentCourse);
          const allCLOs = useCLOStore.getState().currentCLOs;

          // Load all ULOs once instead of per unit
          let allULOs: any[] = [];
          try {
            const uloResponse = await axiosInstance.get(`/ULO/view`);
            allULOs = uloResponse.data || [];
          } catch (error) {
            console.error("Error loading unit learning outcomes:", error);
          }
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }
    };
    loadCanvasState();
  }, [currentUnit]);

  useEffect(() => {
    const loadCLOs = async () => {
      if (currentCourse?.courseId) {
        await useCLOStore.getState().viewCLOsByCourse(currentCourse);
      }
    };
    loadCLOs();
  }, [currentCourse?.courseId]);

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

  const handleSaveCanvas = async () => {
    if (currentCourse?.courseId) {
      try {
        await axiosInstance.post(
          `/course-unit/canvas/${currentCourse.courseId}`,
          {
            units: unitBoxes,
            unitMappings: unitMappings,
          }
        );
        alert("Canvas saved successfully!");
      } catch (error) {
        console.error("Error saving canvas:", error);
        alert("Failed to save canvas.");
      }
    }
  };

  function handleMouseDown(e: React.MouseEvent, strid: string) {
    setContextMenu({ visible: false, x: 0, y: 0, unitId: undefined });
    e.preventDefault();
    e.stopPropagation();

    const id = Number(strid);
    const assessment = assessmentBoxes.find((a) => a.id === id);
    console.log(strid);
    if (!assessment || !canvasRef.current) return;
    console.log("mouse is down");
    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - assessment.x, y: mouseY - assessment.y };
    setDragOffset(offset);
    setDraggedAssessment(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      setIsDragging(true);
      const { x: newMouseX, y: newMouseY } = getMouseCoords(
        moveEvent,
        canvasRef.current
      );
      setAssessmentBoxes((prevAssessments) =>
        prevAssessments.map((a) =>
          a.id === id
            ? {
                ...a,
                x: Math.max(
                  0,
                  Math.min(
                    newMouseX - offset.x,
                    canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH
                  )
                ),
                y: Math.max(
                  0,
                  Math.min(
                    newMouseY - offset.y,
                    canvasRef.current!.scrollHeight - 100
                  )
                ),
              }
            : a
        )
      );
    };

    const handleUp = () => {
      setAssessmentBoxes((prevAssessments) =>
        prevAssessments.map((a) => {
          if (a.id === id) {
            return { ...a, x: a.x, y: a.y };
          }
          return a;
        })
      );
      setDraggedAssessment(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setTimeout(() => setIsDragging(false), 100);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  function handleULOBoxMouseDown(e: React.MouseEvent, strid: string) {
    setContextMenu({ visible: false, x: 0, y: 0, unitId: undefined });
    e.preventDefault();
    e.stopPropagation();

    const id = Number(strid);
    const ulo = uloBoxes.find((u) => u.id === id);
    console.log(strid);
    if (!ulo || !canvasRef.current) return;
    console.log("mouse is down");
    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - ulo.x, y: mouseY - ulo.y };
    setDragOffset(offset);
    setDraggedULO(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      setIsDragging(true);
      const { x: newMouseX, y: newMouseY } = getMouseCoords(
        moveEvent,
        canvasRef.current
      );
      setULOBoxes((prevULOs) =>
        prevULOs.map((u) =>
          u.id === id
            ? {
                ...u,
                x: Math.max(
                  0,
                  Math.min(
                    newMouseX - offset.x,
                    canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH
                  )
                ),
                y: Math.max(
                  0,
                  Math.min(
                    newMouseY - offset.y,
                    canvasRef.current!.scrollHeight - 100
                  )
                ),
              }
            : a
        )
      );
    };

    const handleUp = () => {
      setULOBoxes((prevULOs) =>
        prevULOs.map((u) => {
          if (u.id === id) {
            return { ...u, x: u.x, y: u.y };
          }
          return u;
        })
      );
      setDraggedULO(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setTimeout(() => setIsDragging(false), 100);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  const handleNewAssessmentMouseDown = (
    e: React.MouseEvent,
    template: AssessmentTemplate
  ) => {
    e.preventDefault();

    console.log("test");
    if (!currentUnit) return;
    const newAssessment: Assessment = {
      dbID: null,
      id: Date.now(),
      name: "",
      value: null,
      hurdleReq: null,
      description: "",
      type: "Project",
      x: e.clientX,
      y: e.clientY,
      unitId: currentUnit.unitId,
      feedbackDetails: [],
      feedbackWeek: [],
      dueWeek: [],
      conditions: "",
    };

    setDraggedNewAssessment({
      assessment: newAssessment,
      x: e.clientX,
      y: e.clientY,
    });

    const handleGlobalMove = (moveEvent: MouseEvent) => {
      setDraggedNewAssessment((prev) =>
        prev
          ? {
              ...prev,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
            }
          : null
      );
    };

    const handleGlobalUp = (upEvent: MouseEvent) => {
      console.log("this is hit");
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

          addAssessmentToCanvasAtPos(
            newAssessment,
            canvasCoords.x - UNIT_BOX_WIDTH / 2,
            canvasCoords.y - 40
          );
        }
      }

      setDraggedNewAssessment(null);
    };

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);
  };

  const addAssessmentToCanvasAtPos = (
    selectedAssessment: Assessment,
    x: number,
    y: number,
    color?: string
  ) => {
    const newAssessment = {
      id: selectedAssessment.id,

      description: selectedAssessment.description,
      type: selectedAssessment.type,
      x: x,
      y: y,
      color: color || "#3B82F6",
      unitId: currentUnit.unitId,
    };

    setShowCreateAssessmentForm(true);
    setAssessmentBoxes((prev) => [...prev, newAssessment]);
  };

  function handleAssessmentFormSave(formData: AssessmentFormData) {
    if (editingId) {
      const editedAssessment = assessmentBoxes.find(
        (assessment) => assessment.id === editingId
      );
      if (editedAssessment) {
        updateAssessment(editedAssessment.id!, {
          description: formData.description || editedAssessment.description,
          type: formData.type || editedAssessment.type,
          name: formData.name || editedAssessment.name,
          value: formData.value || editedAssessment.value,
          hurdleReq: formData.hurdleReq || editedAssessment.hurdleReq,
          dueWeek: formData.dueWeek || editedAssessment.dueWeek,
          conditions: formData.conditions || editedAssessment.conditions,
          feedbackWeek: formData.feedbackWeek || editedAssessment.feedbackWeek,
          feedbackDetails:
            formData.feedbackDetails || editedAssessment.feedbackDetails,
        })
          .then(() => {
            setAssessmentBoxes(
              assessmentBoxes.map((assessment) =>
                assessment.id === editingId
                  ? {
                      ...assessment,
                      description:
                        formData.description || editedAssessment.description,
                      type: formData.type || editedAssessment.type,
                      name: formData.name || editedAssessment.name,
                      value: formData.value || editedAssessment.value,
                      hurdleReq:
                        formData.hurdleReq || editedAssessment.hurdleReq,
                      dueWeek: formData.dueWeek || editedAssessment.dueWeek,
                      conditions:
                        formData.conditions || editedAssessment.conditions,
                      feedbackWeek:
                        formData.feedbackWeek || editedAssessment.feedbackWeek,
                      feedbackDetails:
                        formData.feedbackDetails ||
                        editedAssessment.feedbackDetails,
                    }
                  : assessment
              )
            );
            setEditingId(null);
            setShowAssessmentForm(false);
          })
          .catch((err) => console.error("Error updating unit:", err));
      }
    }
  }

  const handleNewULOMouseDown = (
    e: React.MouseEvent,
    template: AssessmentTemplate
  ) => {
    e.preventDefault();

    console.log("test");
    if (!currentUnit) return;
    const newULO: unitLearningOutcome = {
      uloDesc: "",
      unitId: currentUnit.unitId,
    };

    setDraggedNewULO({
      id: Date.now(),
      ulo: newULO,
      x: e.clientX,
      y: e.clientY,
    });

    const handleGlobalMove = (moveEvent: MouseEvent) => {
      setDraggedNewULO((prev) =>
        prev
          ? {
              ...prev,
              x: moveEvent.clientX,
              y: moveEvent.clientY,
            }
          : null
      );
    };

    const handleGlobalUp = (upEvent: MouseEvent) => {
      console.log("this is hit");
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

          addULOToCanvasAtPos(
            newULO,
            canvasCoords.x - UNIT_BOX_WIDTH / 2,
            canvasCoords.y - 40
          );
        }
      }

      setDraggedNewULO(null);
    };

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);
  };

  const addULOToCanvasAtPos = (
    selectedULO: unitLearningOutcome,
    x: number,
    y: number,
    color?: string
  ) => {
    const newULO = {
      uloDesc: selectedULO.uloDesc,
      x: x,
      y: y,
      color: color || "#3B82F6",
      unitId: currentUnit.unitId,
      id: selectedULO.id,
    };

    setShowCreateULOForm(true);
    setULOBoxes((prev) => [...prev, newULO]);
  };

  function cancelEdit() {
    setEditingId(null);
    setShowAssessmentForm(false);
  }

  function handleEditAssessment(id: number) {
    setEditingId(id);
    setShowAssessmentForm(true);
  }

  function deleteAssessment(assessmentId: number) {
    setAssessmentBoxes(
      assessmentBoxes.filter((assessment) => assessment.id !== assessmentId)
    );
  }

  function handleEditULO(id: number) {
    setEditingId(id);
    setShowAssessmentForm(true);
  }

  function deleteULO(uloId: number) {
    setULOBoxes(uloBoxes.filter((ulo) => ulo.id !== uloId));
  }

  const handleCreateAssessment = async (data: AssessmentFormData) => {
    try {
      const newAssessment = await createAssessment({
        description: data.description,
        type: data.type,
        unitId: currentUnit.unitId,

        position: {
          x: data.x,
          y: data.y,
        },
        name: data.name,
        value: data.value,
        hurdleReq: data.hurdleReq,
        feedbackDetails: data.feedbackDetails,
        feedbackWeek: data.feedbackWeek,
        dueWeek: data.dueWeek,
        conditions: data.conditions,
        unit: currentUnit,
      });
      setShowCreateAssessmentForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create Assessment.");
    }
  };

  const handleCreateULO = async (data: unitLearningOutcome) => {
    try {
      const newULO = await createULO({
        description: data.uloDesc,
        unitId: data.unitId,
      });
      setShowCreateAssessmentForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create Assessment.");
    }
  };

  const handleCreateRelationship = async (targetUnitId: string) => {
    if (!connectionMode) return;
    if (!connectionSource || connectionSource === targetUnitId) {
      setConnectionSource(null);
      return;
    }
    try {
      const response = await axiosInstance.post("/unit-relationship/create", {
        unitId: connectionSource,
        relatedId: targetUnitId,
        relationshipType: selectedRelationType,
        courseId: currentCourse.courseId,
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
    try {
      await axiosInstance.delete(`/unit-relationship/delete/${relationshipId}`);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
    } catch (err) {
      alert("Failed to delete relationship");
    }
  };

  const handleAssessmentClickForConnection = (assessmentId: string) => {
    if (!connectionMode) return;
    if (!connectionSource) setConnectionSource(assessmentId);
    else handleCreateRelationship(assessmentId);
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
        return {
          ...prev,
          [unitKey]: { ...unitData, clos: [...unitData.clos, clo] },
        };
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

  return (
    <div
      className="flex h-screen relative overflow-hidden pt-16"
      onClick={() => setContextMenu({ ...contextMenu, visible: false })}
    >
      <div className="flex flex-col h-full z-20 w-[300px] border-r shadow-xl">
        <UnitSidebar
          handleSaveCanvas={handleSaveCanvas}
          handleNewAssessmentMouseDown={handleNewAssessmentMouseDown}
          handleNewULOMouseDown={handleNewULOMouseDown}
          getCLOColor={getCLOColor}
        />
      </div>

      <div
        ref={canvasRef}
        className="flex-1 bg-white overflow-auto relative"
        style={{ userSelect: "none" }}
        onContextMenu={(e) => handleRightClick(e)}
      >
        <div
          className="relative bg-white"
          style={{ width: `${innerWidth}px`, height: `${innerHeight}px` }}
        >
          {assessmentBoxes.map((assessment) => (
            <AssessmentBox
              key={assessment.id}
              assessment={assessment}
              onClick={handleAssessmentClickForConnection}
              onDoubleClick={handleEditAssessment}
              deleteAssessment={deleteAssessment}
              onMouseDown={handleMouseDown}
            ></AssessmentBox>
          ))}
          {uloBoxes.map((ulo) => (
            <ULOBox
              key={ulo.id}
              ulo={ulo}
              onClick={handleAssessmentClickForConnection}
              onDoubleClick={handleEditULO}
              deleteAssessment={deleteULO}
              onMouseDown={handleULOBoxMouseDown}
            ></ULOBox>
          ))}

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 5 }}
          ></svg>
        </div>

        {/* Modal: Edit Unit */}
        {showAssessmentForm && editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">
                  Edit Assessment
                </h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <AssessmentForm
                onSave={handleAssessmentFormSave}
                initialData={{
                  description:
                    assessmentBoxes.find((a) => a.id === editingId)
                      ?.description || undefined,
                  type:
                    assessmentBoxes.find((a) => a.id === editingId)?.type ||
                    null,
                  name:
                    assessmentBoxes.find((a) => a.id === editingId)?.name ||
                    undefined,
                  value:
                    assessmentBoxes.find((a) => a.id === editingId)?.value ||
                    undefined,
                  hurdleReq:
                    assessmentBoxes.find((a) => a.id === editingId)
                      ?.hurdleReq || undefined,
                  dueWeek:
                    assessmentBoxes.find((a) => a.id === editingId)?.dueWeek ||
                    undefined,
                  conditions:
                    assessmentBoxes.find((a) => a.id === editingId)
                      ?.conditions || undefined,
                  feedbackWeek:
                    assessmentBoxes.find((a) => a.id === editingId)
                      ?.feedbackWeek || undefined,
                  feedbackDetails:
                    assessmentBoxes.find((a) => a.id === editingId)
                      ?.feedbackDetails || undefined,
                }}
                onView={() => navigate("/")}
              />
            </div>
          </div>
        )}

        {/* Modal: Create Assessment */}
        {showCreateAssessmentForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">
                  Create Assessment
                </h2>
                <button
                  onClick={() => setShowCreateAssessmentForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <AssessmentForm
                onSave={handleCreateAssessment}
                initialData={{
                  description: undefined,
                  type: "Project",
                }}
                onView={() => console.log("nothing")}
              />
            </div>
          </div>
        )}

        {showCreateULOForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">
                  Create Unit Learning Outcome
                </h2>
                <button
                  onClick={() => setShowCreateULOForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <UnitLearningOutcomeForm
                onSave={handleCreateAssessment}
                initialData={{
                  description: undefined,
                  type: "Project",
                }}
                onView={() => console.log("nothing")}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Drag Preview for New Units */}
      {draggedNewAssessment && (
        <div
          className="fixed pointer-events-none z-[200] opacity-80"
          style={{
            left: draggedNewAssessment.x - UNIT_BOX_WIDTH / 2,
            top: draggedNewAssessment.y - 40,
            width: UNIT_BOX_WIDTH,
          }}
        >
          <div className="bg-blue-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">
              {draggedNewAssessment.assessment.name || "Assessment"}
            </h2>
          </div>
        </div>
      )}

      {draggedNewULO && (
        <div
          className="fixed pointer-events-none z-[200] opacity-80"
          style={{
            left: draggedNewULO.x - UNIT_BOX_WIDTH / 2,
            top: draggedNewULO.y - 40,
            width: UNIT_BOX_WIDTH,
          }}
        >
          <div className="bg-blue-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">
              {"Unit Learning Outcome"}
            </h2>
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
                {/* CLOs Checklist */}
                <div>
                  <span className="text-[10px] font-bold text-purple-600 mb-1 block uppercase tracking-wider">
                    Course Outcomes
                  </span>
                  {currentCLOs && currentCLOs.length > 0 ? (
                    currentCLOs.map((clo) => {
                      const isMapped = unitMappings[
                        contextMenu.unitId!
                      ]?.clos?.some((c) => c.cloId === clo.cloId);
                      return (
                        <label
                          key={clo.cloId}
                          className="flex items-start gap-2 p-1.5 hover:bg-purple-50 rounded cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            checked={!!isMapped}
                            onChange={(e) =>
                              handleToggleCLO(
                                contextMenu.unitId!,
                                clo,
                                e.target.checked
                              )
                            }
                          />
                          <span className="text-gray-700 text-xs leading-tight group-hover:text-purple-900">
                            {clo.cloDesc}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-400 italic px-1">
                      No CLOs to map.
                    </span>
                  )}
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

export default UnitInternalCanvas;
