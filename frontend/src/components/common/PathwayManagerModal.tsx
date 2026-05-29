import React, { useState } from "react";
import { usePathwayStore } from "../../stores/usePathwayStore";
import type { PathwayType } from "../../types";

interface PathwayManagerModalProps {
  courseId: string;
  onClose: () => void;
}

const TYPES: PathwayType[] = ["CORE", "MAJOR", "MINOR", "SPECIALISATION", "CUSTOM"];
const NON_CORE_TYPE_ORDER: PathwayType[] = ["MAJOR", "SPECIALISATION", "MINOR", "CUSTOM"];

export const PathwayManagerModal: React.FC<PathwayManagerModalProps> = ({ courseId, onClose }) => {
  const { pathways, createPathway, updatePathway, deletePathway } = usePathwayStore();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PathwayType>("MAJOR");
  const [addEntryLevel, setAddEntryLevel] = useState(false);
  const [entryLevelCount, setEntryLevelCount] = useState("1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<PathwayType>("MAJOR");
  const [editEntryLevelCount, setEditEntryLevelCount] = useState("0");
  const [error, setError] = useState<string | null>(null);

  // Normalize name and extract base name from entry point
  const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
  const entryPointBaseName = (name: string) =>
    normalizeName(name).replace(/\s+entry\s+(level|point)(\s+\d+)?$/i, "").trim();
  const isEntryPointFor = (entryName: string, parentName: string) =>
    entryPointBaseName(entryName) === normalizeName(parentName);

  // Get count of entry points for a parent pathway
  const getEntryPointCount = (parentId: number, parentName: string) => {
    return pathways.filter(
      (p) => p.type === "ENTRY_POINT" && isEntryPointFor(p.name, parentName)
    ).length;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setError(null);
      const trimmedName = newName.trim();
      await createPathway(trimmedName, newType, courseId);
      if (addEntryLevel) {
        const safeCount = Math.max(1, parseInt(entryLevelCount, 10) || 1);
        for (let i = 1; i <= safeCount; i += 1) {
          await createPathway(`${trimmedName} Entry Point ${i}`, "ENTRY_POINT", courseId);
        }
      }
      setNewName("");
      setNewType("MAJOR");
      setAddEntryLevel(false);
      setEntryLevelCount("1");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create pathway";
      setError(message);
    }
  };

  const startEdit = (id: number, name: string, type: PathwayType) => {
    setEditingId(id);
    setEditName(name);
    setEditType(type);
    // Count existing entry points if this is a parent pathway
    if (type !== "ENTRY_POINT") {
      const count = getEntryPointCount(id, name);
      setEditEntryLevelCount(String(count));
    } else {
      setEditEntryLevelCount(0);
    }
  };

  // Extract the trailing number from an entry point name, e.g. "CS Major Entry Point 3" → 3.
  // Returns 0 if no number is found (old unnumbered format).
  const entryPointNumber = (name: string): number => {
    const m = name.match(/\s(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const saveEdit = async () => {
    if (editingId == null || !editName.trim()) return;
    try {
      setError(null);
      const originalPathway = pathways.find((p) => p.pathwayId === editingId);
      await updatePathway(editingId, editName.trim(), editType);

      if (originalPathway && originalPathway.type !== "ENTRY_POINT") {
        const desiredCount = Math.max(0, parseInt(editEntryLevelCount, 10) || 0);
        const newParentName = editName.trim();
        const nameChanged =
          normalizeName(newParentName) !== normalizeName(originalPathway.name);

        const currentEntryPoints = pathways.filter(
          (p) => p.type === "ENTRY_POINT" && isEntryPointFor(p.name, originalPathway.name)
        );

        if (nameChanged) {
          // Parent was renamed — delete all old entry points and recreate under new name.
          for (const ep of currentEntryPoints) {
            await deletePathway(ep.pathwayId);
          }
          for (let i = 1; i <= desiredCount; i += 1) {
            await createPathway(`${newParentName} Entry Point ${i}`, "ENTRY_POINT", courseId);
          }
        } else {
          // Parent name unchanged — reconcile to exactly desiredCount numbered 1–N.
          const existingNums = new Set(
            currentEntryPoints.map((ep) => entryPointNumber(ep.name)).filter((n) => n > 0)
          );

          // Delete entry points that are out of range or have no valid number.
          for (const ep of currentEntryPoints) {
            const n = entryPointNumber(ep.name);
            if (n === 0 || n > desiredCount) {
              await deletePathway(ep.pathwayId);
            }
          }

          // Create any missing slots in 1–desiredCount.
          for (let i = 1; i <= desiredCount; i += 1) {
            if (!existingNums.has(i)) {
              await createPathway(`${newParentName} Entry Point ${i}`, "ENTRY_POINT", courseId);
            }
          }
        }
      }

      setEditingId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update pathway";
      setError(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this pathway? This cannot be undone.")) return;
    try {
      setError(null);
      const target = pathways.find((p) => p.pathwayId === id);
      if (target) {
        const entryPoints = pathways.filter(
          (p) => p.type === "ENTRY_POINT" && isEntryPointFor(p.name, target.name)
        );
        for (const ep of entryPoints) {
          await deletePathway(ep.pathwayId);
        }
      }
      await deletePathway(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete pathway";
      setError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 10001 }}
      onClick={onClose}
    >
      <div
        className="bg-slate-800 text-slate-100 rounded-lg shadow-2xl border border-slate-600 p-5 w-[28rem] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Manage pathways</h2>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-200 text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded bg-red-900/40 border border-red-700 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="mb-4 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Add new</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:border-sky-400"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Pathway name"
            />
            <select
              className="w-32 shrink-0 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:border-sky-400"
              value={newType}
              onChange={(e) => setNewType(e.target.value as PathwayType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="submit"
              className="shrink-0 px-3 py-1.5 text-xs rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
              disabled={!newName.trim()}
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900"
                checked={addEntryLevel}
                onChange={(e) => setAddEntryLevel(e.target.checked)}
              />
              Entry levels
            </label>
            {addEntryLevel && (
              <input
                type="number"
                min={1}
                step={1}
                value={entryLevelCount}
                onChange={(e) => setEntryLevelCount(e.target.value)}
                className="w-14 px-2 py-0.5 rounded bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:border-sky-400"
              />
            )}
          </div>
        </form>

        {(() => {
          const visiblePathways = pathways.filter((p) => p.type !== "ENTRY_POINT" && p.comboOf.length === 0);
          if (visiblePathways.length === 0) {
            return <div className="text-xs text-slate-400">No pathways yet.</div>;
          }

          const renderRow = (p: typeof pathways[0]) => {
            const isEditing = editingId === p.pathwayId;
            return (
              <div
                key={p.pathwayId}
                className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-700"
              >
                {isEditing ? (
                  <>
                    <input
                      className="flex-1 min-w-0 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-xs"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <select
                      className="w-28 shrink-0 px-1 py-1 rounded bg-slate-900 border border-slate-600 text-xs focus:outline-none focus:border-sky-400"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as PathwayType)}
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 shrink-0">
                      <label className="text-[10px] text-slate-400 whitespace-nowrap">EL:</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={editEntryLevelCount}
                        onChange={(e) => setEditEntryLevelCount(e.target.value)}
                        className="w-10 px-1 py-1 rounded bg-slate-900 border border-slate-600 text-xs focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <button type="button" className="shrink-0 px-2 py-1 text-xs rounded bg-sky-600 hover:bg-sky-500" onClick={saveEdit}>Save</button>
                    <button type="button" className="shrink-0 px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600" onClick={() => setEditingId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{p.name}</span>
                    <button type="button" className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600" onClick={() => startEdit(p.pathwayId, p.name, p.type)}>Edit</button>
                    {p.type !== "CORE" && (
                      <button type="button" className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600" onClick={() => handleDelete(p.pathwayId)} title="Delete pathway">Delete</button>
                    )}
                  </>
                )}
              </div>
            );
          };

          const corePathways = visiblePathways.filter((p) => p.type === "CORE");
          const nonCorePathways = visiblePathways.filter((p) => p.type !== "CORE");

          const seen = new Set<string>();
          const groups: { type: PathwayType; members: typeof pathways }[] = [];
          for (const t of NON_CORE_TYPE_ORDER) {
            const members = nonCorePathways.filter((p) => p.type === t);
            if (members.length > 0) { groups.push({ type: t, members }); seen.add(t); }
          }
          for (const p of nonCorePathways) {
            if (!seen.has(p.type)) {
              groups.push({ type: p.type as PathwayType, members: nonCorePathways.filter((q) => q.type === p.type) });
              seen.add(p.type);
            }
          }

          return (
            <div className="space-y-4">
              {corePathways.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Core</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>
                  <div className="space-y-1">{corePathways.map(renderRow)}</div>
                </div>
              )}
              {groups.map(({ type, members }) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{type}</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>
                  <div className="space-y-1">{members.map(renderRow)}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
