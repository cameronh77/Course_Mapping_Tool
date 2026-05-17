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

const PATHWAY_TYPE_ORDER = ["MAJOR", "SPECIALISATION", "MINOR", "CUSTOM"];

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
  const { pathways, activePathwayId, visiblePathwayIds, setActivePathway, setVisibility } = usePathwayStore();
  const { getTypeByLabel } = useCoursePathwayTypeStore();

  // Local state purely for the sidebar
  const [newTag, setNewTag] = useState<string>("");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [pathwayManagerOpen, setPathwayManagerOpen] = useState(false);
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyFromLoading, setCopyFromLoading] = useState(false);
  const copyFromRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const handlers = getWhiteboardHandlers();

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

  useEffect(() => {
    if (!addDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addDropdownOpen]);

  const nonEntryPathways = useMemo(
    () => pathways.filter((p) => p.type !== "ENTRY_POINT" && p.comboOf.length === 0),
    [pathways]
  );

  const corePathway = useMemo(
    () => nonEntryPathways.find((p) => p.type === "CORE") ?? null,
    [nonEntryPathways]
  );

  const groupedNonCore = useMemo(() => {
    const nonCore = nonEntryPathways.filter((p) => p.type !== "CORE");
    const seen = new Set<string>();
    const result: { type: string; members: typeof nonCore }[] = [];
    for (const type of PATHWAY_TYPE_ORDER) {
      const members = nonCore.filter((p) => p.type === type);
      if (members.length > 0) {
        result.push({ type, members });
        seen.add(type);
      }
    }
    for (const p of nonCore) {
      if (!seen.has(p.type)) {
        result.push({ type: p.type, members: nonCore.filter((q) => q.type === p.type) });
        seen.add(p.type);
      }
    }
    return result;
  }, [nonEntryPathways]);

  const pathwayTypeBadgeStyle = (typeLabel: string): React.CSSProperties => {
    const color = getTypeByLabel(typeLabel)?.color ?? "#6B7280";
    return { backgroundColor: `${color}22`, color };
  };

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors" onClick={handleSaveCanvas}>
        Save Canvas
      </button>

      {/* ── Pathway Selection ───────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pathways</label>
          <div className="flex items-center gap-2">
            {onCopyFromPathway && nonEntryPathways.filter((p) => p.pathwayId !== activePathwayId).length > 0 && (
              <div className="relative" ref={copyFromRef}>
                <button
                  type="button"
                  disabled={copyFromLoading}
                  onClick={() => setCopyFromOpen((o) => !o)}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                  title="Copy all units from another pathway into this one"
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
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded shrink-0" style={pathwayTypeBadgeStyle(p.type)}>
                            {p.type}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setPathwayManagerOpen(true)}
              className="text-[10px] font-semibold text-gray-400 hover:text-blue-500 transition-colors"
            >
              Manage
            </button>
          </div>
        </div>

        {nonEntryPathways.length === 0 ? (
          <button
            type="button"
            onClick={() => setPathwayManagerOpen(true)}
            className="w-full px-3 py-2 rounded-md border border-dashed border-gray-200 text-xs text-gray-400 italic text-center hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            No pathways — add one
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            {/* CORE — toggleable, pinned at top with its own section label */}
            {corePathway && (() => {
              const isCoreActive = corePathway.pathwayId === activePathwayId;
              const isCoreVisible = visiblePathwayIds.includes(corePathway.pathwayId);
              const toggleCore = () => {
                if (isCoreVisible) {
                  setVisibility(corePathway.pathwayId, false);
                } else {
                  setVisibility(corePathway.pathwayId, true);
                  setActivePathway(corePathway.pathwayId);
                }
              };
              return (
                <div className="mt-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
                    CORE
                  </p>
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-colors ${
                      isCoreActive
                        ? "border-blue-400 bg-blue-50"
                        : isCoreVisible
                        ? "border-blue-200 bg-blue-50/50 hover:border-blue-300"
                        : "border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/30"
                    }`}
                    onClick={toggleCore}
                  >
                    <input
                      type="checkbox"
                      checked={isCoreVisible}
                      onChange={() => {}}
                      onClick={(e) => { e.stopPropagation(); toggleCore(); }}
                      className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-blue-500"
                    />
                    <span className={`flex-1 truncate text-sm ${isCoreActive ? "font-semibold text-gray-800" : isCoreVisible ? "font-medium text-gray-600" : "text-gray-400"}`}>
                      {corePathway.name}
                    </span>
                    {isCoreActive && (
                      <svg className="w-3 h-3 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Non-CORE grouped by type */}
            {groupedNonCore.map(({ type, members }) => (
              <div key={type} className="mt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
                  {type}
                </p>
                <div className="flex flex-col gap-0.5">
                  {members.map((p) => {
                    const isActive = p.pathwayId === activePathwayId;
                    const isVisible = visiblePathwayIds.includes(p.pathwayId);
                    return (
                      <div
                        key={p.pathwayId}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-colors ${
                          isActive
                            ? "border-blue-400 bg-blue-50"
                            : isVisible
                            ? "border-gray-200 bg-gray-50 hover:border-gray-300"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (isVisible) {
                            setVisibility(p.pathwayId, false);
                          } else {
                            setVisibility(p.pathwayId, true);
                            setActivePathway(p.pathwayId);
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={`pathway-group-${type}`}
                          checked={isVisible}
                          onChange={() => {}}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isVisible) {
                              setVisibility(p.pathwayId, false);
                            } else {
                              setVisibility(p.pathwayId, true);
                              setActivePathway(p.pathwayId);
                            }
                          }}
                          className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-blue-500"
                        />
                        <span className={`flex-1 truncate text-sm ${isActive ? "font-semibold text-gray-800" : isVisible ? "font-medium text-gray-600" : "text-gray-400"}`}>
                          {p.name}
                        </span>
                        {isActive && (
                          <svg className="w-3 h-3 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {secondaryPathwayConflict && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
            <svg className="mt-0.5 w-3 h-3 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            One or more overlay pathways conflict with current slots
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
          <div className="relative mb-4" ref={addDropdownRef}>
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
                    { type: 'CORE' as const,               icon: '◆', label: 'Core Unit',          border: 'border-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-800'    },
                    { type: 'ELECTIVE' as const,            icon: '✦', label: 'Free Elective',       border: 'border-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-800'   },
                    { type: 'SELECTIVE_ELECTIVE' as const,  icon: '⊞', label: 'Selective Elective',  border: 'border-orange-400',  bg: 'bg-orange-50',  text: 'text-orange-800'  },
                    { type: 'JUNCTION' as const,            icon: '⑂', label: 'OR Junction',         border: 'border-purple-400',  bg: 'bg-purple-50',  text: 'text-purple-800'  },
                    { type: 'AND' as const,                 icon: '⊕', label: 'AND Junction',        border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-800' },
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
              <input type="text" placeholder="Search to drag..." className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" value={searchTerm} onChange={handleSearchChange} onFocus={() => setShowSearchResults(true)} onBlur={() => setTimeout(() => setShowSearchResults(false), 150)} />
              
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