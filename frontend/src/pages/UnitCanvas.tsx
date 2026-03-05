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
      await viewCourseTags(currentCourse.courseId);
      await viewUnitTagsByCourse(currentCourse.courseId);
    };
    loadUnits();
  }, []);

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
        console.error("New data is incomplete");
        alert("Unit created successfully, but missing data to display the box");
      }
    } catch(error) {
      console.error("Error creating unit: ", error);
      alert("Failed to create unit. It might already exist or server error.");
    }
  };

  // Handle creating a new relationship
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

  // Handle deleting a relationship
  const handleDeleteRelationship = async (relationshipId: number) => {
    try {
      await axiosInstance.delete(`/unit-relationship/delete/${relationshipId}`);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
    } catch (error) {
      console.error("Error deleting relationship:", error);
      alert("Failed to delete relationship");
    }
  };

  // Handle unit click in connection mode
  const handleUnitClickForConnection = (unitId: string) => {
    if (!connectionMode) return;

    if (!connectionSource) {
      setConnectionSource(unitId);
    } else {
      handleCreateRelationship(unitId);
    }
  };

  // Get relationship line color based on type
  const getRelationshipColor = (type: UnitRelationship["relationshipType"]) => {
    switch (type) {
      case "PREREQUISITE":
        return "#EF4444"; // red
      case "COREQUISITE":
        return "#F59E0B"; // amber
      case "PROGRESSION":
        return "#10B981"; // green
      case "CONNECTED":
        return "#6366F1"; // indigo
      default:
        return "#6B7280"; // gray
    }
  };

  // Render connection lines between units
  const renderConnectionLines = () => {
    const UNIT_WIDTH = 256; // w-64 = 256px
    const UNIT_HEIGHT = 56; // approximate height with padding

    // Helper function to find intersection point of line from center to edge of rectangle
    const getBoxEdgePoint = (
      centerX: number,
      centerY: number,
      targetX: number,
      targetY: number,
      width: number,
      height: number
    ) => {
      const dx = targetX - centerX;
      const dy = targetY - centerY;

      if (dx === 0 && dy === 0) return { x: centerX, y: centerY };

      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // Calculate the scale factor to reach the edge
      const scaleX = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity;
      const scaleY = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity;
      const scale = Math.min(scaleX, scaleY);

      return {
        x: centerX + dx * scale,
        y: centerY + dy * scale,
      };
    };

    return relationships.map((rel) => {
      const sourceUnit = unitBoxes.find((u) => u.unitId === rel.unitId);
      const targetUnit = unitBoxes.find((u) => u.unitId === rel.relatedId);

      if (!sourceUnit || !targetUnit) return null;

      // Calculate center points of units
      const sourceCenterX = sourceUnit.x + UNIT_WIDTH / 2;
      const sourceCenterY = sourceUnit.y + UNIT_HEIGHT / 2;
      const targetCenterX = targetUnit.x + UNIT_WIDTH / 2;
      const targetCenterY = targetUnit.y + UNIT_HEIGHT / 2;

      // Get the edge points where the line should start and end
      const startPoint = getBoxEdgePoint(
        sourceCenterX,
        sourceCenterY,
        targetCenterX,
        targetCenterY,
        UNIT_WIDTH,
        UNIT_HEIGHT
      );

      const endPoint = getBoxEdgePoint(
        targetCenterX,
        targetCenterY,
        sourceCenterX,
        sourceCenterY,
        UNIT_WIDTH,
        UNIT_HEIGHT
      );

      const color = getRelationshipColor(rel.relationshipType);

      // Calculate arrow head
      const angle = Math.atan2(
        targetCenterY - sourceCenterY,
        targetCenterX - sourceCenterX
      );
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;

      // Pull back the end point slightly for the arrow head
      const arrowTipX = endPoint.x;
      const arrowTipY = endPoint.y;
      const lineEndX = endPoint.x - arrowLength * Math.cos(angle);
      const lineEndY = endPoint.y - arrowLength * Math.sin(angle);

      return (
        <g
          key={rel.id}
          className="cursor-pointer pointer-events-auto"
          onClick={() => handleDeleteRelationship(rel.id)}
        >
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={lineEndX}
            y2={lineEndY}
            stroke={color}
            strokeWidth="2"
          />
          {/* Arrow head */}
          <polygon
            points={`${arrowTipX},${arrowTipY} ${arrowTipX - arrowLength * Math.cos(angle - arrowAngle)},${arrowTipY - arrowLength * Math.sin(angle - arrowAngle)} ${arrowTipX - arrowLength * Math.cos(angle + arrowAngle)},${arrowTipY - arrowLength * Math.sin(angle + arrowAngle)}`}
            fill={color}
          />
          {/* Hover area for easier clicking */}
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="transparent"
            strokeWidth="12"
          />
        </g>
      );
    });
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

          {/* Connection Mode Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h2 className="text-lg font-bold mb-2 text-gray-800">Connection Mode</h2>
            <button
              className={`${
                connectionMode
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-purple-500 hover:bg-purple-600"
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
                    setSelectedRelationType(
                      e.target.value as UnitRelationship["relationshipType"]
                    )
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

            {/* Legend */}
            <div className="mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Legend:</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-red-500 mr-2"></div>
                  <span className="text-gray-600">Prerequisite</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-amber-500 mr-2"></div>
                  <span className="text-gray-600">Corequisite</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-500 mr-2"></div>
                  <span className="text-gray-600">Progression</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-indigo-500 mr-2"></div>
                  <span className="text-gray-600">Connected</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click a line to delete it</p>
            </div>
          </div>

          {/* Search Input Container - Now inside the sidebar */}
          <div className="relative mb-4 mt-4">
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
        {unitBoxes.map((unit) => (
          <div
            key={unit.id}
            className="absolute w-64 cursor-move select-none group"
            style={{
              left: `${unit.x}px`,
              top: `${unit.y}px`,
              zIndex: draggedUnit === unit.id ? 10 : 1,
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

              {/* Delete button - appears on hover */}
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
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 20 }}>
          {renderConnectionLines()}
        </svg>

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
    </div>
  );
};

export default CanvasPage;
