import React from "react";

const BOX_WIDTH = 256;

interface Assessment {
  id: number;
  assessmentId?: string;
  description?: string;
  type?: "Project" | "Test" | null;
  x: number;
  y: number;
  color?: string;
}

interface AssessmentBoxProps {
  assessment: Assessment;
  draggedAssessment?: number | null;
  selectedAssessments?: string[];

  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onClick: (assessmentId: string) => void;
  deleteAssessment: (id: number) => void;
}

export const AssessmentBox: React.FC<AssessmentBoxProps> = ({
  assessment,
  draggedAssessment,
  onDoubleClick,
  onClick,
  onMouseDown,
  deleteAssessment,
}) => {
  const key = assessment.assessmentId || assessment.id.toString();

  return (
    <div
      className={`absolute group transition-shadow duration-200 ${
        draggedAssessment === assessment.id
          ? "shadow-2xl scale-105 z-50"
          : "z-10 shadow-sm hover:shadow-md"
      }`}
      style={{
        left: `${assessment.x}px`,
        top: `${assessment.y}px`,
        width: `${BOX_WIDTH}px`,
        minHeight: "100px",
      }}
      onClick={
        assessment.assessmentId
          ? () => onClick(assessment.assessmentId!)
          : undefined
      }
      onMouseDown={(e) => onMouseDown(e, assessment.id!)}
    >
      {/* Header */}
      <div
        className="h-16 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing relative"
        style={{
          backgroundColor: assessment.color || "#8B5CF6",
          color: "white",
        }}
        onDoubleClick={() => onDoubleClick(assessment.id)}
      >
        <div className="flex-1 truncate pr-6">
          <h2
            className="text-lg font-semibold leading-tight"
            title={assessment.assessmentId}
          >
            {assessment.assessmentId}
          </h2>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteAssessment(assessment.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-3 text-sm text-gray-800 flex flex-col gap-2">
        {/* Type */}
        <div className="text-xs font-semibold text-gray-500">
          Type:
          <span className="ml-1 text-gray-900">{assessment.type || "N/A"}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-snug">
          {assessment.description || "No description provided."}
        </p>
      </div>
    </div>
  );
};
