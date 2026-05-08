import React, { useEffect, useRef, useState } from "react";
import type {
  CourseLearningOutcome,
  Tag,
  UnitBox as UnitBoxType,
} from "../../types";
import { getTagColor } from "./themeViewConstants";

interface UnitDetailDrawerProps {
  unit: UnitBoxType;
  position: { left: number; top: number };
  activeTab: "info" | "clos" | "tags";
  setActiveTab: (id: number, tab: "info" | "clos" | "tags") => void;
  unitMappings: { clos: CourseLearningOutcome[]; tags: Tag[] };
  getCLOColor: (cloId: number) => string;
  existingTags?: Tag[];
  onClose: () => void;
  onDrop: (unitKey: string, dropData: Record<string, unknown>) => void;
}

export const UnitDetailDrawer: React.FC<UnitDetailDrawerProps> = ({
  unit,
  position,
  activeTab,
  setActiveTab,
  unitMappings,
  getCLOColor,
  existingTags = [],
  onClose,
  onDrop,
}) => {
  const unitKey = unit.unitId || unit.id.toString();
  const [hoveredCLODesc, setHoveredCLODesc] = useState<string | null>(null);
  const [pos, setPos] = useState(position);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPos(position);
    // Reset drag-anchored position whenever the target unit changes
  }, [unit.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      // Don't close if user clicked this unit's expand toggle (lets it act as a toggle button)
      if (target.closest(`[data-expand-toggle="${unit.id}"]`)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [unit.id, onClose]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { dx: e.clientX - pos.left, dy: e.clientY - pos.top };
    const onMove = (ev: MouseEvent) => {
      const o = dragRef.current;
      if (!o) return;
      setPos({ left: ev.clientX - o.dx, top: ev.clientY - o.dy });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      onDrop(unitKey, JSON.parse(data));
    } catch {
      console.error("Drop parsing failed");
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute bg-white border border-gray-200 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: "320px",
        maxHeight: "420px",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleDrop}
    >
      {/* Header (drag handle) */}
      <div
        className="px-3 py-2 flex items-start justify-between shrink-0 cursor-grab active:cursor-grabbing select-none"
        style={{ backgroundColor: unit.color || "#3B82F6", color: "white" }}
        onMouseDown={handleHeaderMouseDown}
        title="Drag to move"
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h2
              className="text-base font-semibold truncate"
              title={unit.unitId || unit.name}
            >
              {unit.unitId || unit.name}
            </h2>
            {unit.spansYear && (
              <span
                className="bg-white/90 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0"
                title="Spans both semesters of the year"
              >
                YR
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-90 truncate mt-0.5">{unit.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white bg-black/10 hover:bg-black/20 rounded-full w-6 h-6 flex items-center justify-center transition-colors shrink-0"
          title="Close"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs text-gray-600 bg-gray-50 font-medium shrink-0">
        <button
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === "info"
              ? "bg-white font-bold text-blue-600 border-b-2 border-blue-500"
              : "hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab(unit.id, "info")}
        >
          Details
        </button>
        <button
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === "clos"
              ? "bg-white font-bold text-blue-600 border-b-2 border-blue-500"
              : "hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab(unit.id, "clos")}
        >
          Outcomes
        </button>
        <button
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === "tags"
              ? "bg-white font-bold text-blue-600 border-b-2 border-blue-500"
              : "hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab(unit.id, "tags")}
        >
          Tags
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 text-sm text-gray-800">
        {activeTab === "info" && (
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1 text-sm">
                {unit.name}
              </h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                {unit.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
              <span>
                Credits:{" "}
                <span className="text-gray-900">{unit.credits || "N/A"}</span>
              </span>
              {unit.semestersOffered && unit.semestersOffered.length > 0 && (
                <span>
                  Sem:{" "}
                  <span className="text-gray-900">
                    {unit.semestersOffered.join(", ")}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab === "clos" && (
          <div className="flex flex-col gap-2">
            {(unitMappings?.clos || []).length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {unitMappings.clos.map((clo) => {
                    const cloColor = clo.cloId
                      ? getCLOColor(clo.cloId)
                      : "#9CA3AF";
                    return (
                      <button
                        key={clo.cloId}
                        type="button"
                        className="text-xs px-2 py-1 rounded shadow-sm border inline-flex items-center"
                        style={{
                          backgroundColor: cloColor + "15",
                          borderColor: cloColor + "33",
                          color: cloColor,
                        }}
                        onMouseEnter={() =>
                          setHoveredCLODesc(clo.cloDesc || null)
                        }
                        onMouseLeave={() => setHoveredCLODesc(null)}
                      >
                        CLO {clo.cloId}
                      </button>
                    );
                  })}
                </div>
                {hoveredCLODesc && (
                  <div className="text-[11px] leading-snug text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
                    {hoveredCLODesc}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                <svg
                  className="w-6 h-6 mb-1 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-[11px] font-medium px-2">
                  Drag Course Outcomes Here (or Right-Click unit)
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === "tags" && (
          <div className="flex flex-col gap-2">
            {(unitMappings?.tags || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {unitMappings.tags.map((tag) => {
                  const tagColors = getTagColor(tag.tagId, existingTags);
                  return (
                    <span
                      key={tag.tagId}
                      className="font-medium text-xs px-2 py-1 rounded-full shadow-sm border"
                      style={{
                        backgroundColor: tagColors.bg,
                        borderColor: tagColors.border,
                        color: tagColors.label,
                      }}
                    >
                      {tag.tagName}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                <svg
                  className="w-6 h-6 mb-1 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <span className="text-[11px] font-medium px-2">
                  Drag Tags Here (or Right-Click unit)
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
