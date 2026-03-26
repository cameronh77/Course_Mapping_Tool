import React from "react";
import type { unitLearningOutcome, unitLearningOutcomeBox } from "../../types";

interface ULOBoxProps {
  ulo: unitLearningOutcomeBox;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
}

export const ULOBox: React.FC<ULOBoxProps> = ({
  ulo,
  onMouseDown,
  onDoubleClick,
}) => {
  return (
    <div
      className="absolute bg-orange-100 border border-orange-300 rounded-lg shadow-md p-3 cursor-move hover:shadow-lg transition w-64"
      style={{
        left: ulo.x,
        top: ulo.y,
      }}
      onMouseDown={(e) => onMouseDown(e, ulo.id!)}
      onDoubleClick={() => onDoubleClick(ulo.id!)}
    >
      <h3 className="text-sm font-bold text-orange-700 mb-2">
        Unit Learning Outcome
      </h3>

      <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
        {ulo.uloDesc || "No description"}
      </p>
    </div>
  );
};
