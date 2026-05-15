import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";
import { usePathwayStore } from "../../stores/usePathwayStore";
import { useCoursePathwayTypeStore } from "../../stores/useCoursePathwayTypeStore";
import { getWhiteboardHandlers } from "../../lib/whiteboardHandlers";
import { PathwayManagerModal } from "../common/PathwayManagerModal";
import { getTagColor } from "../common/themeViewConstants";
import type { Tag, Unit, PlaceholderType } from "../../types";

interface CanvasSidebarProps {
  sidebarTab: 'units' | 'connections' | 'mapping';
  setSidebarTab: (tab: 'units' | 'connections' | 'mapping') => void;
  showWhiteboardControls?: boolean;
  connectionMode?: boolean;
  handleSaveCanvas: () => void;
  setShowCreateForm: (show: boolean) => void;
  searchTerm: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showSearchResults: boolean;
  setShowSearchResults: (show: boolean) => void;
  searchResults: Unit[];
  handleNewUnitMouseDown: (e: React.MouseEvent, unit: Unit) => void;
  setConnectionMode: (mode: boolean) => void;
  setConnectionSource?: (source: string | null) => void;
  selectedRelationType?: string;
  setSelectedRelationType?: (type: string) => void;
  getCLOColor: (cloId: number) => string;
  selectedTagFilters?: number[];
  onToggleTagFilter?: (tagId: number) => void;
  onClearTagFilters?: () => void;
  handlePlaceholderMouseDown?: (e: React.MouseEvent, type: PlaceholderType) => void;
  unallocatedUnits?: Unit[];
  onDeleteUnallocated?: (unitId: string) => void;
  secondaryPathwayConflict?: boolean;
  onCopyFromPathway?: (sourcePathwayId: number) => Promise<void>;
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  sidebarTab,
  setSidebarTab,
  showWhiteboardControls = false,
  handleSaveCanvas,
  setShowCreateForm,
  searchTerm,
  handleSearchChange,
  showSearchResults,
  setShowSearchResults,
  searchResults,
  handleNewUnitMouseDown,
  setConnectionMode,
  getCLOColor,
  selectedTagFilters = [],
  onToggleTagFilter = () => {},
  onClearTagFilters = () => {},
  handlePlaceholderMouseDown,
  unallocatedUnits = [],
  onDeleteUnallocated,
  secondaryPathwayConflict = false,
  onCopyFromPathway,
}) => {
  // Connect directly to stores
  const { currentCourse } = useCourseStore() as any;
  const { currentCLOs } = useCLOStore() as any;
  const { existingTags, createTag } = useTagStore() as any;
  const { pathways, activePathwayId, setActivePathway, secondaryPathwayId, setSecondaryPathway } = usePathwayStore();
  const { getTypeByLabel } = useCoursePathwayTypeStore();

  // Local state purely for the sidebar
  const [newTag, setNewTag] = useState<string>("");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [pathwayManagerOpen, setPathwayManagerOpen] = useState(false);
  const [pathwayDropdownOpen, setPathwayDropdownOpen] = useState(false);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyFromLoading, setCopyFromLoading] = useState(false);
  const pathwayDropdownRef = useRef<HTMLDivElement>(null);
  const secondaryDropdownRef = useRef<HTMLDivElement>(null);
  const copyFromRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!secondaryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (secondaryDropdownRef.current && !secondaryDropdownRef.current.contains(e.target as Node)) {
        setSecondaryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [secondaryDropdownOpen]);

  useEffect(() => {
    if (!copyFromOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (copyFromRef.current && !copyFromRef.current.contains(e.target as Node)) {
        setCopyFromOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [copyFromOpen]);

  const activePathway = pathways.find((p) => p.pathwayId === activePathwayId) ?? null;
  const secondaryPathway = pathways.find((p) => p.pathwayId === secondaryPathwayId) ?? null;

  const nonEntryPathways = useMemo(
    () => pathways.filter((p) => p.type !== "ENTRY_POINT"),
    [pathways]
  );

  const dropdownPathways = useMemo(
    () => nonEntryPathways,
    [nonEntryPathways]
  );

  // Secondary dropdown excludes the currently active primary pathway.
  const secondaryDropdownPathways = useMemo(
    () => nonEntryPathways.filter((p) => p.pathwayId !== activePathwayId),
    [nonEntryPathways, activePathwayId]
  );

  const pathwayTypeBadge: Record<string, string> = {
    CORE: "bg-blue-100 text-blue-700",
    MAJOR: "bg-purple-100 text-purple-700",
    MINOR: "bg-amber-100 text-amber-700",
    SPECIALISATION: "bg-rose-100 text-rose-700",
    ENTRY_POINT: "bg-emerald-100 text-emerald-700",
    CUSTOM: "bg-teal-100 text-teal-700",
  };

  const pathwayTypeBadgeStyle = (typeLabel: string): React.CSSProperties => {
    const color = getTypeByLabel(typeLabel)?.color ?? "#6B7280";
    return { backgroundColor: `${color}22`, color };
  };

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors" onClick={handleSaveCanvas}>
        Save Canvas
      </button>

      <div className="mb-4" ref={pathwayDropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pathway
          </label>
          <div className="flex items-center gap-2">
            {/* Copy from dropdown */}
            {onCopyFromPathway && nonEntryPathways.filter((p) => p.pathwayId !== activePathwayId).length > 0 && (
              <div className="relative" ref={copyFromRef}>
                <button
                  type="button"
                  disabled={copyFromLoading}
                  onClick={() => setCopyFromOpen((o) => !o)}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                  title="Copy all units from another pathway"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copyFromLoading ? "Copying…" : "copy from"}
                </button>
                {copyFromOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[160px]">
                    {nonEntryPathways
                      .filter((p) => p.pathwayId !== activePathwayId)
                      .map((p) => (
                        <button
                          key={p.pathwayId}
                          type="button"
                          onClick={async () => {
                            setCopyFromOpen(false);
                            setCopyFromLoading(true);
                            await onCopyFromPathway(p.pathwayId);
                            setCopyFromLoading(false);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left transition-colors"
                        >
                          <span className="truncate">{p.name}</span>
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0"
                            style={pathwayTypeBadgeStyle(p.type)}
                          >
                            {p.type}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {!showSecondary && secondaryDropdownPathways.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSecondary(true)}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 hover:text-blue-500 transition-colors"
                title="Add secondary pathway overlay"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                view
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (pathways.length === 0) {
                setPathwayManagerOpen(true);
                return;
              }
              setPathwayDropdownOpen((o) => !o);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
                  {pathways.length === 0 ? "Add pathway" : "Select pathway"}
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
                {dropdownPathways.map((p) => {
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

        {/* Secondary pathway — only shown after clicking "+ pathway" */}
        {(showSecondary || secondaryPathwayId !== null) && (
          <div className="mt-1.5" ref={secondaryDropdownRef}>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setSecondaryDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-dashed border-gray-300 rounded-md text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={secondaryDropdownOpen}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {secondaryPathway ? (
                      <>
                        <span className="truncate font-medium text-gray-700">{secondaryPathway.name}</span>
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
                          style={pathwayTypeBadgeStyle(secondaryPathway.type)}
                        >
                          {secondaryPathway.type}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Select secondary…</span>
                    )}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${secondaryDropdownOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {secondaryDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden"
                    role="listbox"
                  >
                    <div className="max-h-60 overflow-y-auto py-1">
                      {/* None — always present so the user can revert */}
                      <button
                        type="button"
                        role="option"
                        aria-selected={secondaryPathwayId === null}
                        onClick={() => {
                          setSecondaryPathway(null);
                          setSecondaryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          secondaryPathwayId === null ? "bg-purple-50 text-purple-700" : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="w-4 shrink-0">
                          {secondaryPathwayId === null && (
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="italic">None</span>
                      </button>
                      {secondaryDropdownPathways.map((p) => {
                        const isSelected = p.pathwayId === secondaryPathwayId;
                        return (
                          <button
                            type="button"
                            key={p.pathwayId}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSecondaryPathway(p.pathwayId);
                              setSecondaryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                              isSelected ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="w-4 shrink-0">
                                {isSelected && (
                                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className="truncate">{p.name}</span>
                            </span>
                            <span
                              className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
                              style={pathwayTypeBadgeStyle(p.type)}
                            >
                              {p.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Remove secondary */}
              <button
                type="button"
                onClick={() => {
                  setSecondaryPathway(null);
                  setSecondaryDropdownOpen(false);
                  setShowSecondary(false);
                }}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove secondary pathway"
              >
                ×
              </button>
            </div>

            {secondaryPathwayConflict && (
              <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                <svg className="mt-0.5 w-3 h-3 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Not compatible with current pathway
              </div>
            )}
          </div>
        )}

      </div>

      {pathwayManagerOpen && currentCourse?.courseId && (
        <PathwayManagerModal
          courseId={currentCourse.courseId}
          onClose={() => setPathwayManagerOpen(false)}
        />
      )}

      {showWhiteboardControls && (
        <>
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
                    handlers.addTeachingActivity?.();
                    setAddDropdownOpen(false);
                  }}
                  className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-indigo-50 text-indigo-600"
                >
                  + Teaching Activity
                </button>
                <button
                  onClick={() => {
                    handlers.addCLO?.();
                    setAddDropdownOpen(false);
                  }}
                  className="rounded px-3 py-1.5 text-xs font-semibold text-left hover:bg-pink-50 text-pink-600"
                >
                  + CLO
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
        </>
      )}

      {/* Phase Navigation Tabs */}
      {!showWhiteboardControls && <div className="flex w-full mb-5 bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
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
      </div>}

      {/* Scrollable Tab Content */}
      {!showWhiteboardControls && <div className="overflow-y-auto flex-1">
        {/* Phase 1: UNITS */}
        {sidebarTab === 'units' && (
          <div className="animate-fade-in">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-6 shadow-sm transition-colors" onClick={() => setShowCreateForm(true)}>
              Create New Unit
            </button>

            {/* Placeholder blocks */}
            <div className="mb-4">
              <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">Placeholders</label>
              <div className="flex flex-col gap-2">
                {(
                  [
                    { type: 'CORE' as const,     icon: '◆', label: 'Core Unit',  border: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-800'   },
                    { type: 'ELECTIVE' as const,  icon: '✦', label: 'Elective',   border: 'border-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-800'  },
                    { type: 'JUNCTION' as const,  icon: '⑂', label: 'OR Junction', border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-800' },
                  ]
                ).map(({ type, icon, label, border, bg, text }) => (
                  <div
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed ${border} ${bg} ${text} text-xs font-semibold cursor-grab active:cursor-grabbing select-none transition-opacity hover:opacity-80`}
                    onMouseDown={handlePlaceholderMouseDown ? (e) => handlePlaceholderMouseDown(e, type) : undefined}
                    title={`Drag onto canvas to place a ${label} placeholder`}
                  >
                    <span className="text-sm">{icon}</span>
                    {label}
                    <span className="ml-auto text-[10px] opacity-50">drag</span>
                  </div>
                ))}
              </div>
            </div>

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

            {/* Unallocated Units — added to a theme but not yet placed on the timeline */}
            {unallocatedUnits.length > 0 && (
              <div className="mt-2">
                <label className="block text-amber-700 text-xs font-bold mb-2 uppercase tracking-wide">
                  Unallocated Units
                  <span className="ml-1 text-[10px] font-semibold text-amber-600">
                    ({unallocatedUnits.length})
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  In a theme but not on the timeline. Drag onto the timeline to place.
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {unallocatedUnits.map((unit) => (
                    <div
                      key={unit.unitId}
                      className="group/unalloc relative px-3 py-2 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 cursor-grab active:cursor-grabbing transition-colors"
                      onMouseDown={(e) => handleNewUnitMouseDown(e, unit)}
                      title="Drag onto the timeline (or another theme group) to place this unit"
                    >
                      <div className="flex flex-col pr-5">
                        <span className="font-bold text-amber-800 text-xs">{unit.unitId}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">{unit.unitName}</span>
                      </div>
                      {onDeleteUnallocated && (
                        <button
                          type="button"
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-100 hover:bg-red-500 hover:text-white text-amber-700 text-[11px] font-bold flex items-center justify-center opacity-0 group-hover/unalloc:opacity-100 transition-opacity"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove unit "${unit.unitId}" from this canvas?`)) {
                              onDeleteUnallocated(unit.unitId);
                            }
                          }}
                          title="Remove unit from canvas"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <p className="text-xs text-red-600 mb-3">Hover a unit and click the link icon in its top-left corner to start a connection. Pick a relationship type, then click the target unit. Press Esc to cancel.</p>
              <div className="bg-white rounded border border-red-100 p-3 shadow-sm">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Legend</p>
                <ul className="flex flex-col gap-1.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2"><span className="w-3 h-0.5" style={{ backgroundColor: "#EF4444" }} />Prerequisite</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-0.5" style={{ backgroundColor: "#F59E0B" }} />Corequisite</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-0.5" style={{ backgroundColor: "#10B981" }} />Progression</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-0.5" style={{ backgroundColor: "#6366F1" }} />Connected</li>
                </ul>
                <p className="text-[10px] text-gray-400 mt-2">Click a connection line on the canvas to delete it.</p>
              </div>
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
      </div>}
    </div>
  );
};