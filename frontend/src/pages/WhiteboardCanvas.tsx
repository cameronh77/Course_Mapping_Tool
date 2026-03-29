import React, { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { CanvasSidebar } from "../components/layout/CanvasSidebar";
import UnitForm, { type UnitFormData } from "../components/common/UnitForm";
import { UnitBox } from "../components/common/UnitBox";
import { useUnitStore } from "../stores/useUnitStore";
import { useCourseStore } from "../stores/useCourseStore";
import { useCLOStore } from "../stores/useCLOStore";
import { useTagStore } from "../stores/useTagStore";
import type {
  Unit,
  UnitBox as UnitBoxType,
  CourseLearningOutcome,
  Tag,
  UnitMappings,
} from "../types";

const NUM_COLUMNS = 9;

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
  const [columnWidth, setColumnWidth] = useState<number>(256);
  // Update column width on window or canvas resize
  useEffect(() => {
    const updateColumnWidth = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.offsetWidth;
        setColumnWidth(width / NUM_COLUMNS);
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
        // Sort units by year ascending, then by y position ascending (top to bottom)
        const sortedUnits = [...courseUnits].sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearA - yearB;
          const yA = (a.position?.y ?? 40);
          const yB = (b.position?.y ?? 40);
          return yA - yB;
        });

        // Space out y values for semester 1 and 2 units to prevent overlap
        let semester1Y = 40;
        let semester2Y = 40;
        const semesterSpacing = 120; // px between units
        const placed: UnitBoxType[] = sortedUnits.map((cu: any) => {
          let x = cu.position?.x ?? 0;
          let y = cu.position?.y ?? 40;
          if (cu.semester == 1) {
            x = 0;
            y = semester1Y;
            semester1Y += semesterSpacing;
          } else if (cu.semester == 2) {
            x = width - columnWidth;
            y = semester2Y;
            semester2Y += semesterSpacing;
          }
          return {
            id: Date.now() + Math.random(),
            name: cu.unit.unitName,
            unitId: cu.unitId,
            description: cu.unit.unitDesc,
            credits: cu.unit.credits,
            semestersOffered: cu.unit.semestersOffered,
            x,
            y,
            color: cu.color || "#3B82F6",
            width: columnWidth,
            semester: cu.semester || 0,
            year: cu.year || 0,
          };
        });
        setUnitBoxes(placed);

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

        let allTagsForCourse: any[] = [];
        try {
          const tagResponse = await axiosInstance.get(`/tag/view-unit-course/${currentCourse.courseId}`);
          allTagsForCourse = tagResponse.data || [];
        } catch (error) {
          console.error("Error loading tags for course:", error);
        }

        for (const cu of courseUnits) {
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
