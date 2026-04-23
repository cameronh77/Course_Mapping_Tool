import React from "react";
import type { TeachingActivity } from "../../types";

const BOX_WIDTH = 256;

interface TeachingActivityBoxProps {
  activity: TeachingActivity;
  draggedActivity?: number | null;
  color?: string;
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onClick: (id: number) => void;
  deleteActivity: (id: number) => void;
}

export const TeachingActivityBox: React.FC<TeachingActivityBoxProps> = ({
  activity,
  draggedActivity,
  color = "#10B981",
  onMouseDown,
  onDoubleClick,
  onClick,
  deleteActivity,
}) => {
  return (
    <div
      className={`absolute group transition-shadow duration-200 ${
        draggedActivity === activity.id
          ? "shadow-2xl scale-105 z-50"
          : "z-10 shadow-sm hover:shadow-md"
      }`}
      style={{
        left: `${activity.x}px`,
        top: `${activity.y}px`,
        width: `${BOX_WIDTH}px`,
        minHeight: "80px",
      }}
      onClick={() => onClick(activity.id)}
      onMouseDown={(e) => onMouseDown(e, activity.id)}
    >
      {/* Header */}
      <div
        className="h-12 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing relative"
        style={{ backgroundColor: color, color: "white" }}
        onDoubleClick={() => onDoubleClick(activity.id)}
      >
        <div className="flex-1 truncate pr-6">
          <h2 className="text-sm font-semibold leading-tight" title={activity.name}>
            {activity.name || "Teaching Activity"}
          </h2>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); deleteActivity(activity.id); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        className="p-3 border border-t-0 rounded-b text-sm text-gray-800 flex flex-col gap-1"
        style={{
          backgroundColor: `${color}1A`,
          borderColor: `${color}66`,
        }}
      >
        <div className="text-xs font-semibold text-gray-500">
          Type: <span className="text-gray-900">{activity.type || "N/A"}</span>
        </div>
        <p className="text-xs text-gray-600 leading-snug">
          {activity.description || "No description provided."}
        </p>
      </div>
    </div>
  );
};
