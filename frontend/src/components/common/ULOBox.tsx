import React from "react";
import type { unitLearningOutcomeBox, BloomsLevel } from "../../types";

interface ULOBoxProps {
  ulo: unitLearningOutcomeBox;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onDelete?: (id: number) => void;
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
}) => {
  const style = ulo.bloomsLevel ? BLOOMS_STYLES[ulo.bloomsLevel] : null;
  const boxBg = style?.bg ?? "bg-orange-100";
  const boxBorder = style?.border ?? "border-orange-300";

  return (
    <div
      className={`absolute group ${boxBg} border ${boxBorder} rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition w-64`}
      style={{
        left: ulo.x,
        top: ulo.y,
      }}
      onMouseDown={(e) => onMouseDown(e, ulo.id!)}
      onDoubleClick={() => onDoubleClick(ulo.id!)}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ulo.id!);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="Remove ULO"
        >
          ×
        </button>
      )}

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-orange-700">
          Unit Learning Outcome
        </h3>
        {style && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}
          >
            {style.label}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
        {ulo.uloDesc || "No description"}
      </p>
    </div>
  );
};
