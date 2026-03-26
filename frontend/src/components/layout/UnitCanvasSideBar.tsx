import React, { useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";

export interface AssessmentTemplate {
  type: string;
  label: string;
}

interface UnitSidebarProps {
  handleSaveCanvas: () => void;

  handleNewAssessmentMouseDown: (
    e: React.MouseEvent,
    template: AssessmentTemplate
  ) => void;

  handleNewULOMouseDown: (
    e: React.MouseEvent,
    template: { type: string; label: string }
  ) => void;

  getCLOColor: (cloId: number) => string;
}

export const UnitSidebar: React.FC<UnitSidebarProps> = ({
  handleSaveCanvas,
  handleNewAssessmentMouseDown,
  handleNewULOMouseDown,
  getCLOColor,
}) => {
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();
  const { existingTags, createTag } = useTagStore();

  const [newTag, setNewTag] = useState("");

  // 🔹 Assessment templates
  const assessmentTemplates: AssessmentTemplate[] = [
    { type: "ASSIGNMENT", label: "📝 Assignment" },
    { type: "QUIZ", label: "❓ Quiz" },
    { type: "EXAM", label: "📘 Exam" },
    { type: "PROJECT", label: "🛠 Project" },
    { type: "PRESENTATION", label: "🎤 Presentation" },
  ];

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      {/* Save */}
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full mb-4 shadow-sm"
        onClick={handleSaveCanvas}
      >
        Save Assessments
      </button>

      <div className="overflow-y-auto flex-1 flex flex-col gap-6">
        {/* ========================= */}
        {/* CREATE ASSESSMENTS */}
        {/* ========================= */}
        <div>
          <h2 className="text-sm font-bold mb-2 text-blue-800 border-b pb-1">
            Create Assessment
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Drag onto canvas to create a new assessment.
          </p>

          <div className="flex flex-col gap-2">
            {assessmentTemplates.map((template) => (
              <div
                key={template.type}
                draggable
                onMouseDown={(e) => handleNewAssessmentMouseDown(e, template)}
                className="p-3 rounded border bg-blue-50 hover:bg-blue-100 cursor-grab active:cursor-grabbing shadow-sm text-sm font-medium text-blue-800 transition"
              >
                {template.label}
              </div>
            ))}
          </div>
        </div>

        {/* ========================= */}
        {/* CREATE UNIT LEARNING OUTCOME */}
        {/* ========================= */}
        <div>
          <h2 className="text-sm font-bold mb-2 text-orange-800 border-b pb-1">
            Create Unit Learning Outcome
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Drag onto canvas to create a new ULO.
          </p>

          <div className="flex flex-col gap-2">
            <div
              draggable
              onMouseDown={(e) =>
                handleNewULOMouseDown(e, {
                  type: "ULO",
                  label: "New ULO",
                })
              }
              className="p-3 rounded border bg-orange-50 hover:bg-orange-100 cursor-grab active:cursor-grabbing shadow-sm text-sm font-medium text-orange-800 transition"
            >
              ➕ New ULO
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* CLO MAPPING */}
        {/* ========================= */}
        <div>
          <h2 className="text-sm font-bold mb-2 text-purple-800 border-b pb-1">
            Course Outcomes
          </h2>
          <p className="text-xs text-gray-500 mb-3">Drag onto an assessment.</p>

          <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto">
            {currentCLOs?.map((clo: any) => {
              const cloColor = getCLOColor(clo.cloId);
              return (
                <div
                  key={clo.cloId}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ type: "clo", data: clo })
                    );
                  }}
                  className="text-xs p-2 rounded cursor-grab border shadow-sm flex gap-2"
                  style={{
                    backgroundColor: cloColor + "15",
                    borderColor: cloColor + "33",
                    color: cloColor,
                  }}
                >
                  <span>☷</span>
                  <span>{clo.cloDesc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
