import React, { useState, useEffect } from "react";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import Draggable from "../components/common/Draggable";
import { UnitBox } from "../components/common/UnitBox";
import { axiosInstance } from "../lib/axios";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import Navbar from "../components/navbar";
import { AddTagMenu } from "../components/common/AddTagMenu";
import PolyLine, { type LineSegment } from "../components/PolyLine";
import PolyLineForm, { type PolyLineFormData } from "../components/PolyLineForm";

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

  // PolyLine state
  const [polyLines, setPolyLines] = useState<
    Array<{
      id: string;
      segments: LineSegment[];
      x: number;
      y: number;
      color: string;
      strokeWidth: number;
      showArrowhead: boolean;
    }>
  >([]);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [showLineForm, setShowLineForm] = useState<boolean>(false);
  const [draggingSegment, setDraggingSegment] = useState<{
    lineId: string;
    segmentIndex: number;
    startMousePos: { x: number; y: number };
    startLength: number;
  } | null>(null);
  const [draggingLine, setDraggingLine] = useState<{
    lineId: string;
    startMousePos: { x: number; y: number };
    startLinePos: { x: number; y: number };
  } | null>(null);
  const [snappedLines, setSnappedLines] = useState<{
    [lineId: string]: {
      unit1Id: number;
      unit2Id: number;
      snapX: number;
      snapY: number;
    };
  }>({});
  const [arrowContextMenu, setArrowContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    lineId?: string;
    segmentIndex?: number;
  }>({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    const loadUnits = async () => {
      await viewUnits();
      await viewCourseTags(currentCourse.courseId);
      await viewUnitTagsByCourse(currentCourse.courseId);
    };
    loadUnits();
  }, []);

  useEffect(() => {
    const loadCanvasState = async () => {
      if (currentCourse?.courseId) {
        try {
          const response = await axiosInstance.get(
            `/course-unit/view?courseId=${currentCourse.courseId}`
          );
          const courseUnits = response.data;
          const loadedUnitBoxes = courseUnits.map((cu) => ({
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

  const handleAddTagToUnits = (tag: number) => {
    console.log("Tag being added", tag);
    const apiData = selectedUnits.map((unit) => {
      return {
        courseId: currentCourse.courseId,
        unitId: unit,
        tagId: tag,
      };
    });
    const addData = async (apiData) => {
      await addUnitTags(apiData);
    };

    addData(apiData);
    setViewingTagMenu(false);
  };

  const handleSaveCanvas = async () => {
    if (currentCourse?.courseId) {
      console.log("Save canvas button is triggered");
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

    const newUnit = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x: 100 + unitBoxes.length * 50,
      y: 100 + unitBoxes.length * 30,
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
        updateUnit(editedUnit.unitId, {
          unitName: formData.unitName || editedUnit.name,
          unitDesc: formData.unitDesc || editedUnit.description,
          credits: formData.credits || editedUnit.credits,
          semestersOffered:
            formData.semestersOffered || editedUnit.semestersOffered,
        })
          .then(() => {
            // Update the local state with the updated unit boxes
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
    if (e.button !== 0) {
      return;
    }
    if (selectedUnits.length !== 0) {
      setSelectedUnits([]);
      return;
    }

    setContextMenu({ ...contextMenu, visible: false });
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const start = {
      initialX: mouseX,
      initialY: mouseY,
    };

    const handleMove = (moveEvent: MouseEvent) => {};

    const handleCanvasUp = (MouseEvent: MouseEvent) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = MouseEvent.clientX - rect.left;
      const mouseY = MouseEvent.clientY - rect.top;

      const selectedRect = {
        x1: start.initialX,
        x2: mouseX,
        y1: start.initialY,
        y2: mouseY,
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
        .map((unit) => unit.unitId);
      setSelectedUnits(selected);
      console.log(selectedUnits);
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

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const offset = {
      x: mouseX - unit.x,
      y: mouseY - unit.y,
    };
    setDragOffset(offset);
    setDraggedUnit(id);
    setIsDragging(false);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;

      setIsDragging(true);
      const moveRect = canvasRef.current.getBoundingClientRect();
      const newMouseX = moveEvent.clientX - moveRect.left;
      const newMouseY = moveEvent.clientY - moveRect.top;

      setUnitBoxes((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === id
            ? {
                ...unit,
                x: Math.max(
                  0,
                  Math.min(newMouseX - offset.x, moveRect.width - 256)
                ),
                y: Math.max(
                  0,
                  Math.min(newMouseY - offset.y, moveRect.height - 100)
                ),
              }
            : unit
        )
      );
    };

    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  const [draggedUnit, setDraggedUnit] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePositionChange = (id: number | string, x: number, y: number) => {
    setUnitBoxes((prevUnits) =>
      prevUnits.map((unit) =>
        unit.id === id ? { ...unit, x, y } : unit
      )
    );
    
    // Update any lines that are snapped to this unit
    const UNIT_WIDTH = 256;
    const UNIT_HEIGHT = 64; // Match the height used in findSnapPosition
    const ARROW_OFFSET = 10; // The internal offset in the PolyLine SVG
    
    setPolyLines((prevLines) => {
      return prevLines.map((line) => {
        const snapInfo = snappedLines[line.id];
        if (snapInfo && (snapInfo.unit1Id === id || snapInfo.unit2Id === id)) {
          // Recalculate the snap position
          const unit1 = unitBoxes.find((u) => u.id === snapInfo.unit1Id);
          const unit2 = unitBoxes.find((u) => u.id === snapInfo.unit2Id);
          
          if (unit1 && unit2) {
            // Apply the new position if this is the unit being moved
            const updatedUnit1 = snapInfo.unit1Id === id ? { ...unit1, x, y } : unit1;
            const updatedUnit2 = snapInfo.unit2Id === id ? { ...unit2, x, y } : unit2;
            
            const unit1CenterX = updatedUnit1.x + UNIT_WIDTH / 2;
            const unit1CenterY = updatedUnit1.y + UNIT_HEIGHT / 2;
            const unit2CenterX = updatedUnit2.x + UNIT_WIDTH / 2;
            const unit2CenterY = updatedUnit2.y + UNIT_HEIGHT / 2;
            
            const midX = (unit1CenterX + unit2CenterX) / 2;
            const midY = (unit1CenterY + unit2CenterY) / 2;
            
            // Adjust for the arrow's internal offset
            const adjustedMidX = midX - ARROW_OFFSET;
            const adjustedMidY = midY - ARROW_OFFSET;
            
            // Update the snap info
            setSnappedLines((prev) => ({
              ...prev,
              [line.id]: {
                ...snapInfo,
                snapX: adjustedMidX,
                snapY: adjustedMidY,
              },
            }));
            
            return { ...line, x: adjustedMidX, y: adjustedMidY };
          }
        }
        return line;
      });
    });
  };

  function handleDoubleClick(unitId: number | string) {
    startEdit(unitId as number);
  }

  function deleteUnit(unitId: number | string) {
    setUnitBoxes(unitBoxes.filter((unit) => unit.id !== unitId));
  }

  // PolyLine handlers
  // Helper function to calculate total arrow length from segments
  const calculateArrowLength = (segments: LineSegment[]): number => {
    return segments.reduce((total, segment) => total + segment.length, 0);
  };

  // Helper function to find if a line should snap between two unit boxes
  const findSnapPosition = (lineX: number, lineY: number, lineId: string): { 
    shouldSnap: boolean; 
    snapX: number; 
    snapY: number; 
    unit1Id?: number; 
    unit2Id?: number;
  } => {
    const SNAP_THRESHOLD = 120; // Distance threshold for snapping (increased for easier testing)
    const UNIT_WIDTH = 256; // w-64 = 16rem = 256px
    const UNIT_HEIGHT = 64; // More accurate: p-4 (1rem = 16px padding) + text-lg + border
    const ARROW_OFFSET = 10; // The internal offset in the PolyLine SVG
    
    // Get the current arrow's length
    const currentLine = polyLines.find((l) => l.id === lineId);
    const MAX_UNIT_DISTANCE = currentLine 
      ? calculateArrowLength(currentLine.segments) 
      : 800; // Fallback to 800 if line not found
    
    // Check all pairs of unit boxes
    for (let i = 0; i < unitBoxes.length; i++) {
      for (let j = i + 1; j < unitBoxes.length; j++) {
        const unit1 = unitBoxes[i];
        const unit2 = unitBoxes[j];
        
        // Calculate center points of the units
        const unit1CenterX = unit1.x + UNIT_WIDTH / 2;
        const unit1CenterY = unit1.y + UNIT_HEIGHT / 2;
        const unit2CenterX = unit2.x + UNIT_WIDTH / 2;
        const unit2CenterY = unit2.y + UNIT_HEIGHT / 2;
        
        // Check if units are too far apart
        const unitDistance = Math.sqrt(
          Math.pow(unit2CenterX - unit1CenterX, 2) + Math.pow(unit2CenterY - unit1CenterY, 2)
        );
        
        // Skip this pair if units are too far apart
        if (unitDistance > MAX_UNIT_DISTANCE) {
          continue;
        }
        
        // Calculate midpoint between the two units
        const midX = (unit1CenterX + unit2CenterX) / 2;
        const midY = (unit1CenterY + unit2CenterY) / 2;
        
        // Check if line is close to this midpoint (without offset adjustment for distance check)
        // We need to add the offset to lineX/lineY to get the visual arrow position
        const visualArrowX = lineX + ARROW_OFFSET;
        const visualArrowY = lineY + ARROW_OFFSET;
        
        const distance = Math.sqrt(
          Math.pow(visualArrowX - midX, 2) + Math.pow(visualArrowY - midY, 2)
        );
        
        if (distance < SNAP_THRESHOLD) {
          // Adjust for the arrow's internal offset so the visual start is at the midpoint
          const adjustedMidX = midX - ARROW_OFFSET;
          const adjustedMidY = midY - ARROW_OFFSET;
          
          return {
            shouldSnap: true,
            snapX: adjustedMidX,
            snapY: adjustedMidY,
            unit1Id: unit1.id,
            unit2Id: unit2.id,
          };
        }
      }
    }
    
    return { shouldSnap: false, snapX: lineX, snapY: lineY };
  };

  const handleLinePositionChange = (id: string | number, x: number, y: number) => {
    const lineId = id as string;
    const snapResult = findSnapPosition(x, y, lineId);
    
    if (snapResult.shouldSnap && snapResult.unit1Id !== undefined && snapResult.unit2Id !== undefined) {
      // Snap the line to the position between units
      setPolyLines((prevLines) =>
        prevLines.map((line) =>
          line.id === lineId ? { ...line, x: snapResult.snapX, y: snapResult.snapY } : line
        )
      );
      // Store the snap relationship
      setSnappedLines((prev) => ({
        ...prev,
        [lineId]: {
          unit1Id: snapResult.unit1Id!,
          unit2Id: snapResult.unit2Id!,
          snapX: snapResult.snapX,
          snapY: snapResult.snapY,
        },
      }));
    } else {
      // Not snapping - remove from snapped lines if it was previously snapped
      setPolyLines((prevLines) =>
        prevLines.map((line) =>
          line.id === lineId ? { ...line, x, y } : line
        )
      );
      setSnappedLines((prev) => {
        const newSnapped = { ...prev };
        delete newSnapped[lineId];
        return newSnapped;
      });
    }
  };

  const handleLineDoubleClick = (lineId: string | number) => {
    setEditingLineId(lineId as string);
    setShowLineForm(true);
  };

  const deleteLine = (lineId: string) => {
    setPolyLines((prevLines) => prevLines.filter((line) => line.id !== lineId));
    // Also remove from snapped lines if present
    setSnappedLines((prev) => {
      const newSnapped = { ...prev };
      delete newSnapped[lineId];
      return newSnapped;
    });
  };

  const deleteSegment = (lineId: string, segmentIndex: number) => {
    setPolyLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === lineId) {
          const newSegments = [...line.segments];
          newSegments.splice(segmentIndex, 1);
          // If no segments left, return null to filter out later
          if (newSegments.length === 0) return null;
          return { ...line, segments: newSegments };
        }
        return line;
      }).filter(Boolean) as typeof prevLines
    );
  };

  const handleArrowContextMenu = (lineId: string, segmentIndex?: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrowContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      lineId,
      segmentIndex,
    });
  };

  const handleCloseContextMenu = () => {
    setArrowContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleDeleteSegmentFromContextMenu = () => {
    if (arrowContextMenu.lineId && arrowContextMenu.segmentIndex !== undefined) {
      deleteSegment(arrowContextMenu.lineId, arrowContextMenu.segmentIndex);
    }
    handleCloseContextMenu();
  };

  const handleDeleteEntireArrowFromContextMenu = () => {
    if (arrowContextMenu.lineId) {
      deleteLine(arrowContextMenu.lineId);
    }
    handleCloseContextMenu();
  };

  const handleCreateLine = () => {
    const newLine = {
      id: `line-${Date.now()}`,
      segments: [
        { direction: 'east' as const, length: 100 },
      ],
      x: 200,
      y: 200,
      color: '#000000',
      strokeWidth: 2,
      showArrowhead: true,
    };
    setPolyLines((prevLines) => [...prevLines, newLine]);
  };

  const handleLineFormSave = (data: PolyLineFormData) => {
    if (editingLineId) {
      setPolyLines((prevLines) =>
        prevLines.map((line) =>
          line.id === editingLineId ? { ...line, ...data } : line
        )
      );
      setEditingLineId(null);
      setShowLineForm(false);
    }
  };

  const cancelLineEdit = () => {
    setEditingLineId(null);
    setShowLineForm(false);
  };

  const handleSegmentDragStart = (lineId: string, segmentIndex: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const line = polyLines.find((l) => l.id === lineId);
    if (!line || segmentIndex >= line.segments.length) return;

    setDraggingSegment({
      lineId,
      segmentIndex,
      startMousePos: { x: e.clientX, y: e.clientY },
      startLength: line.segments[segmentIndex].length,
    });
  };

  const handleLineDragStart = (lineId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const line = polyLines.find((l) => l.id === lineId);
    if (!line) return;

    setDraggingLine({
      lineId,
      startMousePos: { x: e.clientX, y: e.clientY },
      startLinePos: { x: line.x, y: line.y },
    });
  };

  const handleAddSegmentDragStart = (lineId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const line = polyLines.find((l) => l.id === lineId);
    if (!line) return;

    const startMousePos = { x: e.clientX, y: e.clientY };
    let directionDetermined = false;

    // Track initial mouse movement to determine direction
    const handleInitialMove = (moveEvent: MouseEvent) => {
      if (directionDetermined) return;

      const deltaX = moveEvent.clientX - startMousePos.x;
      const deltaY = moveEvent.clientY - startMousePos.y;
      const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);

      // Wait until user has moved at least 10px to determine direction
      if (totalMovement < 10) return;

      directionDetermined = true;

      // Determine direction based on largest movement
      let newDirection: 'north' | 'south' | 'east' | 'west';
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDirection = deltaX > 0 ? 'east' : 'west';
      } else {
        newDirection = deltaY > 0 ? 'south' : 'north';
      }

      // Add new segment with determined direction
      setPolyLines((prevLines) =>
        prevLines.map((l) => {
          if (l.id === lineId) {
            return {
              ...l,
              segments: [...l.segments, { direction: newDirection, length: 20 }],
            };
          }
          return l;
        })
      );

      // Start dragging the new segment
      setDraggingSegment({
        lineId,
        segmentIndex: line.segments.length,
        startMousePos: startMousePos,
        startLength: 20,
      });

      // Remove this listener, the main drag handler will take over
      window.removeEventListener('mousemove', handleInitialMove);
    };

    const handleInitialUp = () => {
      window.removeEventListener('mousemove', handleInitialMove);
      window.removeEventListener('mouseup', handleInitialUp);
    };

    window.addEventListener('mousemove', handleInitialMove);
    window.addEventListener('mouseup', handleInitialUp);
  };

  // Handle mouse move for segment length dragging
  useEffect(() => {
    if (!draggingSegment) return;

    const handleMouseMove = (e: MouseEvent) => {
      const line = polyLines.find((l) => l.id === draggingSegment.lineId);
      if (!line) return;

      const segment = line.segments[draggingSegment.segmentIndex];
      const deltaX = e.clientX - draggingSegment.startMousePos.x;
      const deltaY = e.clientY - draggingSegment.startMousePos.y;

      let newLength = draggingSegment.startLength;

      // Calculate length based on direction
      switch (segment.direction) {
        case 'north':
          newLength = draggingSegment.startLength - deltaY;
          break;
        case 'south':
          newLength = draggingSegment.startLength + deltaY;
          break;
        case 'east':
          newLength = draggingSegment.startLength + deltaX;
          break;
        case 'west':
          newLength = draggingSegment.startLength - deltaX;
          break;
      }

      // Constrain length
      newLength = Math.max(20, Math.min(500, newLength));

      setPolyLines((prevLines) =>
        prevLines.map((line) => {
          if (line.id === draggingSegment.lineId) {
            const newSegments = [...line.segments];
            newSegments[draggingSegment.segmentIndex] = {
              ...newSegments[draggingSegment.segmentIndex],
              length: Math.round(newLength),
            };
            return { ...line, segments: newSegments };
          }
          return line;
        })
      );
    };
   const handleMouseUp = () => {
      setDraggingSegment(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSegment, polyLines]);

  // Handle line dragging
  useEffect(() => {
    if (!draggingLine || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - draggingLine.startMousePos.x;
      const deltaY = e.clientY - draggingLine.startMousePos.y;
      
      const newX = draggingLine.startLinePos.x + deltaX;
      const newY = draggingLine.startLinePos.y + deltaY;
      
      handleLinePositionChange(draggingLine.lineId, newX, newY);
    };

    const handleMouseUp = () => {
      setDraggingLine(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingLine]);

  // Handle global clicks to close context menu
  useEffect(() => {
    if (arrowContextMenu.visible) {
      const handleGlobalClick = () => {
        handleCloseContextMenu();
      };
      document.addEventListener('click', handleGlobalClick);
      return () => {
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [arrowContextMenu.visible]);

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
        console.error("New data is incomplete");
        alert("Unit created successfully, but missing data to display the box");
      }
    } catch(error) {
      console.error("Error creating unit: ", error);
      alert("Failed to create unit. It might already exist or server error.");
    }
  };

  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault(); // prevent default browser context menu
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar container - Removed w-1/6 and relative, let CanvasSidebar define width */}
      <div className="flex flex-col h-full z-20">
        {/* Sidebar component */}
        <CanvasSidebar>
          {/* Unit Add button - Now inside the sidebar */}
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
          <button
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4"
            onClick={handleCreateLine}
          >
            Add Line
          </button>

          {/* Search Input Container - Now inside the sidebar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search for a unit..."
              // Using Tailwind classes for a standard input look
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />

            {/* Search Results Dropdown */}
            {showSearchResults &&
              searchTerm.length > 0 &&
              searchResults.length > 0 && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((unit) => (
                    <div
                      key={unit.unitId}
                      className="px-4 py-2 text-black hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => createUnitBox(unit)}
                    >
                      <span className="font-semibold">{unit.unitId}</span> -{" "}
                      {unit.unitName}
                    </div>
                  ))}
                </div>
              )}
            {/* Added a prompt if search is active but no results are found */}
            {showSearchResults &&
              searchTerm.length > 0 &&
              searchResults.length === 0 && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No units found.
                  </div>
                </div>
              )}
          </div>
          <h2 className="text-lg font-bold mb-4 text-gray-800 pt-15">Tags</h2>
          <input
            type="text"
            placeholder="Create a tag..."
            // Using Tailwind classes for a standard input look
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

          <h2 className="text-md font-bold mb-4 text-gray-800 pt-10">
            Existing Tags
          </h2>
          <div className="flex flex-col max-h-[10vh] overflow-y-auto">
            {existingTags.map((tag: Tag) => {
              return (
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                  onClick={() => {
                    setSelectedUnits([]);
                    const newArr: [] = existingTagConnections
                      .filter((conn) => {
                        return conn.tagId === tag.tagId;
                      })
                      .map((conn) => conn.unitId);

                    setSelectedUnits(newArr);
                  }}
                >
                  {tag.tagName}
                </button>
              );
            })}
          </div>
        </CanvasSidebar>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        className="w-full bg-white p-6 overflow-hidden relative"
        style={{ userSelect: "none" }}
        onMouseDown={handleMouseDownCanvas}
        onContextMenu={(e) => handleRightClick(e)}
      >
        {/* ... (Absolutely positioned unit boxes and Modals) ... */}
        {unitBoxes.map((unit) => (
          <Draggable
            key={unit.id}
            id={unit.id}
            x={unit.x}
            y={unit.y}
            canvasRef={canvasRef}
            onPositionChange={handlePositionChange}
            onDoubleClick={handleDoubleClick}
            onDelete={deleteUnit}
          >
            <div
              className={`w-64 transition-shadow duration-200 relative ${
                draggedUnit === unit.id ? "shadow-lg scale-105" : "shadow-sm"
              }`}
            >
              <div
                className={`border ${
                  selectedUnits.includes(unit.unitId)
                    ? `border-4 border-blue-400 ring-4 ring-blue-300`
                    : `border-gray-300`
                } p-4 rounded shadow-sm hover:shadow-md transition-shadow duration-300`}
                style={{
                  backgroundColor: unit.color || "#3B82F6",
                  color: "white",
                }}
              >
                <h2 className="text-lg font-semibold text-center text-white">
                  {unit.unitId || unit.name}
                </h2>
              </div>
            </div>
          </Draggable>
        ))}

        {/* Render polylines */}
        {polyLines.map((line) => {
          const isSnapped = snappedLines[line.id] !== undefined;
          return (
            <div
              key={line.id}
              className="absolute"
              style={{
                left: `${line.x}px`,
                top: `${line.y}px`,
                zIndex: draggingLine?.lineId === line.id ? 1000 : 1,
              }}
              onDoubleClick={() => handleLineDoubleClick(line.id)}
            >
              <div className="relative group" style={{ pointerEvents: 'none' }}>
                {/* Snap indicator */}
                {isSnapped && (
                  <div 
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                    style={{ pointerEvents: 'none' }}
                  >
                    Relationship
                  </div>
                )}
                <PolyLine
                  id={line.id}
                  segments={line.segments}
                  color={line.color}
                  strokeWidth={line.strokeWidth}
                  showArrowhead={line.showArrowhead}
                  onSegmentDrag={(segmentIndex) =>
                    handleSegmentDragStart(line.id, segmentIndex)
                  }
                  onAddSegmentDrag={handleAddSegmentDragStart(line.id)}
                  onLineDragStart={handleLineDragStart(line.id)}
                  onContextMenu={(segmentIndex) =>
                    handleArrowContextMenu(line.id, segmentIndex)
                  }
                />
              </div>
            </div>
          );
        })}

        {/* Popup Modal for UnitForm */}
        {showForm && editingId && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Edit Unit</h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
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
              />
            </div>
          </div>
        )}

        {/* Create Unit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-black text-xl font-bold">Create Unit</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
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

        {/* PolyLine Edit Modal */}
        {showLineForm && editingLineId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelLineEdit}
          >
            <div 
              className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0">
                <h2 className="text-black text-xl font-bold">Edit Line</h2>
                <button
                  onClick={cancelLineEdit}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="px-6 pb-6 overflow-y-auto flex-1">
                <PolyLineForm
                  initialData={polyLines.find((l) => l.id === editingLineId)}
                  onSave={handleLineFormSave}
                  onCancel={cancelLineEdit}
                  snappedToUnits={
                    editingLineId && snappedLines[editingLineId]
                      ? (() => {
                          const snapInfo = snappedLines[editingLineId];
                          const unit1 = unitBoxes.find((u) => u.id === snapInfo.unit1Id);
                          const unit2 = unitBoxes.find((u) => u.id === snapInfo.unit2Id);
                          return unit1 && unit2
                            ? {
                                unit1Name: unit1.unitId || unit1.name,
                                unit2Name: unit2.unitId || unit2.name,
                              }
                            : null;
                        })()
                      : null
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 shadow-lg rounded-md flex flex-col text-left z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            minWidth: "150px",
            padding: "0.5rem",
          }}
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
          <button
            className="text-gray-800 hover:bg-gray-100 px-3 py-1 cursor-pointer text-left"
            onClick={() => {
              setViewingTagMenu(true);
              setTagData(
                currentCLOs.map((clo: CourseLearningOutcome) => {
                  return {
                    name: clo.cloDesc,
                    id: clo.cloId,
                  };
                })
              );
            }}
          >
            Add Learning Outcome
          </button>
          <button
            className="text-gray-800 hover:bg-gray-100 px-3 py-1 cursor-pointer text-left"
            onClick={() => {
              setViewingTagMenu(true);
              setTagData(
                existingTags.map((tag: Tag) => {
                  return {
                    name: tag.tagName,
                    id: tag.tagId,
                  };
                })
              );
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
        ></AddTagMenu>
      )}

      {/* Arrow Context Menu */}
      {arrowContextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-[9999]"
          style={{
            left: `${arrowContextMenu.x}px`,
            top: `${arrowContextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {arrowContextMenu.segmentIndex !== undefined && (
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              onClick={handleDeleteSegmentFromContextMenu}
            >
              Delete Segment
            </button>
          )}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
            onClick={handleDeleteEntireArrowFromContextMenu}
          >
            {arrowContextMenu.segmentIndex !== undefined ? 'Delete Entire Arrow' : 'Delete Arrow'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasPage;
