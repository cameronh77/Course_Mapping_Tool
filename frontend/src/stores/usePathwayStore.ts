import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axios";
import type { Pathway } from "../types";

interface PathwayState {
  pathways: Pathway[];
  activePathwayId: number | null;
  visiblePathwayIds: number[];
  _courseId: string | null;
  fetchPathways: (courseId: string) => Promise<void>;
  setActivePathway: (pathwayId: number) => void;
  setVisibility: (pathwayId: number, visible: boolean) => void;
  togglePathwayVisibility: (pathwayId: number) => void;
  createPathway: (name: string, type: string, courseId: string, comboOf?: number[]) => Promise<Pathway>;
  deletePathway: (pathwayId: number) => Promise<void>;
  updatePathway: (pathwayId: number, name: string, type: string) => Promise<void>;
}

const selectionKey = (courseId: string) => `pathway_selection_${courseId}`;

const loadPersistedSelection = (
  courseId: string,
  pathways: Pathway[]
): { activePathwayId: number; visiblePathwayIds: number[] } | null => {
  try {
    const raw = localStorage.getItem(selectionKey(courseId));
    if (!raw) return null;
    const { activePathwayId, visiblePathwayIds } = JSON.parse(raw) as {
      activePathwayId: number;
      visiblePathwayIds: number[];
    };
    const validIds = new Set(pathways.map((p) => p.pathwayId));
    const validVisible = visiblePathwayIds.filter((id) => validIds.has(id));
    if (validVisible.length > 0 && validIds.has(activePathwayId)) {
      return { activePathwayId, visiblePathwayIds: validVisible };
    }
  } catch { /* ignore */ }
  return null;
};

const persistSelection = (
  courseId: string | null,
  activePathwayId: number | null,
  visiblePathwayIds: number[]
) => {
  if (!courseId) return;
  try {
    localStorage.setItem(
      selectionKey(courseId),
      JSON.stringify({ activePathwayId, visiblePathwayIds })
    );
  } catch { /* ignore */ }
};

export const usePathwayStore = create<PathwayState>((set) => ({
  pathways: [],
  activePathwayId: null,
  visiblePathwayIds: [],
  _courseId: null,

  fetchPathways: async (courseId: string) => {
    const res = await axios.get(`/pathway?courseId=${courseId}`);
    const pathways: Pathway[] = res.data;

    set((state) => {
      // Don't override an active in-session selection for the same course.
      if (state._courseId === courseId && state.visiblePathwayIds.length > 0) {
        return { pathways };
      }

      // Try to restore a previously persisted selection for this course.
      const saved = loadPersistedSelection(courseId, pathways);
      if (saved) {
        return { pathways, _courseId: courseId, ...saved };
      }

      // Fall back to CORE, then first non-entry-point, then first pathway.
      const defaultPathway =
        pathways.find((p) => p.type === "CORE") ??
        pathways.find((p) => p.type !== "ENTRY_POINT") ??
        pathways[0];

      if (defaultPathway) {
        const selection = {
          activePathwayId: defaultPathway.pathwayId,
          visiblePathwayIds: [defaultPathway.pathwayId],
        };
        persistSelection(courseId, selection.activePathwayId, selection.visiblePathwayIds);
        return { pathways, _courseId: courseId, ...selection };
      }

      return { pathways, _courseId: courseId };
    });
  },

  setActivePathway: (pathwayId: number) =>
    set((state) => {
      const newVisible = state.visiblePathwayIds.includes(pathwayId)
        ? state.visiblePathwayIds
        : [...state.visiblePathwayIds, pathwayId];
      persistSelection(state._courseId, pathwayId, newVisible);
      return { activePathwayId: pathwayId, visiblePathwayIds: newVisible };
    }),

  setVisibility: (pathwayId: number, visible: boolean) =>
    set((state) => {
      if (visible) {
        if (state.visiblePathwayIds.includes(pathwayId)) return {};
        const targetType = state.pathways.find((p) => p.pathwayId === pathwayId)?.type;
        // Remove any other visible pathway of the same type (one-per-type rule).
        const withoutSameType = targetType
          ? state.visiblePathwayIds.filter(
              (id) => state.pathways.find((p) => p.pathwayId === id)?.type !== targetType
            )
          : state.visiblePathwayIds;
        const newVisible = [...withoutSameType, pathwayId];
        // If the evicted pathway was the active one, promote the newly added pathway.
        const newActive = state.visiblePathwayIds
          .filter((id) => !newVisible.includes(id))
          .includes(state.activePathwayId ?? -1)
          ? pathwayId
          : state.activePathwayId;
        persistSelection(state._courseId, newActive, newVisible);
        return { visiblePathwayIds: newVisible, activePathwayId: newActive };
      }
      const newVisible = state.visiblePathwayIds.filter((id) => id !== pathwayId);
      const newActive =
        state.activePathwayId === pathwayId ? (newVisible[0] ?? null) : state.activePathwayId;
      persistSelection(state._courseId, newActive, newVisible);
      return { visiblePathwayIds: newVisible, activePathwayId: newActive };
    }),

  togglePathwayVisibility: (pathwayId: number) =>
    set((state) => {
      const isVisible = state.visiblePathwayIds.includes(pathwayId);
      const isActive = state.activePathwayId === pathwayId;

      let next: Partial<PathwayState>;

      if (isVisible && isActive) {
        // Active pathway clicked again — hide it and promote the next visible to active.
        const newVisible = state.visiblePathwayIds.filter((id) => id !== pathwayId);
        const newActive = newVisible.length > 0 ? newVisible[newVisible.length - 1] : null;
        next = { visiblePathwayIds: newVisible, activePathwayId: newActive };
      } else if (isVisible && !isActive) {
        // Already visible but not the editing target — promote to active (don't hide).
        next = { activePathwayId: pathwayId };
      } else {
        // Hidden — show it and make it the active editing target.
        next = {
          visiblePathwayIds: [...state.visiblePathwayIds, pathwayId],
          activePathwayId: pathwayId,
        };
      }

      persistSelection(
        state._courseId,
        (next.activePathwayId ?? state.activePathwayId) as number | null,
        (next.visiblePathwayIds ?? state.visiblePathwayIds) as number[]
      );

      return next;
    }),

  createPathway: async (name: string, type: string, courseId: string, comboOf?: number[]) => {
    const res = await axios.post("/pathway", { name, type, courseId, comboOf: comboOf ?? [] });
    const pathway: Pathway = res.data;
    set((state) => ({ pathways: [...state.pathways, pathway] }));
    return pathway;
  },

  deletePathway: async (pathwayId: number) => {
    await axios.delete(`/pathway/${pathwayId}`);
    set((state) => {
      const newVisible = state.visiblePathwayIds.filter((id) => id !== pathwayId);
      const newActive =
        state.activePathwayId === pathwayId ? (newVisible[0] ?? null) : state.activePathwayId;
      persistSelection(state._courseId, newActive, newVisible);
      return {
        pathways: state.pathways.filter((p) => p.pathwayId !== pathwayId),
        visiblePathwayIds: newVisible,
        activePathwayId: newActive,
      };
    });
  },

  updatePathway: async (pathwayId: number, name: string, type: string) => {
    const res = await axios.put(`/pathway/${pathwayId}`, { name, type });
    const updated: Pathway = res.data;
    set((state) => ({
      pathways: state.pathways.map((p) => (p.pathwayId === pathwayId ? updated : p)),
    }));
  },
}));
