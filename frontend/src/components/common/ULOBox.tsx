import React from "react";
import type { unitLearningOutcomeBox } from "../../types";

interface ULOBoxProps {
  ulo: unitLearningOutcomeBox;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const ULOBox: React.FC<ULOBoxProps> = ({
  ulo,
  onMouseDown,
  onDoubleClick,
  onDelete,
}) => {
  return (
    <div
      className="absolute group bg-orange-100 border border-orange-300 rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition w-64"
      style={{
        left: ulo.x,
        top: ulo.y,
      }}
      onMouseDown={(e) => onMouseDown(e, ulo.id!)}
      onDoubleClick={() => onDoubleClick(ulo.id!)}
    >
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

      <h3 className="text-sm font-bold text-orange-700 mb-2">
        Unit Learning Outcome
      </h3>

      <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
        {ulo.uloDesc || "No description"}
      </p>
    </div>
  );
};
