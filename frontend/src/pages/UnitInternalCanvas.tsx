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
  TeachingActivity,
  TAAssessmentLink,
  TAULOLink,
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
import {
  AssessmentULOLines,
  OrphanWarnings,
  type AssessmentULOLink,
} from "../components/common/AssessmentULOLines";
import { TeachingActivityBox } from "../components/common/TeachingActivityBox";
import TeachingActivityForm from "../components/common/TeachingActivityForm";
import { TeachingActivityLines } from "../components/common/TeachingActivityLines";

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

  // Assessment-ULO link state
  const [assessmentULOLinks, setAssessmentULOLinks] = useState<
    AssessmentULOLink[]
  >([]);
  const [uloConnectionMode, setUloConnectionMode] = useState<boolean>(false);
  const [uloConnectionSource, setUloConnectionSource] = useState<{
    type: "assessment" | "ulo";
    id: number;
  } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Teaching Activity state
  const [teachingActivityBoxes, setTeachingActivityBoxes] = useState<TeachingActivity[]>([]);
  const [draggedTeachingActivity, setDraggedTeachingActivity] = useState<number | null>(null);
  const [draggedNewTA, setDraggedNewTA] = useState<{ activity: TeachingActivity; x: number; y: number } | null>(null);
  const [showCreateTAForm, setShowCreateTAForm] = useState<boolean>(false);
  const [showTAForm, setShowTAForm] = useState<boolean>(false);
  const [taAssessmentLinks, setTAAssessmentLinks] = useState<TAAssessmentLink[]>([]);
  const [taULOLinks, setTAULOLinks] = useState<TAULOLink[]>([]);
  const [taConnectionMode, setTaConnectionMode] = useState<boolean>(false);
  const [taConnectionSource, setTaConnectionSource] = useState<{
    type: "activity" | "assessment" | "ulo";
    id: number;
  } | null>(null);

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
    const loadAssessments = async () => {
      console.log(currentUnit.unitId);
      await viewAssessments(currentUnit.unitId);
    };
    loadAssessments();
  }, [currentUnit.unitId]);

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
      //console.log(currentUnit?.unitId);
      if (currentUnit?.unitId) {
        try {
          // Load assessments
          const response = await axiosInstance.get(
            `/assessment/view?search=${currentUnit.unitId}`
          );
          const assessments = response.data;
          const loadedAssessmentBoxes = assessments.map((a: any) => ({
            id: a.assessmentId,
            dbID: a.assessmentId,
            name: a.assessmentName,
            description: a.assessmentDesc,
            type: a.assessmentType,
            value: a.value,
            hurdleReq: a.hurdleReq,
            dueWeek: a.dueWeek,
            conditions: a.assessmentConditions,
            feedbackWeek: a.feedbackWeek,
            feedbackDetails: a.feedbackDetails,
            unitId: a.unitId,
            x: a.position?.x ?? 100,
            y: a.position?.y ?? 100,
          }));
          setAssessmentBoxes(loadedAssessmentBoxes);

          // Load ULOs for this unit
          const uloResponse = await axiosInstance.get(`/ULO/view`);
          const allULOs = (uloResponse.data || []).filter(
            (u: any) => u.unitId === currentUnit.unitId
          );
          const loadedULOBoxes = allULOs.map((u: any) => ({
            id: u.uloId,
            uloId: u.uloId,
            uloDesc: u.uloDesc,
            unitId: u.unitId,
            cloId: u.cloId,
            x: u.position?.x ?? 500,
            y: u.position?.y ?? 100,
          }));
          setULOBoxes(loadedULOBoxes);

          // Load assessment-ULO links
          const linksResponse = await axiosInstance.get(
            `/assessment-ulo/view?unitId=${currentUnit.unitId}`
          );
          setAssessmentULOLinks(linksResponse.data || []);

          // Load teaching activities
          const taResponse = await axiosInstance.get(
            `/teaching-activity/viewAll/${currentUnit.unitId}`
          );
          const loadedTABoxes = (taResponse.data || []).map((ta: any) => ({
            id: ta.activityId,
            activityId: ta.activityId,
            name: ta.activityName,
            description: ta.activityDesc,
            type: ta.activityType,
            unitId: ta.unitId,
            x: ta.position?.x ?? 800,
            y: ta.position?.y ?? 100,
          }));
          setTeachingActivityBoxes(loadedTABoxes);

          // Load TA-Assessment links
          const taAssessmentRes = await axiosInstance.get(
            `/teaching-activity-links/assessment/view?unitId=${currentUnit.unitId}`
          );
          setTAAssessmentLinks(taAssessmentRes.data || []);

          // Load TA-ULO links
          const taULORes = await axiosInstance.get(
            `/teaching-activity-links/ulo/view?unitId=${currentUnit.unitId}`
          );
          setTAULOLinks(taULORes.data || []);
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
    if (!currentUnit?.unitId) return;
    try {
      // Save each assessment's position
      for (const a of assessmentBoxes) {
        const id = a.dbID ?? a.id;
        await axiosInstance.put(`/assessment/update/${id}`, {
          position: { x: a.x, y: a.y },
        });
      }
      // Save each ULO's position
      for (const u of uloBoxes) {
        const id = u.uloId ?? u.id;
        if (id) {
          await axiosInstance.put(`/ULO/update/${id}`, {
            position: { x: u.x, y: u.y },
          });
        }
      }
      // Save each Teaching Activity's position
      for (const ta of teachingActivityBoxes) {
        const id = ta.activityId ?? ta.id;
        if (id) {
          await axiosInstance.put(`/teaching-activity/update/${id}`, {
            position: { x: ta.x, y: ta.y },
          });
        }
      }
      alert("Canvas saved successfully!");
    } catch (error) {
      console.error("Error saving canvas:", error);
      alert("Failed to save canvas.");
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
            : u
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
    setEditingId(newAssessment?.id);

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
      name: selectedAssessment.name,
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
      console.log(editingId);
      const editedAssessment = assessmentBoxes.find(
        (assessment) => assessment.id === editingId
      );
      console.log(editedAssessment);
      console.log(editedAssessment?.dbId);
      if (editedAssessment) {
        updateAssessment(editedAssessment.dbId, {
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
          position: {
            x: formData.x || editedAssessment.x,
            y: formData.y || editedAssessment.y,
          },
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
                      x: formData.x || editedAssessment.x,
                      y: formData.y || editedAssessment.y,
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

  async function deleteAssessment(assessmentId: number) {
    const box = assessmentBoxes.find((a) => a.id === assessmentId);
    const dbId = box?.dbID ?? assessmentId;
    try {
      await axiosInstance.delete("/assessment/delete", {
        data: { assessmentId: dbId },
      });
    } catch (error) {
      console.error("Failed to delete assessment from DB:", error);
    }
    setAssessmentBoxes(
      assessmentBoxes.filter((assessment) => assessment.id !== assessmentId)
    );
    // Also remove any links for this assessment
    setAssessmentULOLinks((prev) =>
      prev.filter((l) => l.assessmentId !== dbId)
    );
  }

  function handleEditULO(id: number) {
    setEditingId(id);
    setShowULOForm(true);
  }

  async function deleteULO(uloId: number) {
    const box = uloBoxes.find((u) => u.id === uloId);
    const dbId = box?.uloId ?? uloId;
    try {
      await axiosInstance.delete("/ULO/delete", {
        data: { uloId: dbId },
      });
    } catch (error) {
      console.error("Failed to delete ULO from DB:", error);
    }
    setULOBoxes(uloBoxes.filter((ulo) => ulo.id !== uloId));
    // Also remove any links for this ULO
    setAssessmentULOLinks((prev) => prev.filter((l) => l.uloId !== dbId));
  }

  const handleCreateAssessment = async (data: AssessmentFormData) => {
    // Find the box that was just dropped (last one added, no dbID yet)
    const pendingBox = assessmentBoxes.find((a) => a.dbID === null);
    try {
      const res = await createAssessment({
        description: data.description,
        type: data.type,
        unitId: currentUnit.unitId,
        position: {
          x: pendingBox?.x ?? 100,
          y: pendingBox?.y ?? 100,
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
      // Update the box with the real DB ID
      if (res && pendingBox) {
        setAssessmentBoxes((prev) =>
          prev.map((a) =>
            a.id === pendingBox.id
              ? {
                  ...a,
                  dbID: res.assessmentId,
                  id: res.assessmentId,
                  name: data.name || a.name,
                  description: data.description || a.description,
                  type: data.type || a.type,
                  value: data.value ?? a.value,
                  hurdleReq: data.hurdleReq ?? a.hurdleReq,
                  dueWeek: data.dueWeek || a.dueWeek,
                  conditions: data.conditions || a.conditions,
                  feedbackWeek: data.feedbackWeek || a.feedbackWeek,
                  feedbackDetails: data.feedbackDetails || a.feedbackDetails,
                }
              : a
          )
        );
      }
      setShowCreateAssessmentForm(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create Assessment.");
    }
  };

  const handleCreateULO = async (description: string) => {
    if (!currentUnit?.unitId) return;
    // Find the pending ULO box (last added, no uloId from DB)
    const pendingBox = uloBoxes.find((u) => !u.uloId);
    try {
      const res = await axiosInstance.post("/ULO/create", {
        uloDesc: description,
        unitId: currentUnit.unitId,
        position: {
          x: pendingBox?.x ?? 500,
          y: pendingBox?.y ?? 100,
        },
      });
      // Update the box with the real DB ID
      if (res.data && pendingBox) {
        setULOBoxes((prev) =>
          prev.map((u) =>
            u.id === pendingBox.id
              ? {
                  ...u,
                  uloId: res.data.uloId,
                  id: res.data.uloId,
                  uloDesc: description,
                }
              : u
          )
        );
      }
      setShowCreateULOForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create ULO.");
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

  // Assessment-ULO link handlers
  const handleItemClickForULOConnection = (
    type: "assessment" | "ulo",
    id: number
  ) => {
    if (!uloConnectionMode) return;

    if (!uloConnectionSource) {
      setUloConnectionSource({ type, id });
    } else {
      // Must connect an assessment to a ULO (not same type)
      if (uloConnectionSource.type === type) {
        setUloConnectionSource({ type, id });
        return;
      }
      const assessmentId = type === "assessment" ? id : uloConnectionSource.id;
      const uloId = type === "ulo" ? id : uloConnectionSource.id;

      createAssessmentULOLink(assessmentId, uloId);
      setUloConnectionSource(null);
    }
  };

  const createAssessmentULOLink = async (
    assessmentId: number,
    uloId: number
  ) => {
    if (!currentUnit?.unitId) return;
    try {
      const response = await axiosInstance.post("/assessment-ulo/create", {
        assessmentId,
        uloId,
        unitId: currentUnit.unitId,
      });
      setAssessmentULOLinks((prev) => [...prev, response.data]);
    } catch (error: any) {
      console.error("Failed to create assessment-ULO link:", error);
      alert(
        error.response?.data?.message || "Failed to link assessment to ULO"
      );
    }
  };

  const handleDeleteAssessmentULOLink = async (
    assessmentId: number,
    uloId: number
  ) => {
    if (!currentUnit?.unitId) return;
    try {
      await axiosInstance.delete("/assessment-ulo/delete", {
        data: {
          assessmentId,
          uloId,
          unitId: currentUnit.unitId,
        },
      });
      setAssessmentULOLinks((prev) =>
        prev.filter(
          (l) => !(l.assessmentId === assessmentId && l.uloId === uloId)
        )
      );
    } catch (error) {
      console.error("Failed to delete assessment-ULO link:", error);
    }
  };

  // ── Teaching Activity drag (existing boxes) ──────────────────────────────
  function handleTAMouseDown(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    const activity = teachingActivityBoxes.find((a) => a.id === id);
    if (!activity || !canvasRef.current) return;
    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - activity.x, y: mouseY - activity.y };
    setDraggedTeachingActivity(id);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const { x: newX, y: newY } = getMouseCoords(moveEvent, canvasRef.current);
      setTeachingActivityBoxes((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                x: Math.max(0, Math.min(newX - offset.x, canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH)),
                y: Math.max(0, Math.min(newY - offset.y, canvasRef.current!.scrollHeight - 100)),
              }
            : a
        )
      );
    };
    const handleUp = () => {
      setDraggedTeachingActivity(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  // ── Teaching Activity drag (new from sidebar) ─────────────────────────────
  const handleNewTAMouseDown = (e: React.MouseEvent, template: { type: string; label: string }) => {
    e.preventDefault();
    if (!currentUnit) return;
    const newActivity: TeachingActivity = {
      id: Date.now(),
      activityId: null,
      name: "",
      description: "",
      type: template.type,
      unitId: currentUnit.unitId,
      x: e.clientX,
      y: e.clientY,
    };
    setDraggedNewTA({ activity: newActivity, x: e.clientX, y: e.clientY });

    const handleGlobalMove = (moveEvent: MouseEvent) => {
      setDraggedNewTA((prev) => prev ? { ...prev, x: moveEvent.clientX, y: moveEvent.clientY } : null);
    };
    const handleGlobalUp = (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalUp);
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        if (
          upEvent.clientX >= rect.left && upEvent.clientX <= rect.right &&
          upEvent.clientY >= rect.top  && upEvent.clientY <= rect.bottom
        ) {
          const coords = getMouseCoords(upEvent as unknown as React.MouseEvent, canvasRef.current);
          addTAToCanvasAtPos(newActivity, coords.x - UNIT_BOX_WIDTH / 2, coords.y - 40);
        }
      }
      setDraggedNewTA(null);
    };
    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalUp);
  };

  const addTAToCanvasAtPos = (activity: TeachingActivity, x: number, y: number) => {
    setTeachingActivityBoxes((prev) => [...prev, { ...activity, x, y }]);
    setShowCreateTAForm(true);
  };

  // ── Teaching Activity CRUD ────────────────────────────────────────────────
  const handleCreateTA = async (data: { name: string; description: string; type: string }) => {
    if (!currentUnit?.unitId) return;
    const pendingBox = teachingActivityBoxes.find((a) => a.activityId === null);
    try {
      const res = await axiosInstance.post("/teaching-activity/create", {
        name: data.name,
        description: data.description,
        type: data.type,
        unitId: currentUnit.unitId,
        position: { x: pendingBox?.x ?? 800, y: pendingBox?.y ?? 100 },
      });
      if (res.data && pendingBox) {
        setTeachingActivityBoxes((prev) =>
          prev.map((a) =>
            a.id === pendingBox.id
              ? { ...a, activityId: res.data.activityId, id: res.data.activityId, name: data.name, description: data.description, type: data.type }
              : a
          )
        );
      }
      setShowCreateTAForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create Teaching Activity.");
    }
  };

  const handleEditTA = (id: number) => {
    setEditingId(id);
    setShowTAForm(true);
  };

  const handleUpdateTA = async (data: { name: string; description: string; type: string }) => {
    if (!editingId) return;
    const box = teachingActivityBoxes.find((a) => a.id === editingId);
    const dbId = box?.activityId ?? editingId;
    try {
      await axiosInstance.put(`/teaching-activity/update/${dbId}`, data);
      setTeachingActivityBoxes((prev) =>
        prev.map((a) => a.id === editingId ? { ...a, ...data } : a)
      );
      setEditingId(null);
      setShowTAForm(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update Teaching Activity.");
    }
  };

  const deleteTA = async (id: number) => {
    const box = teachingActivityBoxes.find((a) => a.id === id);
    const dbId = box?.activityId ?? id;
    try {
      await axiosInstance.delete("/teaching-activity/delete", { data: { activityId: dbId } });
    } catch (error) {
      console.error("Failed to delete TA from DB:", error);
    }
    setTeachingActivityBoxes((prev) => prev.filter((a) => a.id !== id));
    setTAAssessmentLinks((prev) => prev.filter((l) => l.activityId !== dbId));
    setTAULOLinks((prev) => prev.filter((l) => l.activityId !== dbId));
  };

  // ── Teaching Activity connections ─────────────────────────────────────────
  const handleTAClickForConnection = (type: "activity" | "assessment" | "ulo", id: number) => {
    if (!taConnectionMode) return;
    if (!taConnectionSource) {
      setTaConnectionSource({ type, id });
      return;
    }
    const srcType = taConnectionSource.type;
    const srcId   = taConnectionSource.id;

    if ((srcType === "activity" && type === "assessment") || (srcType === "assessment" && type === "activity")) {
      const activityId   = srcType === "activity" ? srcId : id;
      const assessmentId = srcType === "assessment" ? srcId : id;
      createTAAssessmentLink(activityId, assessmentId);
    } else if ((srcType === "activity" && type === "ulo") || (srcType === "ulo" && type === "activity")) {
      const activityId = srcType === "activity" ? srcId : id;
      const uloId      = srcType === "ulo"      ? srcId : id;
      createTAULOLink(activityId, uloId);
    } else {
      // Same type or invalid pair — update source
      setTaConnectionSource({ type, id });
      return;
    }
    setTaConnectionSource(null);
  };

  const createTAAssessmentLink = async (activityId: number, assessmentId: number) => {
    if (!currentUnit?.unitId) return;
    try {
      const res = await axiosInstance.post("/teaching-activity-links/assessment/create", {
        activityId, assessmentId, unitId: currentUnit.unitId,
      });
      setTAAssessmentLinks((prev) => [...prev, res.data]);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to link activity to assessment");
    }
  };

  const createTAULOLink = async (activityId: number, uloId: number) => {
    if (!currentUnit?.unitId) return;
    try {
      const res = await axiosInstance.post("/teaching-activity-links/ulo/create", {
        activityId, uloId, unitId: currentUnit.unitId,
      });
      setTAULOLinks((prev) => [...prev, res.data]);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to link activity to ULO");
    }
  };

  const handleDeleteTAAssessmentLink = async (activityId: number, assessmentId: number) => {
    try {
      await axiosInstance.delete("/teaching-activity-links/assessment/delete", {
        data: { activityId, assessmentId },
      });
      setTAAssessmentLinks((prev) =>
        prev.filter((l) => !(l.activityId === activityId && l.assessmentId === assessmentId))
      );
    } catch (error) {
      console.error("Failed to delete TA-assessment link:", error);
    }
  };

  const handleDeleteTAULOLink = async (activityId: number, uloId: number) => {
    try {
      await axiosInstance.delete("/teaching-activity-links/ulo/delete", {
        data: { activityId, uloId },
      });
      setTAULOLinks((prev) =>
        prev.filter((l) => !(l.activityId === activityId && l.uloId === uloId))
      );
    } catch (error) {
      console.error("Failed to delete TA-ULO link:", error);
    }
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
          handleNewTAMouseDown={handleNewTAMouseDown}
          getCLOColor={getCLOColor}
          uloConnectionMode={uloConnectionMode}
          setUloConnectionMode={setUloConnectionMode}
          setUloConnectionSource={setUloConnectionSource}
          taConnectionMode={taConnectionMode}
          setTaConnectionMode={setTaConnectionMode}
          setTaConnectionSource={setTaConnectionSource}
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
            <div
              key={assessment.id}
              onMouseEnter={() =>
                setHoveredItem(`assessment-${assessment.dbID ?? assessment.id}`)
              }
              onMouseLeave={() => setHoveredItem(null)}
              onClick={
                uloConnectionMode
                  ? () => handleItemClickForULOConnection("assessment", assessment.dbID ?? assessment.id)
                  : taConnectionMode
                  ? () => handleTAClickForConnection("assessment", assessment.dbID ?? assessment.id)
                  : undefined
              }
              className={
                (uloConnectionMode &&
                  uloConnectionSource?.type === "assessment" &&
                  uloConnectionSource?.id === (assessment.dbID ?? assessment.id))
                  ? "ring-4 ring-purple-400 rounded"
                  : (taConnectionMode &&
                    taConnectionSource?.type === "assessment" &&
                    taConnectionSource?.id === (assessment.dbID ?? assessment.id))
                  ? "ring-4 ring-teal-400 rounded"
                  : ""
              }
            >
              <AssessmentBox
                assessment={assessment}
                onClick={handleAssessmentClickForConnection}
                onDoubleClick={handleEditAssessment}
                deleteAssessment={deleteAssessment}
                onMouseDown={handleMouseDown}
              />
            </div>
          ))}
          {uloBoxes.map((ulo) => (
            <div
              key={ulo.id}
              onMouseEnter={() => setHoveredItem(`ulo-${ulo.uloId ?? ulo.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={
                uloConnectionMode
                  ? () => handleItemClickForULOConnection("ulo", ulo.uloId ?? ulo.id!)
                  : taConnectionMode
                  ? () => handleTAClickForConnection("ulo", ulo.uloId ?? ulo.id!)
                  : undefined
              }
              className={
                (uloConnectionMode &&
                  uloConnectionSource?.type === "ulo" &&
                  uloConnectionSource?.id === (ulo.uloId ?? ulo.id))
                  ? "ring-4 ring-orange-400 rounded"
                  : (taConnectionMode &&
                    taConnectionSource?.type === "ulo" &&
                    taConnectionSource?.id === (ulo.uloId ?? ulo.id))
                  ? "ring-4 ring-teal-400 rounded"
                  : ""
              }
            >
              <ULOBox
                ulo={ulo}
                onMouseDown={handleULOBoxMouseDown}
                onDoubleClick={handleEditULO}
                onDelete={deleteULO}
              />
            </div>
          ))}

          {/* Teaching Activity boxes */}
          {teachingActivityBoxes.map((activity) => (
            <div
              key={activity.id}
              onMouseEnter={() => setHoveredItem(`activity-${activity.activityId ?? activity.id}`)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={
                taConnectionMode
                  ? () => handleTAClickForConnection("activity", activity.activityId ?? activity.id)
                  : undefined
              }
              className={
                taConnectionMode &&
                taConnectionSource?.type === "activity" &&
                taConnectionSource?.id === (activity.activityId ?? activity.id)
                  ? "ring-4 ring-teal-400 rounded"
                  : ""
              }
            >
              <TeachingActivityBox
                activity={activity}
                draggedActivity={draggedTeachingActivity}
                onMouseDown={handleTAMouseDown}
                onDoubleClick={handleEditTA}
                onClick={(id) => handleTAClickForConnection("activity", id)}
                deleteActivity={deleteTA}
              />
            </div>
          ))}

          {/* Assessment-ULO connection lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 5 }}
          >
            <AssessmentULOLines
              links={assessmentULOLinks}
              assessmentBoxes={assessmentBoxes}
              uloBoxes={uloBoxes}
              hoveredItem={hoveredItem}
              onDeleteLink={handleDeleteAssessmentULOLink}
            />
            <TeachingActivityLines
              taAssessmentLinks={taAssessmentLinks}
              taULOLinks={taULOLinks}
              teachingActivityBoxes={teachingActivityBoxes}
              assessmentBoxes={assessmentBoxes}
              uloBoxes={uloBoxes}
              hoveredItem={hoveredItem}
              onDeleteTAAssessmentLink={handleDeleteTAAssessmentLink}
              onDeleteTAULOLink={handleDeleteTAULOLink}
            />
          </svg>

          {/* Orphan warnings */}
          <OrphanWarnings
            assessmentBoxes={assessmentBoxes}
            uloBoxes={uloBoxes}
            links={assessmentULOLinks}
          />
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
                  x:
                    assessmentBoxes.find((a) => a.id === editingId)?.x ||
                    undefined,
                  y:
                    assessmentBoxes.find((a) => a.id === editingId)?.y ||
                    undefined,
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
                  type: "Artefact",
                  x:
                    assessmentBoxes.find((a) => a.id === editingId)?.x ||
                    undefined,
                  y:
                    assessmentBoxes.find((a) => a.id === editingId)?.y ||
                    undefined,
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
                onSave={handleCreateULO}
                onCancel={() => setShowCreateULOForm(false)}
              />
            </div>
          </div>
        )}

        {/* Modal: Create Teaching Activity */}
        {showCreateTAForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Create Teaching Activity</h2>
                <button
                  onClick={() => setShowCreateTAForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <TeachingActivityForm
                onSave={handleCreateTA}
                onCancel={() => setShowCreateTAForm(false)}
              />
            </div>
          </div>
        )}

        {/* Modal: Edit Teaching Activity */}
        {showTAForm && editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Teaching Activity</h2>
                <button
                  onClick={() => { setShowTAForm(false); setEditingId(null); }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <TeachingActivityForm
                onSave={handleUpdateTA}
                onCancel={() => { setShowTAForm(false); setEditingId(null); }}
                initialData={{
                  name: teachingActivityBoxes.find((a) => a.id === editingId)?.name,
                  description: teachingActivityBoxes.find((a) => a.id === editingId)?.description,
                  type: teachingActivityBoxes.find((a) => a.id === editingId)?.type,
                }}
              />
            </div>
          </div>
        )}

        {/* Modal: Edit ULO */}
        {showULOForm && editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">
                  Edit Unit Learning Outcome
                </h2>
                <button
                  onClick={() => {
                    setShowULOForm(false);
                    setEditingId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
                >
                  &times;
                </button>
              </div>
              <UnitLearningOutcomeForm
                onSave={async (description: string) => {
                  const box = uloBoxes.find((u) => u.id === editingId);
                  const dbId = box?.uloId ?? editingId;
                  try {
                    await axiosInstance.put(`/ULO/update/${dbId}`, {
                      uloDesc: description,
                      unitId: currentUnit?.unitId,
                    });
                    setULOBoxes((prev) =>
                      prev.map((u) =>
                        u.id === editingId ? { ...u, uloDesc: description } : u
                      )
                    );
                  } catch (err) {
                    console.error("Failed to update ULO:", err);
                  }
                  setShowULOForm(false);
                  setEditingId(null);
                }}
                onCancel={() => {
                  setShowULOForm(false);
                  setEditingId(null);
                }}
                initialData={uloBoxes.find((u) => u.id === editingId)?.uloDesc}
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
          <div className="bg-orange-500 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">Unit Learning Outcome</h2>
          </div>
        </div>
      )}

      {draggedNewTA && (
        <div
          className="fixed pointer-events-none z-[200] opacity-80"
          style={{
            left: draggedNewTA.x - UNIT_BOX_WIDTH / 2,
            top: draggedNewTA.y - 40,
            width: UNIT_BOX_WIDTH,
          }}
        >
          <div className="bg-green-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">Teaching Activity</h2>
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
