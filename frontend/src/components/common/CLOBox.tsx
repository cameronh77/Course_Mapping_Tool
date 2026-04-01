import React from "react";
import type { CourseLearningOutcome } from "../../types";

interface CLOBoxProps {
  clo: CourseLearningOutcome;
  x: number;
  y: number;
  width: number;
  isDragging: boolean;
  isSelected: boolean;
  color: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const CLOBox: React.FC<CLOBoxProps> = ({
  clo,
  x,
  y,
  width,
  isDragging,
  isSelected,
  color,
  onMouseDown,
  onClick,
}) => {
  const side = Math.min(width, 72);

  return (
    <div
      className={`absolute border shadow transition-shadow flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing ${
        isDragging ? "z-50 shadow-2xl" : "z-20 hover:shadow-lg"
      } ${isSelected ? "ring-2 ring-blue-300" : ""}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${side}px`,
        height: `${side}px`,
        backgroundColor: color,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={clo.cloDesc}
    >
      <span className="text-2xl leading-none select-none">{clo.cloId ?? "-"}</span>

      {isSelected && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[200px] max-w-[280px] p-2 rounded border border-gray-200 bg-white text-gray-700 text-xs leading-relaxed shadow-xl z-[60] pointer-events-none">
          {clo.cloDesc}
        </div>
      )}
    </div>
  );
};
