import React, { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { UnitBox } from "../components/common/UnitBox";
import { useUnitStore } from "../stores/useUnitStore";
import type { Unit, UnitBox as UnitBoxType } from "../types";

const UNIT_BOX_WIDTH = 256;

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

export const WhiteboardCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const unitStore = useUnitStore() as any;
  const { checkUnitExists, viewUnits, createUnit, updateUnit } = unitStore;

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

  useEffect(() => {
    viewUnits();
  }, []);

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

    const newUnit: UnitBoxType = {
      id: Date.now(),
      name: selectedUnit.unitName,
      unitId: selectedUnit.unitId,
      description: selectedUnit.unitDesc,
      credits: selectedUnit.credits,
      semestersOffered: selectedUnit.semestersOffered,
      x,
      y,
      color: "#3B82F6",
    };

    setUnitBoxes((prev) => [...prev, newUnit]);
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
          addUnitToCanvasAtPos(unit, canvasCoords.x - UNIT_BOX_WIDTH / 2, canvasCoords.y - 40);
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
        prevUnits.map((u) =>
          u.id === id
            ? {
                ...u,
                x: Math.max(0, Math.min(newMouseX - offset.x, canvasRef.current!.scrollWidth - UNIT_BOX_WIDTH)),
                y: Math.max(0, Math.min(newMouseY - offset.y, canvasRef.current!.scrollHeight - 100)),
              }
            : u
        )
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

  const toggleExpand = (e: React.MouseEvent, unitId: number) => {
    e.stopPropagation();
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const innerWidth = 5000;
  const innerHeight = 3000;

  return (
    <div className="flex h-screen relative overflow-hidden pt-16">
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
        />
      </div>

      <div ref={canvasRef} className="flex-1 bg-white overflow-auto relative" style={{ userSelect: "none" }}>
        <div className="relative bg-white" style={{ width: `${innerWidth}px`, height: `${innerHeight}px` }}>
          {unitBoxes.map((unit) => (
            <UnitBox
              key={unit.id}
              unit={unit}
              draggedUnit={draggedUnit}
              selectedUnits={selectedUnits}
              connectionMode={connectionMode}
              connectionSource={connectionSource}
              isExpanded={expandedUnits.has(unit.id)}
              activeTab={activeTabs[unit.id] || "info"}
              unitMappings={{ clos: [], tags: [] }}
              currentCLOs={[]}
              onMouseDown={handleMouseDown}
              onDoubleClick={(unitId) => {
                if (isDragging) return;
                startEdit(unitId);
              }}
              onClick={() => undefined}
              onMouseEnter={() => undefined}
              onMouseLeave={() => undefined}
              onContextMenu={(e) => e.preventDefault()}
              onDrop={() => undefined}
              toggleExpand={toggleExpand}
              setActiveTab={(id, tab) => setActiveTabs((prev) => ({ ...prev, [id]: tab }))}
              deleteUnit={(unitId) => setUnitBoxes(unitBoxes.filter((u) => u.id !== unitId))}
              getCLOColor={getCLOColor}
            />
          ))}
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
          style={{ left: draggedNewUnit.x - UNIT_BOX_WIDTH / 2, top: draggedNewUnit.y - 40, width: UNIT_BOX_WIDTH }}
        >
          <div className="bg-blue-600 p-4 rounded shadow-2xl border-2 border-white text-white">
            <h2 className="text-lg font-bold text-center">{draggedNewUnit.unit.unitId}</h2>
            <p className="text-xs text-center opacity-80">{draggedNewUnit.unit.unitName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhiteboardCanvas;
