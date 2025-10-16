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

  const handlePositionChange = (id: number, x: number, y: number) => {
    setUnitBoxes((prevUnits) =>
      prevUnits.map((unit) =>
        unit.id === id ? { ...unit, x, y } : unit
      )
    );
  };

  function handleDoubleClick(unitId: number | string) {
    startEdit(unitId as number);
  }

  function deleteUnit(unitId: number) {
    setUnitBoxes(unitBoxes.filter((unit) => unit.id !== unitId));
  }

  // PolyLine handlers
  const handleLinePositionChange = (id: string | number, x: number, y: number) => {
    setPolyLines((prevLines) =>
      prevLines.map((line) =>
        line.id === id ? { ...line, x, y } : line
      )
    );
  };

  const handleLineDoubleClick = (lineId: string | number) => {
    setEditingLineId(lineId as string);
    setShowLineForm(true);
  };

  const deleteLine = (lineId: string) => {
    setPolyLines((prevLines) => prevLines.filter((line) => line.id !== lineId));
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
          </Draggable>
        ))}

        {/* Render polylines */}
        {polyLines.map((line) => (
          <Draggable
            key={line.id}
            id={line.id}
            x={line.x}
            y={line.y}
            canvasRef={canvasRef}
            onPositionChange={handleLinePositionChange}
            onDoubleClick={handleLineDoubleClick}
          >
            <div className="relative group">
              <PolyLine
                id={line.id}
                segments={line.segments}
                color={line.color}
                strokeWidth={line.strokeWidth}
                showArrowhead={line.showArrowhead}
                onSegmentDrag={(segmentIndex) =>
                  handleSegmentDragStart(line.id, segmentIndex)
                }
              />
              {/* Delete button for line */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLine(line.id);
                }}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                title="Delete line"
              >
                ×
              </button>
            </div>
          </Draggable>
        ))}

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
    </div>
  );
};

export default CanvasPage;
