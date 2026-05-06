import React, { useEffect, useRef, useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";
import { usePathwayStore } from "../../stores/usePathwayStore";
import { getWhiteboardHandlers } from "../../lib/whiteboardHandlers";
import { PathwayManagerModal } from "../common/PathwayManagerModal";
import { getTagColor } from "../common/themeViewConstants";
import type { Tag, Unit } from "../../types";

interface CanvasSidebarProps {
  sidebarTab: 'units' | 'connections' | 'mapping';
  setSidebarTab: (tab: 'units' | 'connections' | 'mapping') => void;
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
  selectedTagFilters?: number[];
  onToggleTagFilter?: (tagId: number) => void;
  onClearTagFilters?: () => void;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  sidebarTab,
  setSidebarTab,
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
  selectedTagFilters = [],
  onToggleTagFilter = () => {},
  onClearTagFilters = () => {},
}) => {
  // Connect directly to stores
  const { currentCourse } = useCourseStore() as any;
  const { currentCLOs } = useCLOStore() as any;
  const { existingTags, createTag } = useTagStore() as any;
  const { pathways, activePathwayId, setActivePathway } = usePathwayStore();

  // Local state purely for the sidebar
  const [newTag, setNewTag] = useState<string>("");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [pathwayManagerOpen, setPathwayManagerOpen] = useState(false);
  const [pathwayDropdownOpen, setPathwayDropdownOpen] = useState(false);
  const pathwayDropdownRef = useRef<HTMLDivElement>(null);
  const handlers = getWhiteboardHandlers();

  useEffect(() => {
    if (!pathwayDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pathwayDropdownRef.current && !pathwayDropdownRef.current.contains(e.target as Node)) {
        setPathwayDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pathwayDropdownOpen]);

  const activePathway = pathways.find((p) => p.pathwayId === activePathwayId) ?? null;
  const pathwayTypeBadge: Record<string, string> = {
    CORE: "bg-blue-100 text-blue-700",
    MAJOR: "bg-purple-100 text-purple-700",
    MINOR: "bg-amber-100 text-amber-700",
    ENTRY_POINT: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors" onClick={handleSaveCanvas}>
        Save Canvas
      </button>

      <div className="mb-4" ref={pathwayDropdownRef}>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
          Pathway
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPathwayDropdownOpen((o) => !o)}
            disabled={pathways.length === 0}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-haspopup="listbox"
            aria-expanded={pathwayDropdownOpen}
          >
            <span className="flex items-center gap-2 min-w-0">
              {activePathway ? (
                <>
                  <span className="truncate font-medium text-gray-800">{activePathway.name}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      pathwayTypeBadge[activePathway.type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {activePathway.type}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">
                  {pathways.length === 0 ? "No pathways" : "Select pathway"}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                pathwayDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {pathwayDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden"
              role="listbox"
            >
              <div className="max-h-60 overflow-y-auto py-1">
                {pathways.map((p) => {
                  const isActive = p.pathwayId === activePathwayId;
                  return (
                    <button
                      type="button"
                      key={p.pathwayId}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => {
                        setActivePathway(p.pathwayId);
                        setPathwayDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-4 shrink-0">
                          {isActive && (
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          pathwayTypeBadge[p.type] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.type}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPathwayDropdownOpen(false);
                  setPathwayManagerOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage pathways
              </button>
            </div>
          )}
        </div>
      </div>

      {pathwayManagerOpen && currentCourse?.courseId && (
        <PathwayManagerModal
          courseId={currentCourse.courseId}
          onClose={() => setPathwayManagerOpen(false)}
        />
      )}

      <div className="relative mb-4">
        <button
          onClick={() => setAddDropdownOpen((prev) => !prev)}
          className="btn btn-sm w-full gap-2 transition-colors bg-green-600 text-white hover:bg-green-700"
        >
          <span>Add</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
        {addDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-xl z-50">
            <button
              onClick={() => {
                handlers.addUnit?.();
                setAddDropdownOpen(false);
              }}
              className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-blue-50 text-blue-600"
            >
              + Unit
            </button>
            <button
              onClick={() => {
                handlers.addCLO?.();
                setAddDropdownOpen(false);
              }}
              className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-pink-50 text-pink-600"
            >
              + CLO Box
            </button>
            <button
              onClick={() => {
                handlers.addULO?.();
                setAddDropdownOpen(false);
              }}
              className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-cyan-50 text-cyan-600"
            >
              + ULO Box
            </button>
            <button
              onClick={() => {
                handlers.addAssessment?.();
                setAddDropdownOpen(false);
              }}
              className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-amber-50 text-amber-700"
            >
              + Assessment Box
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Tag Filter</span>
          {!!selectedTagFilters.length && (
            <button
              type="button"
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
              onClick={onClearTagFilters}
            >
              Clear
            </button>
          )}
        </div>
        <p className="mb-2 text-[11px] text-gray-500">
          Select tags to show only matching units and their connections.
        </p>
        <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
          {existingTags && existingTags.length > 0 ? (
            existingTags.map((tag: Tag) => {
              const checked = selectedTagFilters.includes(tag.tagId);
              const tagColors = getTagColor(tag.tagId, existingTags);
              return (
                <label key={tag.tagId} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs text-gray-700 hover:bg-white">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300"
                    style={{ accentColor: tagColors.text }}
                    checked={checked}
                    onChange={() => onToggleTagFilter(tag.tagId)}
                  />
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tagColors.text }}
                  />
                  <span className="truncate" style={{ color: tagColors.label }}>{tag.tagName}</span>
                </label>
              );
            })
          ) : (
            <p className="text-xs italic text-gray-400">No tags available.</p>
          )}
        </div>
      </div>

      {/* Phase Navigation Tabs */}
      <div className="flex w-full mb-5 bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
        <button 
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sidebarTab === 'units' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`} 
          onClick={() => { setSidebarTab('units'); setConnectionMode(false); }}
        >
          📚 Units
        </button>
        <button 
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sidebarTab === 'connections' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500 hover:text-gray-800'}`} 
          onClick={() => setSidebarTab('connections')}
        >
          🔗 Links
        </button>
        <button 
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sidebarTab === 'mapping' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-800'}`} 
          onClick={() => { setSidebarTab('mapping'); setConnectionMode(false); }}
        >
          🎯 Mapping
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="overflow-y-auto flex-1">
        {/* Phase 1: UNITS */}
        {sidebarTab === 'units' && (
          <div className="animate-fade-in">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-6 shadow-sm transition-colors" onClick={() => setShowCreateForm(true)}>
              Create New Unit
            </button>

            <div className="relative mb-4">
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">Search & Drag Existing Units</label>
              <input type="text" placeholder="Search to drag..." className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" value={searchTerm} onChange={handleSearchChange} onFocus={() => setShowSearchResults(true)} />
              
              {showSearchResults && searchTerm.length > 0 && searchResults.length > 0 && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((unit) => (
                    <div
                      key={unit.unitId}
                      className="px-4 py-3 text-black hover:bg-blue-50 cursor-grab active:cursor-grabbing border-b border-gray-100 last:border-0 transition-colors"
                      onMouseDown={(e) => handleNewUnitMouseDown(e, unit)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700 text-xs">{unit.unitId}</span>
                        <span className="text-sm font-medium">{unit.unitName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 2: CONNECTIONS */}
        {sidebarTab === 'connections' && (
          <div className="animate-fade-in">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-bold mb-2 text-red-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Link Units
              </h2>
              <p className="text-xs text-red-600 mb-4">Click "Enter Mode", then click a source unit, followed by a target unit to map prerequisites.</p>
              <button className={`${connectionMode ? "bg-red-600 hover:bg-red-700" : "bg-white text-red-600 border border-red-300 hover:bg-red-50"} font-bold py-2 px-4 rounded w-full mb-3 shadow-sm transition-colors text-sm`} onClick={() => { setConnectionMode(!connectionMode); setConnectionSource(null); }}>
                {connectionMode ? <span className="text-white">Exit Connection Mode</span> : "Enter Connection Mode"}
              </button>
              {connectionMode && (
                <div className="mt-3 bg-white p-3 rounded border border-red-200 shadow-sm">
                  <label className="block text-gray-700 text-xs font-bold mb-2">Relationship Type:</label>
                  <select className="shadow-sm border-gray-300 border rounded w-full py-1.5 px-2 text-sm text-gray-700 focus:ring-red-400 focus:border-red-400" value={selectedRelationType} onChange={(e) => setSelectedRelationType(e.target.value as any)}>
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

        {/* Phase 3: MAPPING (CLOs and Tags) */}
        {sidebarTab === 'mapping' && (
          <div className="animate-fade-in flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-bold mb-2 text-purple-800 border-b border-purple-100 pb-1">Course Outcomes</h2>
              <p className="text-xs text-gray-500 mb-3">Drag to a unit to map outcomes.</p>
              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                  {currentCLOs && currentCLOs.map((clo: any) => {
                    const typedCLO = clo as { cloId: number; cloDesc: string };
                    const cloColor = typedCLO.cloId ? getCLOColor(typedCLO.cloId) : '#9CA3AF';
                    const borderColor = cloColor + '33';
                    const bgColor = cloColor + '15';
                    return (
                      <div
                        key={typedCLO.cloId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: 'clo', data: clo }));
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
                  {!currentCLOs?.length && <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded text-center border border-dashed">No CLOs configured for this course.</p>}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold mb-2 text-green-800 border-b border-green-100 pb-1">Themes & Tags</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="New tag name..." className="shadow-sm border border-gray-300 rounded w-full py-1.5 px-2 text-sm text-gray-700 focus:ring-green-400 focus:border-green-400" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded shadow-sm text-sm whitespace-nowrap transition-colors" onClick={() => { if(newTag && currentCourse?.courseId) { createTag({ tagName: newTag, courseId: currentCourse.courseId }); setNewTag(""); }}}>
                  Add
                </button>
              </div>
              <br></br>
              <div className="flex flex-wrap gap-2 mb-3 max-h-[20vh] overflow-y-auto">
                  {existingTags && existingTags.map((tag: any) => {
                    const tagColors = getTagColor(tag.tagId, existingTags);
                    return (
                      <div
                        key={tag.tagId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: 'tag', data: tag }));
                        }}
                        className="font-medium text-xs py-1 px-2.5 rounded-full cursor-grab active:cursor-grabbing shadow-sm border flex items-center gap-1 transition-colors"
                        style={{
                          backgroundColor: tagColors.bg,
                          borderColor: tagColors.border,
                          color: tagColors.label,
                        }}
                        title="Drag onto a Unit Box"
                      >
                        <span className="text-[10px]" style={{ color: tagColors.text }}>●</span>
                        {tag.tagName}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};