import React, { useState } from "react";
import { useCourseStore } from "../../stores/useCourseStore";
import { useCLOStore } from "../../stores/useCLOStore";
import { useTagStore } from "../../stores/useTagStore";
import { THEME_COLORS } from "../common/themeViewConstants";
import type { Unit } from "../../types";

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
  getCLOColor
}) => {
  // Connect directly to stores
  const { currentCourse } = useCourseStore();
  const { currentCLOs } = useCLOStore();
  const { existingTags, createTag } = useTagStore();

  // Local state purely for the sidebar
  const [newTag, setNewTag] = useState<string>("");

  return (
    <div className="bg-white p-4 w-full h-full flex flex-col">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mb-4 shadow-sm transition-colors" onClick={handleSaveCanvas}>
        Save Canvas
      </button>

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
                  {existingTags && existingTags.map((tag: any, idx: number) => {
                    const colors = THEME_COLORS[idx % THEME_COLORS.length];
                    return (
                      <div
                        key={tag.tagId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/json", JSON.stringify({ type: 'tag', data: tag }));
                        }}
                        className="font-medium text-xs py-1 px-2.5 rounded-full cursor-grab active:cursor-grabbing shadow-sm border flex items-center gap-1 transition-colors hover:shadow-md"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.label,
                        }}
                        title="Drag onto a Unit Box"
                      >
                        <span className="text-[10px]" style={{ color: colors.text }}>●</span>
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