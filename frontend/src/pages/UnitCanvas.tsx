import React, { useState, useEffect } from "react";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { axiosInstance } from "../lib/axios";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import Navbar from "../components/navbar";
import { AddTagMenu } from "../components/common/AddTagMenu";

import { useCLOStore } from "../stores/useCLOStore";
import { useTagStore } from "../stores/useTagStore";

// Define the Unit interface
interface Unit {
  unitId: string;
  unitName: string;
  unitDesc: string;
  credits: number;
  semestersOffered: number[];
}

export interface CourseLearningOutcome {
  cloId?: number | null;
  cloDesc: string;
  courseId: string | undefined;
}

export interface Tag {
  tagId: number;
  tagName: string;
  courseId: string;
}

// Define the UnitRelationship interface
export interface UnitRelationship {
  id: number;
  unitId: string;
  relatedId: string;
  relationshipType: "PREREQUISITE" | "COREQUISITE" | "PROGRESSION" | "CONNECTED";
  courseId: string | null;
  sId: number | null;
  entryType: number;
}

// Grid Layout Constants
const COL_WIDTH = 600; // Increased to 600 to provide a massive routing corridor between years
const ROW_HEIGHT = 150; // Increased to 150 to give more vertical breathing room
const START_X = 80;  // Room for Semester labels on the left vertically
const START_Y = 80;  
const DEFAULT_YEARS = 3;
const DEFAULT_SEMESTERS = 2;
const MAX_UNITS_PER_SEM = 4; // 4 units per semester -> 8 rows total for 2 semesters
const UNIT_BOX_WIDTH = 256; // 64 * 4 for Tailwind w-64

export const CanvasPage: React.FC = () => {
  const [unitBoxes, setUnitBoxes] = useState<
    Array<{
      id: number;
      name: string;
      unitId?: string;
      description?: string;
      credits?: number;
      semestersOffered?: number[];
      x: number;
      y: number;
      color?: string;
    }>
  >([]);

  // State for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // State for dragging
  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();

  //State for multiple units selected
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // States for unit search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Unit[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const { checkUnitExists, viewUnits, createUnit, updateUnit } = useUnitStore();

  // State for creating a new unit
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    unitId?: number;
  }>({ visible: false, x: 0, y: 0 });

  const [viewingTagMenu, setViewingTagMenu] = useState<boolean>(false);
  const [tagData, setTagData] = useState<CourseLearningOutcome[] | null>(null);
  const [newTag, setNewTag] = useState<string>("");
  const {
    existingTags,
    existingTagConnections,
    createTag,
    addUnitTags,
    viewCourseTags,
    viewUnitTagsByCourse,
  } = useTagStore();

  // State for connection mode
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<UnitRelationship[]>([]);
  const [selectedRelationType, setSelectedRelationType] = useState<UnitRelationship["relationshipType"]>("PREREQUISITE");

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

  // Fetch relationships when course changes
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
  }, [currentCourse]);

  useEffect(() => {
    const loadCanvasState = async () => {
      if (currentCourse?.courseId) {
        try {
          const response = await axiosInstance.get(
            `/course-unit/view?courseId=${currentCourse.courseId}`
          );
          const courseUnits = response.data;
          const loadedUnitBoxes = courseUnits.map((cu: any) => ({
            id: Date.now() + Math.random(), // Simple unique ID
            name: cu.unit.unitName,
            unitId: cu.unitId,
            description: cu.unit.unitDesc,
            credits: cu.unit.credits,
            semestersOffered: cu.unit.semestersOffered,
            x: cu.position.x,
            y: cu.position.y,
            color: cu.color || "#3B82F6", // Default color
          }));
          setUnitBoxes(loadedUnitBoxes);
        } catch (error) {
          console.error("Error loading canvas state:", error);
        }
      }
    };

    loadCanvasState();
  }, [currentCourse]);

  // Calculate actual coordinates accounting for potential scrolling
  const getMouseCoords = (e: MouseEvent | React.MouseEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + container.scrollLeft,
      y: e.clientY - rect.top + container.scrollTop,
    };
  };

  const handleAddTagToUnits = (tag: number) => {
    const apiData = selectedUnits.map((unit) => {
      return {
        courseId: currentCourse.courseId,
        unitId: unit,
        tagId: tag,
      };
    });
    const addData = async (data: any) => {
      await addUnitTags(data);
    };

    addData(apiData);
    setViewingTagMenu(false);
  };

  const handleSaveCanvas = async () => {
    if (currentCourse?.courseId) {
      try {
        await axiosInstance.post(
          `/course-unit/canvas/${currentCourse.courseId}`,
          { units: unitBoxes }
        );
        alert("Canvas saved successfully!");
      } catch (error) {
        console.error("Error saving canvas:", error);
        alert("Failed to save canvas.");
      }
    }
  };

  const createUnitBox = (selectedUnit: Unit & { color?: string }) => {
    const unitExists = unitBoxes.some(
      (unit) => unit.unitId === selectedUnit.unitId
    );

    if (unitExists) {
      alert("This unit has already been added.");
      setShowSearchResults(false);
      return;
    }

    // Determine grid size based on course settings
    const years = Number((currentCourse as any)?.expectedDuration) || DEFAULT_YEARS;
    const semestersPerYear = Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
    const totalCols = years; // 1 column per year
    const totalRows = semestersPerYear * MAX_UNITS_PER_SEM; // e.g. 2 * 4 = 8 rows total

    let nextCol = 0;
    let nextRow = 0;
    let foundSlot = false;

    // Scan grid top-to-bottom (slots), left-to-right (years)
    for (let col = 0; col < totalCols; col++) {
      for (let row = 0; row < totalRows; row++) {
        const expectedX = START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
        const expectedY = START_Y + row * ROW_HEIGHT + 20;
        
        // Check if any unit is currently occupying this grid slot
        const isOccupied = unitBoxes.some(u => 
          Math.abs(u.x - expectedX) < 50 && Math.abs(u.y - expectedY) < 50
        );

        if (!isOccupied) {
          nextCol = col;
          nextRow = row;
          foundSlot = true;
          break;
        }
      }
      if (foundSlot) break;
    }

    const defaultX = 100 + unitBoxes.length * 50;
    const defaultY = 100 + unitBoxes.length * 30;

    let finalX = defaultX;
    let finalY = defaultY;

    if (foundSlot) {
      finalX = START_X + nextCol * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
      finalY = START_Y + nextRow * ROW_HEIGHT + 20;
    }

    const newUnit = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x: finalX,
      y: finalY,
      color: selectedUnit.color || "#3B82F6",
    };
    
    setUnitBoxes([...unitBoxes, newUnit]);
    setShowSearchResults(false);
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
          .catch((error) => {
            console.error("Error updating unit:", error);
          });
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

    setContextMenu({ ...contextMenu, visible: false });
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const start = { initialX: mouseX, initialY: mouseY };

    const handleCanvasUp = (mouseEvent: MouseEvent) => {
      const { x: endX, y: endY } = getMouseCoords(mouseEvent, canvasRef.current!);

      const selectedRect = {
        x1: Math.min(start.initialX, endX),
        x2: Math.max(start.initialX, endX),
        y1: Math.min(start.initialY, endY),
        y2: Math.max(start.initialY, endY),
      };

      const selected = unitBoxes
        .filter((unit) => {
          return (
            unit.x > selectedRect.x1 &&
            unit.x < selectedRect.x2 &&
            unit.y > selectedRect.y1 &&
            unit.y < selectedRect.y2
          );
        })
        .map((unit) => unit.unitId as string);
        
      setSelectedUnits(selected);
      document.removeEventListener("mouseup", handleCanvasUp);
    };

    document.addEventListener("mouseup", handleCanvasUp);
  }

  function handleMouseDown(e: React.MouseEvent, id: number) {
    setContextMenu({ ...contextMenu, visible: false });
    e.preventDefault();
    e.stopPropagation();

    const unit = unitBoxes.find((u) => u.id === id);
    if (!unit || !canvasRef.current) return;

    const { x: mouseX, y: mouseY } = getMouseCoords(e, canvasRef.current);
    const offset = { x: mouseX - unit.x, y: mouseY - unit.y };
    
    setDragOffset(offset);
    setDraggedUnit(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;

      setIsDragging(true);
      const { x: newMouseX, y: newMouseY } = getMouseCoords(moveEvent, canvasRef.current);

      setUnitBoxes((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === id
            ? {
                ...unit,
                x: Math.max(0, Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH)),
                y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 100)),
              }
            : unit
        )
      );
    };

    const handleUp = () => {
      // Upon dropping, implement "Snap to Grid" functionality
      setUnitBoxes((prevUnits) =>
        prevUnits.map((unit) => {
          if (unit.id === id) {
            let snappedX = unit.x;
            let snappedY = unit.y;

            // Only snap if dropped within the general grid area
            if (unit.x >= START_X - 100 && unit.y >= START_Y - 50) {
              const semestersPerYear = Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
              const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;

              // Snap to closest column (Year)
              const col = Math.max(0, Math.round((unit.x - START_X) / COL_WIDTH));
              
              // Snap to closest row (Unit Slot) using distance logic
              let closestRow = 0;
              let minDistance = Infinity;
              
              for (let r = 0; r < totalRows; r++) {
                const expectedY = START_Y + r * ROW_HEIGHT + 20;
                
                const dist = Math.abs(unit.y - expectedY);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestRow = r;
                }
              }

              snappedX = START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2;
              snappedY = START_Y + closestRow * ROW_HEIGHT + 20;
            }

            return { ...unit, x: snappedX, y: snappedY };
          }
          return unit;
        })
      );

      setDraggedUnit(null);
      setDragOffset({ x: 0, y: 0 });
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
    setUnitBoxes(unitBoxes.filter((unit) => unit.id !== unitId));
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
    } catch (error) {
      console.error("Duplicate check failed", error);
      alert("Failed to check for duplicates. Please try again.");
      return;
    }

    try {
      const newUnit = await createUnit(data);
      setShowCreateForm(false);

      if (newUnit && newUnit.unitId) {
        const unitToAdd: Unit & { color?: string } = {
          unitId: newUnit.unitId,
          unitName: newUnit.unitName,
          unitDesc: newUnit.unitDesc || '',
          credits: newUnit.credits || 0,
          semestersOffered: newUnit.semestersOffered || [],
          color: data.color || '#3B82F6', 
        };
        createUnitBox(unitToAdd);
      } else {
        alert("Unit created successfully, but missing data to display the box");
      }
    } catch(error) {
      console.error("Error creating unit: ", error);
      alert("Failed to create unit. It might already exist or server error.");
    }
  };

  const handleCreateRelationship = async (targetUnitId: string) => {
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
      console.error("Error creating relationship:", error);
      alert(error.response?.data?.message || "Failed to create relationship");
      setConnectionSource(null);
    }
  };

  const handleDeleteRelationship = async (relationshipId: number) => {
    try {
      await axiosInstance.delete(`/unit-relationship/delete/${relationshipId}`);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
    } catch (error) {
      console.error("Error deleting relationship:", error);
      alert("Failed to delete relationship");
    }
  };

  const handleUnitClickForConnection = (unitId: string) => {
    if (!connectionMode) return;
    if (!connectionSource) {
      setConnectionSource(unitId);
    } else {
      handleCreateRelationship(unitId);
    }
  };

  const getRelationshipColor = (type: UnitRelationship["relationshipType"]) => {
    switch (type) {
      case "PREREQUISITE": return "#EF4444";
      case "COREQUISITE": return "#F59E0B";
      case "PROGRESSION": return "#10B981";
      case "CONNECTED": return "#6366F1";
      default: return "#6B7280";
    }
  };

  const renderConnectionLines = () => {
    const UNIT_HEIGHT = 80;

    // Helper to calculate bezier curve points perfectly routed through the vertical voids
    const getCurvePath = (source: any, target: any, relId: number) => {
      const sx = source.x + UNIT_BOX_WIDTH / 2;
      const sy = source.y + UNIT_HEIGHT / 2;
      const tx = target.x + UNIT_BOX_WIDTH / 2;
      const ty = target.y + UNIT_HEIGHT / 2;

      // Determine the column (Year) index of the units
      const colS = Math.max(0, Math.round((source.x - START_X) / COL_WIDTH));
      const colT = Math.max(0, Math.round((target.x - START_X) / COL_WIDTH));
      const isSameCol = colS === colT;
      
      // Fan offset prevents parallel connections from completely overlapping
      const fanOffset = (relId % 7) * 15 - 45; 

      let d = "";
      let endX, endY, angle;

      if (isSameCol) {
        // Same Year -> Route out to the right corridor, down/up, and back into the right side
        const startX = sx + UNIT_BOX_WIDTH / 2;
        endX = tx + UNIT_BOX_WIDTH / 2;
        endY = ty;
        
        // Exact mathematical center of the void to the right of this column
        const corridorX = START_X + (colS + 1) * COL_WIDTH + fanOffset;

        d = `M ${startX} ${sy} C ${corridorX} ${sy}, ${corridorX} ${ty}, ${endX} ${ty}`;
        angle = Math.PI; // Arrow points left, back into the right-edge
      } else if (Math.abs(colS - colT) === 1) {
        // Adjacent Years -> Route perfectly down the middle of the void separating them
        const isLtoR = colT > colS;
        const startX = sx + (isLtoR ? 1 : -1) * (UNIT_BOX_WIDTH / 2);
        endX = tx + (isLtoR ? -1 : 1) * (UNIT_BOX_WIDTH / 2);
        endY = ty;

        // Exact mathematical center of the void directly between the two adjacent columns
        const corridorX = START_X + Math.max(colS, colT) * COL_WIDTH + fanOffset;

        d = `M ${startX} ${sy} C ${corridorX} ${sy}, ${corridorX} ${ty}, ${endX} ${ty}`;
        angle = isLtoR ? 0 : Math.PI; // Arrow points in matching direction
      } else {
        // Skipping Years -> Route out, drop entirely below the unit grid, across, and back up
        const isLtoR = colT > colS;
        const startX = sx + (isLtoR ? 1 : -1) * (UNIT_BOX_WIDTH / 2);
        endX = tx + (isLtoR ? -1 : 1) * (UNIT_BOX_WIDTH / 2);
        endY = ty;

        // First void right after source, second void right before target
        const corridor1X = START_X + (isLtoR ? colS + 1 : colS) * COL_WIDTH + fanOffset;
        const corridor2X = START_X + (isLtoR ? colT : colT + 1) * COL_WIDTH + fanOffset;

        // Find the safe bottom Y value below all units
        const semestersPerYear = Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
        const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
        const bottomY = START_Y + totalRows * ROW_HEIGHT + 60 + Math.abs(fanOffset) * 2;
        const midX = (corridor1X + corridor2X) / 2;

        // Sweeping U-shape curve routing strictly through the empty corridors and below the grid
        d = `M ${startX} ${sy} C ${corridor1X} ${sy}, ${corridor1X} ${bottomY}, ${midX} ${bottomY} C ${corridor2X} ${bottomY}, ${corridor2X} ${ty}, ${endX} ${ty}`;
        angle = isLtoR ? 0 : Math.PI;
      }

      return { d, endX, endY, angle };
    };

    return relationships.map((rel) => {
      const sourceUnit = unitBoxes.find((u) => u.unitId === rel.unitId);
      const targetUnit = unitBoxes.find((u) => u.unitId === rel.relatedId);

      if (!sourceUnit || !targetUnit) return null;

      const { d, endX, endY, angle } = getCurvePath(sourceUnit, targetUnit, rel.id);
      const color = getRelationshipColor(rel.relationshipType);

      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;

      return (
        <g
          key={rel.id}
          className="cursor-pointer pointer-events-auto transition-opacity duration-200 hover:opacity-100 opacity-50"
          onClick={() => handleDeleteRelationship(rel.id)}
        >
          {/* The Bezier Curve Path */}
          <path d={d} stroke={color} strokeWidth="3" fill="none" className="drop-shadow-sm" />
          
          {/* Arrow Head */}
          <polygon
            points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
            fill={color}
          />
          
          {/* Invisible thicker path for easier hover/clicking */}
          <path d={d} stroke="transparent" strokeWidth="16" fill="none" />
        </g>
      );
    });
  };

  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }

  // Visual layout for dynamic grid zones behind drag/drop layer
  const renderGridBackground = () => {
    const years = Number((currentCourse as any)?.expectedDuration) || DEFAULT_YEARS;
    const semestersPerYear = Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
    const totalCols = years;
    const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;

    return (
      <div className="absolute inset-0 pointer-events-none" style={{ minWidth: START_X + totalCols * COL_WIDTH, minHeight: START_Y + totalRows * ROW_HEIGHT + 100 }}>
        {/* Year Headers (Horizontal across the top) */}
        {Array.from({ length: totalCols }).map((_, col) => (
          <div
            key={`year-${col}`}
            className="absolute border-b-2 border-gray-300 flex items-center justify-center font-bold text-gray-700 text-xl"
            style={{
              top: 20,
              left: START_X + col * COL_WIDTH,
              width: COL_WIDTH,
              height: 40,
            }}
          >
            Year {col + 1}
          </div>
        ))}

        {/* Semester Headers (Vertical on the left) and their Dropzone Slots */}
        {Array.from({ length: semestersPerYear }).map((_, s) => {
          const semStartY = START_Y + s * (MAX_UNITS_PER_SEM * ROW_HEIGHT);
          const semHeight = MAX_UNITS_PER_SEM * ROW_HEIGHT;

          return (
            <div key={`sem-group-${s}`}>
              {/* Semester Vertical Heading */}
              <div
                className="absolute border-r-2 border-gray-300 bg-gray-50 flex items-center justify-center font-bold text-gray-600 uppercase tracking-widest text-lg"
                style={{
                  top: semStartY,
                  left: 0,
                  width: START_X,
                  height: semHeight,
                  writingMode: 'vertical-rl', // Renders text vertically
                  transform: 'rotate(180deg)', // Read from bottom to top
                }}
              >
                Semester {s + 1}
              </div>

              {/* Horizontal dividers to separate semesters visually */}
              {s > 0 && (
                 <div className="absolute border-t-2 border-gray-300" 
                      style={{ top: semStartY, left: 0, width: START_X + totalCols * COL_WIDTH }} />
              )}

              {/* Grid Slots for this Semester */}
              {Array.from({ length: MAX_UNITS_PER_SEM }).map((_, unitInSem) => {
                const absRow = s * MAX_UNITS_PER_SEM + unitInSem;

                return (
                  <div key={`sem-${s}-unit-${unitInSem}`}>
                    {Array.from({ length: totalCols }).map((_, col) => (
                      <div
                        key={`slot-${col}-${absRow}`}
                        className="absolute border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 flex items-center justify-center"
                        style={{
                          top: START_Y + absRow * ROW_HEIGHT + 20,
                          left: START_X + col * COL_WIDTH + (COL_WIDTH - UNIT_BOX_WIDTH) / 2,
                          width: UNIT_BOX_WIDTH,
                          height: 80, 
                        }}
                      >
                        <span className="text-gray-400 font-medium text-xs opacity-50">Drop Unit Here</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Dimensions of the scrollable inner area based on the required grid cells
  const years = Number((currentCourse as any)?.expectedDuration) || DEFAULT_YEARS;
  const semestersPerYear = Number((currentCourse as any)?.numberTeachingPeriods) || DEFAULT_SEMESTERS;
  const totalCols = years;
  const totalRows = semestersPerYear * MAX_UNITS_PER_SEM;
  const innerWidth = Math.max(1200, START_X + totalCols * COL_WIDTH + 100);
  const innerHeight = Math.max(800, START_Y + totalRows * ROW_HEIGHT + 100);

  return (
    <div className="flex h-screen">
      <div className="flex flex-col h-full z-20">
        <CanvasSidebar>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4"
            onClick={handleSaveCanvas}
          >
            Save Canvas
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Unit
          </button>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h2 className="text-lg font-bold mb-2 text-gray-800">Connection Mode</h2>
            <button
              className={`${
                connectionMode ? "bg-red-500 hover:bg-red-600" : "bg-purple-500 hover:bg-purple-600"
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-2`}
              onClick={() => {
                setConnectionMode(!connectionMode);
                setConnectionSource(null);
              }}
            >
              {connectionMode ? "Exit Connection Mode" : "Enter Connection Mode"}
            </button>
            
            {connectionMode && (
              <>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Relationship Type:
                </label>
                <select
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 mb-2"
                  value={selectedRelationType}
                  onChange={(e) =>
                    setSelectedRelationType(e.target.value as UnitRelationship["relationshipType"])
                  }
                >
                  <option value="PREREQUISITE">Prerequisite</option>
                  <option value="COREQUISITE">Corequisite</option>
                  <option value="PROGRESSION">Progression</option>
                  <option value="CONNECTED">Connected</option>
                </select>
                <p className="text-sm text-gray-600 mb-2">
                  {connectionSource
                    ? `Click another unit to connect from "${connectionSource}"`
                    : "Click a unit to start connection"}
                </p>
                {connectionSource && (
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-sm w-full"
                    onClick={() => setConnectionSource(null)}
                  >
                    Cancel Selection
                  </button>
                )}
              </>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Legend:</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center"><div className="w-4 h-1 bg-red-500 mr-2"></div><span className="text-gray-600">Prerequisite</span></div>
                <div className="flex items-center"><div className="w-4 h-1 bg-amber-500 mr-2"></div><span className="text-gray-600">Corequisite</span></div>
                <div className="flex items-center"><div className="w-4 h-1 bg-green-500 mr-2"></div><span className="text-gray-600">Progression</span></div>
                <div className="flex items-center"><div className="w-4 h-1 bg-indigo-500 mr-2"></div><span className="text-gray-600">Connected</span></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click a line to delete it</p>
            </div>
          </div>

          <div className="relative mb-4 mt-4">
            <input
              type="text"
              placeholder="Search for a unit..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            {showSearchResults && searchTerm.length > 0 && searchResults.length > 0 && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((unit) => (
                  <div
                    key={unit.unitId}
                    className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => createUnitBox(unit)}
                  >
                    <span className="font-semibold">{unit.unitId}</span> - {unit.unitName}
                  </div>
                ))}
              </div>
            )}
            {showSearchResults && searchTerm.length > 0 && searchResults.length === 0 && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50">
                <div className="px-4 py-2 text-gray-500 text-sm">No units found.</div>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold mb-4 text-gray-800 pt-15">Tags</h2>
          <input
            type="text"
            placeholder="Create a tag..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline my-5"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4"
            onClick={() => {
              createTag({ tagName: newTag, courseId: currentCourse.courseId });
              setNewTag("");
            }}
          >
            Create New Tag
          </button>

          <h2 className="text-md font-bold mb-4 text-gray-800 pt-10">Existing Tags</h2>
          <div className="flex flex-col max-h-[10vh] overflow-y-auto">
            {existingTags.map((tag: Tag) => {
              return (
                <button
                  key={tag.tagId}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-2"
                  onClick={() => {
                    setSelectedUnits([]);
                    const newArr = existingTagConnections
                      .filter((conn) => conn.tagId === tag.tagId)
                      .map((conn) => conn.unitId);
                    setSelectedUnits(newArr as string[]);
                  }}
                >
                  {tag.tagName}
                </button>
              );
            })}
          </div>
        </CanvasSidebar>
      </div>

      {/* Main Canvas Area - Updated to be scrollable and house the inner layout */}
      <div
        ref={canvasRef}
        className="flex-1 bg-white overflow-auto relative"
        style={{ userSelect: "none" }}
        onMouseDown={handleMouseDownCanvas}
        onContextMenu={(e) => handleRightClick(e)}
      >
        <div 
          className="relative bg-white" 
          style={{ width: `${innerWidth}px`, height: `${innerHeight}px` }}
        >
          {/* Inject Dynamic Mapping Grid Layers Behind Dragging Interface */}
          {renderGridBackground()}

          {/* Render Active Unit Nodes on Top of Grid */}
          {unitBoxes.map((unit) => (
            <div
              key={unit.id}
              className="absolute w-64 cursor-move select-none group"
              style={{
                left: `${unit.x}px`,
                top: `${unit.y}px`,
                zIndex: draggedUnit === unit.id ? 30 : 10,
              }}
              onMouseDown={(e) => handleMouseDown(e, unit.id)}
              onDoubleClick={() => handleDoubleClick(unit.id)}
              onClick={() => handleUnitClickForConnection(unit.unitId!)}
            >
              <div
                className={`transition-shadow duration-200 relative ${
                  draggedUnit === unit.id ? "shadow-lg scale-105" : "shadow-sm"
                }`}
              >
                <div
                  className={`border ${
                    selectedUnits.includes(unit.unitId!)
                      ? `border-4 border-blue-400 ring-4 ring-blue-300`
                      : `border-gray-300`
                  } p-4 rounded shadow-sm hover:shadow-md transition-shadow duration-300`}
                  style={{ backgroundColor: unit.color || "#3B82F6", color: "white" }}
                >
                  <h2 className="text-lg font-semibold text-center text-white">
                    {unit.unitId || unit.name}
                  </h2>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUnit(unit.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  title="Delete unit"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Render lines behind units (zIndex 5 is between Background Grid at 0 and Units at 10) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            {renderConnectionLines()}
          </svg>
        </div>

        {/* Modal Interstitials below... */}
        {showForm && editingId && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Unit</h2>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
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
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Create Unit</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
              </div>
              <UnitForm
                onSave={handleCreateUnit}
                initialData={{
                  unitId: null, unitName: null, unitDesc: null, credits: null, semestersOffered: null, color: null,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg rounded-md flex flex-col text-left z-50"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: "150px", padding: "0.5rem" }}
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <button
            className="text-gray-800 hover:bg-gray-100 px-3 py-1 cursor-pointer text-left"
            onClick={() => {
              setViewingTagMenu(true);
              setTagData(currentCLOs.map((clo: CourseLearningOutcome) => ({ name: clo.cloDesc, id: clo.cloId })));
            }}
          >
            Add Learning Outcome
          </button>
          <button
            className="text-gray-800 hover:bg-gray-100 px-3 py-1 cursor-pointer text-left"
            onClick={() => {
              setViewingTagMenu(true);
              setTagData(existingTags.map((tag: Tag) => ({ name: tag.tagName, id: tag.tagId })));
            }}
          >
            Add Tag
          </button>
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