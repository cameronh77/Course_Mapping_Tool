import React, { useState } from "react";
import { usePathwayStore } from "../../stores/usePathwayStore";
import type { PathwayType } from "../../types";

interface PathwayManagerModalProps {
  courseId: string;
  onClose: () => void;
}

const TYPES: PathwayType[] = ["CORE", "MAJOR", "MINOR", "ENTRY_POINT"];

export const PathwayManagerModal: React.FC<PathwayManagerModalProps> = ({ courseId, onClose }) => {
  const { pathways, createPathway, updatePathway, deletePathway } = usePathwayStore();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PathwayType>("MAJOR");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<PathwayType>("MAJOR");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setError(null);
      await createPathway(newName.trim(), newType, courseId);
      setNewName("");
      setNewType("MAJOR");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create pathway";
      setError(message);
    }
  };

  const startEdit = (id: number, name: string, type: PathwayType) => {
    setEditingId(id);
    setEditName(name);
    setEditType(type);
  };

  const saveEdit = async () => {
    if (editingId == null || !editName.trim()) return;
    try {
      setError(null);
      await updatePathway(editingId, editName.trim(), editType);
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
          <div className="text-xs text-slate-300 mb-2 font-semibold">Add new</div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:border-sky-400"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Pathway name"
            />
            <select
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:border-sky-400"
              value={newType}
              onChange={(e) => setNewType(e.target.value as PathwayType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
              disabled={!newName.trim()}
            >
              Add
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {pathways.length === 0 && (
            <div className="text-xs text-slate-400">No pathways yet.</div>
          )}
          {pathways.map((p) => {
            const isEditing = editingId === p.pathwayId;
            const isCore = p.type === "CORE";
            return (
              <div
                key={p.pathwayId}
                className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-700"
              >
                {isEditing ? (
                  <>
                    <input
                      className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <select
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-600 text-sm"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as PathwayType)}
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded bg-sky-600 hover:bg-sky-500"
                      onClick={saveEdit}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-sm">
                      <span>{p.name}</span>
                      <span className="ml-2 text-xs text-slate-400">{p.type}</span>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                      onClick={() => startEdit(p.pathwayId, p.name, p.type)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => handleDelete(p.pathwayId)}
                      disabled={isCore}
                      title={isCore ? "CORE pathways cannot be deleted" : "Delete pathway"}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
