import React, { useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";
import type { Assessment } from "../../types";

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

  getCLOColor: (cloId: number) => string;
}

export const UnitSidebar: React.FC<UnitSidebarProps> = ({
  handleSaveCanvas,
  handleNewAssessmentMouseDown,
  getCLOColor,
}) => {
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();
  const { existingTags, createTag } = useTagStore();

  const [newTag, setNewTag] = useState("");

  // 🔹 Assessment templates (you can expand this later)
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

        {/* ========================= */}
        {/* TAGS */}
        {/* ========================= */}
        <div>
          <h2 className="text-sm font-bold mb-2 text-green-800 border-b pb-1">
            Tags
          </h2>

          <div className="flex flex-wrap gap-2 mb-3 max-h-[20vh] overflow-y-auto">
            {existingTags?.map((tag: any) => (
              <div
                key={tag.tagId}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ type: "tag", data: tag })
                  );
                }}
                className="bg-green-50 hover:bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full cursor-grab border"
              >
                ● {tag.tagName}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New tag..."
              className="border rounded w-full py-1 px-2 text-sm"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button
              className="bg-green-500 text-white px-3 rounded text-sm"
              onClick={() => {
                if (newTag && currentCourse?.courseId) {
                  createTag({
                    tagName: newTag,
                    courseId: currentCourse.courseId,
                  });
                  setNewTag("");
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
