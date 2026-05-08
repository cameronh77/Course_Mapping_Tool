import React, { useEffect, useRef, useState } from "react";
import type { CourseLearningOutcome, Tag, UnitBox as UnitBoxType } from "../../types";
import { getTagColor } from "./themeViewConstants";

// width is now passed as a prop (unit.width)

interface UnitBoxProps {
  unit: UnitBoxType;
  draggedUnit: number | null;
  selectedUnits: string[];
  connectionMode: boolean;
  connectionSource: string | null;
  isExpanded: boolean;
  activeTab: 'info' | 'clos' | 'tags';
  unitMappings: { clos: CourseLearningOutcome[], tags: Tag[] };
  currentCLOs: CourseLearningOutcome[];
  getCLOColor: (cloId: number) => string;
  existingTags?: Tag[];
  isBlocked?: boolean;
  isHighlighted?: boolean;
  
  // Event Handlers
  onMouseDown: (e: React.MouseEvent, id: number) => void;
  onDoubleClick: (id: number) => void;
  onClick: (unitId: string) => void;
  onMouseEnter: (unitId: string | null) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent, unitKey: string) => void;
  onDrop: (unitKey: string, dropData: Record<string, unknown>) => void;
  toggleExpand: (e: React.MouseEvent, id: number) => void;
  setActiveTab: (id: number, tab: 'info' | 'clos' | 'tags') => void;
  deleteUnit: (id: number) => void;
  onStartConnection?: (unitId: string) => void;
}

export const UnitBox: React.FC<UnitBoxProps> = ({
  unit,
  draggedUnit,
  selectedUnits,
  connectionMode,
  connectionSource,
  isExpanded,
  activeTab,
  unitMappings,
  currentCLOs,
  getCLOColor,
  onMouseDown,
  onDoubleClick,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  onDrop,
  toggleExpand,
  setActiveTab,
  deleteUnit,
  existingTags = [],
  isBlocked = false,
  isHighlighted = false,
  onStartConnection,
}) => {
  const unitKey = unit.unitId || unit.id.toString();
  const [hoveredCLODesc, setHoveredCLODesc] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`Remove "${unit.unitId || unit.name}" from the canvas?`)) {
      deleteUnit(unit.id);
    }
  };

  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onStartConnection && unit.unitId) onStartConnection(unit.unitId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDoubleClick(unit.id);
  };

  return (
    <div
      className={`absolute group transition-shadow duration-200 ${draggedUnit === unit.id ? "shadow-2xl scale-105 z-50" : (isExpanded ? "z-40 shadow-xl" : "z-10 shadow-sm hover:shadow-md")}`}
      style={{ left: `${unit.x}px`, top: `${unit.y}px`, width: `${unit.width ?? 256}px`, height: isExpanded ? 'auto' : '80px', minHeight: '80px' }}
      onClick={connectionMode && unit.unitId ? () => onClick(unit.unitId!) : undefined}
      onMouseEnter={() => onMouseEnter(unit.unitId || null)}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => onContextMenu(e, unitKey)}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const dropData = e.dataTransfer.getData("application/json");
        if (dropData) {
          try {
            const parsed = JSON.parse(dropData);
            onDrop(unitKey, parsed);
          } catch { console.error("Drop parsing failed"); }
        }
      }}
    >
      <div className={`border bg-white rounded flex flex-col w-full h-full overflow-hidden ${isBlocked ? `border-2 border-red-500 ring-1 ring-red-800` : isHighlighted ? `border-2 border-amber-400 ring-2 ring-amber-300` : selectedUnits.includes(unit.unitId!) ? `border-4 border-blue-400 ring-4 ring-blue-300` : `border-gray-300`} ${connectionMode && connectionSource === unit.unitId ? "ring-4 ring-purple-400" : ""}`}>
        
        {/* Draggable Header */}
        <div 
          className="h-20 w-full flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0 relative" 
          style={{ backgroundColor: unit.color || "#3B82F6", color: "white" }}
          onMouseDown={(e) => onMouseDown(e, unit.id)} 
          onDoubleClick={() => onDoubleClick(unit.id)}
        >
          <div className="flex-1 truncate pr-6">
            <div className="flex items-center gap-2 leading-tight">
              <h2 className="text-lg font-semibold truncate" title={unit.unitId || unit.name}>{unit.unitId || unit.name}</h2>
              {unit.spansYear && (
                <span
                  className="bg-white/90 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm shrink-0"
                  title="Spans both semesters of the year"
                >
                  YR
                </span>
              )}
              {typeof unit.credits === 'number' && unit.credits > 0 && (
                <div
                  className="flex gap-0.5 items-center bg-black/10 px-1.5 py-1 rounded shrink-0"
                  title={`${unit.credits} credit point${unit.credits === 1 ? '' : 's'}`}
                >
                  {Array.from({ length: Math.min(3, Math.ceil(unit.credits / 6)) }).map((_, i) => (
                    <span key={i} className="block w-2.5 h-0.5 bg-white rounded-sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Intuitive Pips & Badges for collapsed state */}
            {!isExpanded && (
              <div className="flex flex-col mt-1.5 gap-1.5">
                {/* CLO Pipeline Visualization */}
                {currentCLOs && currentCLOs.length > 0 && (
                  <div className="flex gap-1 items-center bg-black/10 px-1.5 py-1 rounded w-max" title="Course Outcomes Coverage">
                    {currentCLOs.map((clo, idx) => {
                      const isMapped = unitMappings?.clos?.some(c => c.cloId === clo.cloId);
                      const cloColor = clo.cloId ? getCLOColor(clo.cloId) : '#9CA3AF';
                      return (
                        <div 
                          key={idx} 
                          title={clo.cloDesc} 
                          className={`w-2 h-2 rounded-full border transition-colors ${isMapped ? 'shadow-md' : 'bg-transparent border-white/40'}`}
                          style={{
                            backgroundColor: isMapped ? cloColor : 'transparent',
                            borderColor: isMapped ? cloColor : 'rgba(255,255,255,0.4)',
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Tags */}
                {unitMappings?.tags?.length > 0 && (
                  <span className="bg-white/90 text-gray-800 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm w-max">
                    {unitMappings.tags.length} TAG{unitMappings.tags.length > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
            <button
              data-expand-toggle={unit.id}
              onClick={(e) => toggleExpand(e, unit.id)}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-white bg-white/20 hover:bg-white/30 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
              title={isExpanded ? "Hide Details" : "Show Details"}
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </button>

            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-white bg-white/20 hover:bg-white/30 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                title="More actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-9 bg-white border border-gray-200 rounded-md shadow-xl text-gray-800 text-xs font-medium py-1 min-w-[160px] z-30 cursor-default"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onStartConnection && unit.unitId && !connectionMode && (
                    <button
                      onClick={handleStartConnection}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Link to unit…
                    </button>
                  )}
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit details
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                    Remove from canvas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content Area */}
        {isExpanded && (
          <div className="flex flex-col flex-1 bg-white border-t border-gray-100" style={{ height: '180px' }}>
            {/* Tabs Navigation */}
            <div className="flex border-b text-xs text-gray-600 bg-gray-50 font-medium">
              <button 
                className={`flex-1 py-2 text-center transition-colors ${activeTab === 'info' ? 'bg-white font-bold text-blue-600 border-b-2 border-blue-500' : 'hover:bg-gray-100'}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab(unit.id, 'info'); }}
              >
                Details
              </button>
              <button 
                className={`flex-1 py-2 text-center transition-colors ${activeTab === 'clos' ? 'bg-white font-bold text-blue-600 border-b-2 border-blue-500' : 'hover:bg-gray-100'}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab(unit.id, 'clos'); }}
              >
                Outcomes
              </button>
              <button 
                className={`flex-1 py-2 text-center transition-colors ${activeTab === 'tags' ? 'bg-white font-bold text-blue-600 border-b-2 border-blue-500' : 'hover:bg-gray-100'}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab(unit.id, 'tags'); }}
              >
                Tags
              </button>
            </div>

            {/* Tabs Content */}
            <div className="p-3 text-sm text-gray-800 flex-1 overflow-y-auto cursor-default" onMouseDown={(e) => e.stopPropagation()}>
              
              {activeTab === 'info' && (
                <div className="flex flex-col h-full">
                  <h3 className="font-bold text-gray-900 leading-tight mb-1">{unit.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 mb-2 flex-1">{unit.description || 'No description provided.'}</p>
                  <div className="mt-auto flex items-center justify-between text-xs font-semibold text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                    <span>Credits: <span className="text-gray-900">{unit.credits || 'N/A'}</span></span>
                  </div>
                </div>
              )}

              {activeTab === 'clos' && (
                <div className="flex flex-col gap-2 h-full">
                  {(unitMappings?.clos || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 content-start">
                      {(unitMappings?.clos || []).map(clo => {
                        const cloColor = clo.cloId ? getCLOColor(clo.cloId) : '#9CA3AF';
                        const borderColor = cloColor + '33';
                        const bgColor = cloColor + '15';
                        return (
                          <button
                            key={clo.cloId}
                            type="button"
                            className="text-xs px-2 py-1 rounded shadow-sm border inline-flex items-center justify-center w-auto"
                            style={{
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              color: cloColor,
                            }}
                            onMouseEnter={() => setHoveredCLODesc(clo.cloDesc || null)}
                            onMouseLeave={() => setHoveredCLODesc(null)}
                          >
                            {clo.cloId}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {(unitMappings?.clos || []).length > 0 && hoveredCLODesc && (
                    <div className="mt-1 text-[10px] leading-snug text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 min-h-[44px]">
                      {hoveredCLODesc}
                    </div>
                  )}
                  {!(unitMappings?.clos?.length) && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                      <svg className="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <span className="text-[11px] font-medium px-2">Drag Course Outcomes Here (or Right-Click unit)</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tags' && (
                <div className="flex flex-wrap gap-2 content-start h-full">
                  {(unitMappings?.tags || []).map(tag => {
                    const tagColors = getTagColor(tag.tagId, existingTags);
                    return (
                      <span
                        key={tag.tagId}
                        className="font-medium text-xs px-2.5 py-1 rounded-full shadow-sm border"
                        style={{
                          backgroundColor: tagColors.bg,
                          borderColor: tagColors.border,
                          color: tagColors.label,
                        }}
                      >
                        {tag.tagName}
                      </span>
                    );
                  })}
                  {!(unitMappings?.tags?.length) && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                      <svg className="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                      <span className="text-[11px] font-medium px-2">Drag Tags Here (or Right-Click unit)</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

    </div>
  );
};