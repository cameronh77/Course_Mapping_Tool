import React, { useState } from "react";
import type { CourseLearningOutcome, unitLearningOutcomeBox, BloomsLevel } from "../../types";

interface ULOBoxProps {
  ulo: unitLearningOutcomeBox;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (id: number) => void;
  onDelete?: (id: number) => void;
  linkedCLO?: CourseLearningOutcome | null;
  onCLODrop?: (uloId: number, clo: CourseLearningOutcome) => void;
  onCLOUnlink?: (uloId: number) => void;
  getCLOColor?: (cloId: number) => string;
  isHighlighted?: boolean;
}

const BLOOMS_STYLES: Record<
  BloomsLevel,
  { bg: string; border: string; badge: string; label: string }
> = {
  REMEMBER: {
    bg: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-200 text-red-800",
    label: "Remember",
  },
  UNDERSTAND: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    badge: "bg-orange-200 text-orange-800",
    label: "Understand",
  },
  APPLY: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-200 text-yellow-800",
    label: "Apply",
  },
  ANALYSE: {
    bg: "bg-green-50",
    border: "border-green-300",
    badge: "bg-green-200 text-green-800",
    label: "Analyse",
  },
  EVALUATE: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    badge: "bg-blue-200 text-blue-800",
    label: "Evaluate",
  },
  CREATE: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    badge: "bg-purple-200 text-purple-800",
    label: "Create",
  },
};

export const ULOBox: React.FC<ULOBoxProps> = ({
  ulo,
  onMouseDown,
  onDoubleClick,
  onDelete,
  linkedCLO,
  onCLODrop,
  onCLOUnlink,
  getCLOColor,
  isHighlighted = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const style = ulo.bloomsLevel ? BLOOMS_STYLES[ulo.bloomsLevel] : null;
  const boxBg = style?.bg ?? "bg-orange-100";
  const boxBorder = style?.border ?? "border-orange-300";

  const cloColor = linkedCLO?.cloId ? getCLOColor?.(linkedCLO.cloId) ?? "#9CA3AF" : "#9CA3AF";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("application/json")) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type === "clo" && parsed.data && onCLODrop) {
        onCLODrop(ulo.uloId ?? ulo.id!, parsed.data);
      }
    } catch {
      console.error("ULOBox drop parse failed");
    }
  };

  return (
    <div
      className={`absolute group ${boxBg} border-2 rounded-lg shadow-md cursor-move hover:shadow-lg transition-all w-64 ${
        isDragOver
          ? "border-purple-500 shadow-lg shadow-purple-200"
          : isHighlighted
          ? "border-purple-400 shadow-lg shadow-purple-100 ring-2 ring-purple-300 ring-offset-1"
          : boxBorder
      }`}
      style={{ left: ulo.x, top: ulo.y }}
      onMouseDown={(e) => onMouseDown(e, String(ulo.id!))}
      onDoubleClick={() => onDoubleClick(ulo.id!)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(ulo.id!); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="Remove ULO"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-orange-700 shrink-0">ULO</h3>

            {/* CLO pip (collapsed) */}
            {!isExpanded && linkedCLO?.cloId && (
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: cloColor }}
                title={linkedCLO.cloDesc}
              />
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {style && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {style.label}
              </span>
            )}
            {/* Expand button */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded((v) => !v); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-orange-400 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
              title={isExpanded ? "Collapse" : "Show linked outcome"}
            >
              {isExpanded ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
          {ulo.uloDesc || "No description"}
        </p>
      </div>

      {/* Expanded CLO panel */}
      {isExpanded && (
        <div
          className="border-t border-orange-200 bg-white rounded-b-lg overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Panel header */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
              Course Outcome
            </span>
            {linkedCLO && onCLOUnlink && (
              <button
                onClick={(e) => { e.stopPropagation(); onCLOUnlink(ulo.uloId ?? ulo.id!); }}
                className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                title="Unlink this outcome"
              >
                unlink
              </button>
            )}
          </div>

          {/* CLO content */}
          <div className="p-2.5">
            {linkedCLO ? (
              <div
                className="text-xs px-2 py-2 rounded flex items-start gap-1.5 shadow-sm border"
                style={{
                  backgroundColor: cloColor + "15",
                  borderColor: cloColor + "33",
                  color: cloColor,
                }}
              >
                <span className="font-bold mt-[1px] shrink-0">☷</span>
                <span className="break-words">{linkedCLO.cloDesc}</span>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg transition-colors ${
                  isDragOver
                    ? "border-purple-400 bg-purple-50 text-purple-500"
                    : "border-gray-200 bg-gray-50 text-gray-400"
                }`}
              >
                <svg className="w-5 h-5 mb-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-[11px] font-medium">
                  {isDragOver ? "Drop to link" : "Drag a Course Outcome here"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drag-over highlight overlay */}
      {isDragOver && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-purple-400 ring-offset-1 pointer-events-none" />
      )}
    </div>
  );
};
