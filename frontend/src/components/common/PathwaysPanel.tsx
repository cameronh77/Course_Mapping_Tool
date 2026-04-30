import React, { useState } from "react";
import { usePathwayStore } from "../../stores/usePathwayStore";
import type { Pathway, PathwayRequirement, RequirementType } from "../../types";

const PALETTE = [
  "#6366F1", "#EC4899", "#10B981", "#F59E0B",
  "#3B82F6", "#EF4444", "#14B8A6", "#F97316",
  "#8B5CF6", "#84CC16",
];

const REQ_TYPE_LABELS: Record<RequirementType, string> = {
  COMPLETE_UNIT: "Complete unit",
  MIN_CREDITS:   "Minimum credits",
  COMPLETE_N_FROM: "Complete N from set",
  CUSTOM:        "Custom / external",
};

interface RequirementFormState {
  type: RequirementType;
  label: string;
  targetValue: string;
  logicGroup: string;
}

const emptyReqForm = (): RequirementFormState => ({
  type: "CUSTOM",
  label: "",
  targetValue: "",
  logicGroup: "AND",
});

interface PathwayFormState {
  sName: string;
  color: string;
  entryYear: string;
  entrySemester: string;
  description: string;
}

const emptyPathwayForm = (): PathwayFormState => ({
  sName: "",
  color: PALETTE[0],
  entryYear: "1",
  entrySemester: "1",
  description: "",
});

interface Props {
  courseId: string;
  expectedDuration: number;
  numberTeachingPeriods: number;
  unitBoxes: { unitId?: string; name: string }[];
}

export const PathwaysPanel: React.FC<Props> = ({
  courseId,
  expectedDuration,
  numberTeachingPeriods,
  unitBoxes,
}) => {
  const { pathways, createPathway, updatePathway, deletePathway, assignUnit, createRequirement, deleteRequirement } =
    usePathwayStore();

  // Which pathway card is expanded
  const [expandedSId, setExpandedSId] = useState<number | null>(null);

  // Create-pathway form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pathwayForm, setPathwayForm] = useState<PathwayFormState>(emptyPathwayForm());

  // Add-requirement form: keyed by sId
  const [reqFormSId, setReqFormSId] = useState<number | null>(null);
  const [reqForm, setReqForm] = useState<RequirementFormState>(emptyReqForm());

  // Edit-pathway inline: keyed by sId
  const [editingSId, setEditingSId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PathwayFormState>(emptyPathwayForm());

  const handleCreatePathway = async () => {
    if (!pathwayForm.sName.trim()) return;
    await createPathway({
      courseId,
      sName: pathwayForm.sName.trim(),
      color: pathwayForm.color,
      entryYear: parseInt(pathwayForm.entryYear) || 1,
      entrySemester: parseInt(pathwayForm.entrySemester) || 1,
      description: pathwayForm.description.trim() || undefined,
    });
    setPathwayForm(emptyPathwayForm());
    setShowCreateForm(false);
  };

  const handleUpdatePathway = async (sId: number) => {
    await updatePathway(sId, {
      sName: editForm.sName.trim(),
      color: editForm.color,
      entryYear: parseInt(editForm.entryYear) || 1,
      entrySemester: parseInt(editForm.entrySemester) || 1,
      description: editForm.description.trim() || undefined,
    });
    setEditingSId(null);
  };

  const handleAddRequirement = async () => {
    if (!reqForm.label.trim() || reqFormSId === null) return;
    await createRequirement({
      sId: reqFormSId,
      type: reqForm.type,
      label: reqForm.label.trim(),
      targetValue: reqForm.targetValue.trim() || undefined,
      logicGroup: reqForm.logicGroup,
    });
    setReqForm(emptyReqForm());
    setReqFormSId(null);
  };

  const handleAssignUnit = async (unitId: string, currentSId: number | null, pathway: Pathway) => {
    const newSId = currentSId === pathway.sId ? null : pathway.sId;
    await assignUnit(courseId, unitId, newSId);
  };

  const years = Array.from({ length: expectedDuration }, (_, i) => i + 1);
  const periods = Array.from({ length: numberTeachingPeriods }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 leading-snug">
          Define entry pathways with requirements shown on the timeline.
        </p>
        <button
          onClick={() => { setShowCreateForm((p) => !p); setPathwayForm(emptyPathwayForm()); }}
          className="flex-shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
        >
          + New
        </button>
      </div>

      {/* ── Create pathway form ─────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 flex flex-col gap-2">
          <p className="text-xs font-bold text-indigo-800">New Pathway</p>

          <input
            className="rounded border border-gray-300 px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-400 focus:outline-none"
            placeholder="Pathway name"
            value={pathwayForm.sName}
            onChange={(e) => setPathwayForm((p) => ({ ...p, sName: e.target.value }))}
          />

          <textarea
            className="rounded border border-gray-300 px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-400 focus:outline-none resize-none"
            placeholder="Description (optional)"
            rows={2}
            value={pathwayForm.description}
            onChange={(e) => setPathwayForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Entry Year</label>
              <select
                className="mt-0.5 rounded border border-gray-300 px-2 py-1 text-xs w-full"
                value={pathwayForm.entryYear}
                onChange={(e) => setPathwayForm((p) => ({ ...p, entryYear: e.target.value }))}
              >
                {years.map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Entry Period</label>
              <select
                className="mt-0.5 rounded border border-gray-300 px-2 py-1 text-xs w-full"
                value={pathwayForm.entrySemester}
                onChange={(e) => setPathwayForm((p) => ({ ...p, entrySemester: e.target.value }))}
              >
                {periods.map((s) => <option key={s} value={s}>Period {s}</option>)}
              </select>
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Colour</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setPathwayForm((p) => ({ ...p, color: c }))}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${pathwayForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCreatePathway}
              className="flex-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex-1 rounded border border-gray-300 text-xs text-gray-600 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Pathway cards ───────────────────────────────────────────────── */}
      {pathways.length === 0 && !showCreateForm && (
        <p className="text-xs italic text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 text-center">
          No pathways yet. Click "+ New" to define one.
        </p>
      )}

      {pathways.map((pathway) => {
        const color = pathway.color ?? "#6366F1";
        const isExpanded = expandedSId === pathway.sId;
        const isEditing = editingSId === pathway.sId;
        const pathwayUnitIds = new Set(pathway.courseUnits.map((cu) => cu.unitId));

        return (
          <div
            key={pathway.sId}
            className="rounded-xl border overflow-hidden shadow-sm"
            style={{ borderColor: color + "50" }}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
              style={{ backgroundColor: color + "18" }}
              onClick={() => setExpandedSId(isExpanded ? null : pathway.sId)}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1 text-xs font-bold text-gray-800 truncate">{pathway.sName}</span>
              <span className="text-[10px] text-gray-500 flex-shrink-0">
                Yr {pathway.entryYear ?? "?"}, P{pathway.entrySemester ?? "?"}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isExpanded && (
              <div className="px-3 py-3 flex flex-col gap-4 bg-white">

                {/* ── Edit metadata ───────────────────────────────────── */}
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      className="rounded border border-gray-300 px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                      value={editForm.sName}
                      onChange={(e) => setEditForm((p) => ({ ...p, sName: e.target.value }))}
                      placeholder="Pathway name"
                    />
                    <textarea
                      className="rounded border border-gray-300 px-2 py-1 text-xs w-full resize-none focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                      rows={2}
                      value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Entry Year</label>
                        <select
                          className="mt-0.5 rounded border border-gray-300 px-2 py-1 text-xs w-full"
                          value={editForm.entryYear}
                          onChange={(e) => setEditForm((p) => ({ ...p, entryYear: e.target.value }))}
                        >
                          {years.map((y) => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Entry Period</label>
                        <select
                          className="mt-0.5 rounded border border-gray-300 px-2 py-1 text-xs w-full"
                          value={editForm.entrySemester}
                          onChange={(e) => setEditForm((p) => ({ ...p, entrySemester: e.target.value }))}
                        >
                          {periods.map((s) => <option key={s} value={s}>Period {s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditForm((p) => ({ ...p, color: c }))}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${editForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdatePathway(pathway.sId)}
                        className="flex-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSId(null)}
                        className="flex-1 rounded border border-gray-300 text-xs text-gray-600 py-1.5 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {pathway.description && (
                        <p className="text-xs text-gray-500 italic leading-snug">{pathway.description}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Entry: Year {pathway.entryYear ?? "?"}, Period {pathway.entrySemester ?? "?"}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingSId(pathway.sId);
                          setEditForm({
                            sName: pathway.sName,
                            color: pathway.color ?? PALETTE[0],
                            entryYear: String(pathway.entryYear ?? 1),
                            entrySemester: String(pathway.entrySemester ?? 1),
                            description: pathway.description ?? "",
                          });
                        }}
                        className="text-[10px] text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded border border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete pathway "${pathway.sName}"?`)) deletePathway(pathway.sId);
                        }}
                        className="text-[10px] text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded border border-gray-200 hover:border-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Entry Requirements ──────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Entry Requirements
                    </p>
                    <button
                      onClick={() => {
                        setReqFormSId(reqFormSId === pathway.sId ? null : pathway.sId);
                        setReqForm(emptyReqForm());
                      }}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700"
                      style={{ color }}
                    >
                      + Add
                    </button>
                  </div>

                  {pathway.requirements.length === 0 && reqFormSId !== pathway.sId && (
                    <p className="text-[11px] text-gray-400 italic">None defined.</p>
                  )}

                  {/* Existing requirements list */}
                  <ul className="flex flex-col gap-1.5">
                    {pathway.requirements.map((req, i) => (
                      <React.Fragment key={req.reqId}>
                        <li className="flex items-start gap-2 group">
                          <span
                            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: color }}
                          >
                            {req.type === "COMPLETE_UNIT" && "U"}
                            {req.type === "MIN_CREDITS" && "C"}
                            {req.type === "COMPLETE_N_FROM" && "N"}
                            {req.type === "CUSTOM" && "✓"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 leading-snug">{req.label}</p>
                            <p className="text-[10px] text-gray-400">{REQ_TYPE_LABELS[req.type]}</p>
                          </div>
                          <button
                            onClick={() => deleteRequirement(req.reqId, pathway.sId)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-opacity flex-shrink-0"
                          >
                            ✕
                          </button>
                        </li>
                        {i < pathway.requirements.length - 1 && (
                          <li className="flex items-center justify-center py-0.5">
                            <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-full bg-gray-100">
                              {req.logicGroup ?? "AND"}
                            </span>
                          </li>
                        )}
                      </React.Fragment>
                    ))}
                  </ul>

                  {/* Add requirement form */}
                  {reqFormSId === pathway.sId && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 flex flex-col gap-2">
                      <select
                        className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
                        value={reqForm.type}
                        onChange={(e) => setReqForm((p) => ({ ...p, type: e.target.value as RequirementType }))}
                      >
                        {(Object.keys(REQ_TYPE_LABELS) as RequirementType[]).map((t) => (
                          <option key={t} value={t}>{REQ_TYPE_LABELS[t]}</option>
                        ))}
                      </select>

                      <input
                        className="rounded border border-gray-300 px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                        placeholder={
                          reqForm.type === "CUSTOM"
                            ? "e.g. Completed Year 12 Mathematics"
                            : reqForm.type === "MIN_CREDITS"
                            ? "e.g. Minimum 48 credit points"
                            : "Requirement description"
                        }
                        value={reqForm.label}
                        onChange={(e) => setReqForm((p) => ({ ...p, label: e.target.value }))}
                      />

                      {(reqForm.type === "COMPLETE_UNIT" || reqForm.type === "MIN_CREDITS") && (
                        <input
                          className="rounded border border-gray-300 px-2 py-1 text-xs w-full focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                          placeholder={reqForm.type === "COMPLETE_UNIT" ? "Unit ID (e.g. MATH1001)" : "Credit count (e.g. 48)"}
                          value={reqForm.targetValue}
                          onChange={(e) => setReqForm((p) => ({ ...p, targetValue: e.target.value }))}
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500">Logic:</label>
                        <select
                          className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                          value={reqForm.logicGroup}
                          onChange={(e) => setReqForm((p) => ({ ...p, logicGroup: e.target.value }))}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddRequirement}
                          className="flex-1 rounded text-white text-xs font-bold py-1.5 transition-colors"
                          style={{ backgroundColor: color }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setReqFormSId(null)}
                          className="flex-1 rounded border border-gray-300 text-xs text-gray-600 py-1.5 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Unit assignment ─────────────────────────────────── */}
                <div>
                  <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Units in this Pathway
                  </p>
                  {unitBoxes.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">No units on canvas.</p>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                      {unitBoxes.filter((u) => u.unitId).map((u) => {
                        const inPathway = pathwayUnitIds.has(u.unitId!);
                        return (
                          <label
                            key={u.unitId}
                            className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer rounded px-1.5 py-1 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded"
                              style={{ accentColor: color }}
                              checked={inPathway}
                              onChange={() => handleAssignUnit(u.unitId!, inPathway ? pathway.sId : null, pathway)}
                            />
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{u.unitId}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
