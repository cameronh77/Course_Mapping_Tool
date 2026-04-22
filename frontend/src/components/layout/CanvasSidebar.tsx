import React, { useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";
import type { Unit } from "../../types";

interface CanvasSidebarProps {
  handleSaveCanvas: () => void;
  setShowCreateForm: (show: boolean) => void;
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  searchResults: Unit[];
  handleNewUnitMouseDown: (e: React.MouseEvent, unit: Unit) => void;
  connectionMode: boolean;
  setConnectionMode: (mode: boolean) => void;
  setConnectionSource: (source: string | null) => void;
  selectedRelationType: string;
  setSelectedRelationType: (type: any) => void;
  getCLOColor: (cloId: number) => string;
}

type DockSection = "units" | "connections" | "mapping";

interface SectionHeaderProps {
  id: DockSection;
  label: string;
  accent: string;
  expanded: boolean;
  onToggle: (id: DockSection) => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  id,
  label,
  accent,
  expanded,
  onToggle,
}) => (
  <button
    onClick={() => onToggle(id)}
    className={`w-full flex items-center justify-between py-2 px-2 text-xs font-bold uppercase tracking-wider border-b ${accent} hover:bg-gray-50 transition-colors`}
  >
    <span>{label}</span>
    <span className="text-gray-400">{expanded ? "▾" : "▸"}</span>
  </button>
);

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  handleSaveCanvas,
  setShowCreateForm,
  searchTerm,
  handleSearchChange,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  handleNewUnitMouseDown,
  connectionMode,
  setConnectionMode,
  setConnectionSource,
  selectedRelationType,
  setSelectedRelationType,
  getCLOColor,
}) => {
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();
  const { existingTags, createTag } = useTagStore();

  const [newTag, setNewTag] = useState<string>("");
  const [expanded, setExpanded] = useState<Record<DockSection, boolean>>({
    units: true,
    connections: true,
    mapping: true,
  });

  const toggleSection = (id: DockSection) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors"
        onClick={handleSaveCanvas}
      >
        Save Canvas
      </button>

      <div className="overflow-y-auto flex-1 flex flex-col gap-4">
        {/* Units Section */}
        <section>
          <SectionHeader
            id="units"
            label="📚 Units"
            accent="text-blue-700 border-blue-100"
            expanded={expanded.units}
            onToggle={toggleSection}
          />
          {expanded.units && (
            <div className="pt-3 animate-fade-in">
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Unit
              </button>

              <div className="relative">
                <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">
                  Search & Drag Existing Units
                </label>
                <input
                  type="text"
                  placeholder="Search to drag..."
                  className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                />

                {showSearchResults &&
                  searchTerm.length > 0 &&
                  searchResults.length > 0 && (
                    <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                      {searchResults.map((unit) => (
                        <div
                          key={unit.unitId}
                          className="px-4 py-3 text-black hover:bg-blue-50 cursor-grab active:cursor-grabbing border-b border-gray-100 last:border-0 transition-colors"
                          onMouseDown={(e) => handleNewUnitMouseDown(e, unit)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-blue-700 text-xs">
                              {unit.unitId}
                            </span>
                            <span className="text-sm font-medium">
                              {unit.unitName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </section>

        {/* Links Section */}
        <section>
          <SectionHeader
            id="connections"
            label="🔗 Links"
            accent="text-red-700 border-red-100"
            expanded={expanded.connections}
            onToggle={toggleSection}
          />
          {expanded.connections && (
            <div className="pt-3 animate-fade-in">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-xs text-red-600 mb-3">
                  Click "Enter Mode", then click a source unit, followed by a
                  target unit to map prerequisites.
                </p>
                <button
                  className={`${
                    connectionMode
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-white text-red-600 border border-red-300 hover:bg-red-50"
                  } font-bold py-2 px-4 rounded w-full mb-3 shadow-sm transition-colors text-sm`}
                  onClick={() => {
                    setConnectionMode(!connectionMode);
                    setConnectionSource(null);
                  }}
                >
                  {connectionMode ? (
                    <span className="text-white">Exit Connection Mode</span>
                  ) : (
                    "Enter Connection Mode"
                  )}
                </button>
                {connectionMode && (
                  <div className="mt-3 bg-white p-3 rounded border border-red-200 shadow-sm">
                    <label className="block text-gray-700 text-xs font-bold mb-2">
                      Relationship Type:
                    </label>
                    <select
                      className="shadow-sm border-gray-300 border rounded w-full py-1.5 px-2 text-sm text-gray-700 focus:ring-red-400 focus:border-red-400"
                      value={selectedRelationType}
                      onChange={(e) =>
                        setSelectedRelationType(e.target.value as any)
                      }
                    >
                      <option value="PREREQUISITE">Prerequisite</option>
                      <option value="COREQUISITE">Corequisite</option>
                      <option value="PROGRESSION">Progression</option>
                      <option value="CONNECTED">Connected</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Mapping Section */}
        <section>
          <SectionHeader
            id="mapping"
            label="🎯 Mapping"
            accent="text-purple-700 border-purple-100"
            expanded={expanded.mapping}
            onToggle={toggleSection}
          />
          {expanded.mapping && (
            <div className="pt-3 animate-fade-in flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-bold mb-2 text-purple-800 border-b border-purple-100 pb-1">
                  Course Outcomes
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Drag to a unit to map outcomes.
                </p>
                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                  {currentCLOs &&
                    currentCLOs.map((clo: any) => {
                      const typedCLO = clo as {
                        cloId: number;
                        cloDesc: string;
                      };
                      const cloColor = typedCLO.cloId
                        ? getCLOColor(typedCLO.cloId)
                        : "#9CA3AF";
                      const borderColor = cloColor + "33";
                      const bgColor = cloColor + "15";
                      return (
                        <div
                          key={typedCLO.cloId}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify({ type: "clo", data: clo })
                            );
                          }}
                          className="text-xs p-2 rounded cursor-grab active:cursor-grabbing shadow-sm border flex items-start gap-2 transition-colors hover:shadow-md"
                          style={{
                            backgroundColor: bgColor,
                            borderColor: borderColor,
                            color: cloColor,
                          }}
                          title="Drag onto a Unit Box"
                        >
                          <span className="font-bold mt-0.5">☷</span>
                          <span>{typedCLO.cloDesc}</span>
                        </div>
                      );
                    })}
                  {!currentCLOs?.length && (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded text-center border border-dashed">
                      No CLOs configured for this course.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold mb-2 text-green-800 border-b border-green-100 pb-1">
                  Themes & Tags
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New tag name..."
                    className="shadow-sm border border-gray-300 rounded w-full py-1.5 px-2 text-sm text-gray-700 focus:ring-green-400 focus:border-green-400"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded shadow-sm text-sm whitespace-nowrap transition-colors"
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
                <div className="flex flex-wrap gap-2 mt-3 max-h-[20vh] overflow-y-auto">
                  {existingTags &&
                    existingTags.map((tag: any) => (
                      <div
                        key={tag.tagId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({ type: "tag", data: tag })
                          );
                        }}
                        className="bg-green-50 hover:bg-green-100 text-green-800 font-medium text-xs py-1 px-2.5 rounded-full cursor-grab active:cursor-grabbing shadow-sm border border-green-200 flex items-center gap-1 transition-colors"
                        title="Drag onto a Unit Box"
                      >
                        <span className="text-[10px] text-green-500">●</span>
                        {tag.tagName}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
