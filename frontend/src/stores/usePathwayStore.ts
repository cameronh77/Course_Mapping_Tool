import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axios";
import type { Pathway } from "../types";

interface PathwayState {
  pathways: Pathway[];
  activePathwayId: number | null;
  secondaryPathwayId: number | null;
  visiblePathwayIds: number[];
  _courseId: string | null;
  fetchPathways: (courseId: string) => Promise<void>;
  setActivePathway: (pathwayId: number) => void;
  setSecondaryPathway: (pathwayId: number | null) => void;
  togglePathwayVisibility: (pathwayId: number) => void;
  createPathway: (name: string, type: string, courseId: string) => Promise<Pathway>;
  deletePathway: (pathwayId: number) => Promise<void>;
  updatePathway: (pathwayId: number, name: string, type: string) => Promise<void>;
}

const selectionKey = (courseId: string) => `pathway_selection_${courseId}`;

const loadPersistedSelection = (
  courseId: string,
  pathways: Pathway[]
): { activePathwayId: number; secondaryPathwayId: number | null; visiblePathwayIds: number[] } | null => {
  try {
    const raw = localStorage.getItem(selectionKey(courseId));
    if (!raw) return null;
    const { activePathwayId, visiblePathwayIds, secondaryPathwayId } = JSON.parse(raw) as {
      activePathwayId: number;
      visiblePathwayIds: number[];
      secondaryPathwayId?: number | null;
    };
    const validIds = new Set(pathways.map((p) => p.pathwayId));
    const validVisible = visiblePathwayIds.filter((id) => validIds.has(id));
    if (validVisible.length > 0 && validIds.has(activePathwayId)) {
      const validSecondary =
        secondaryPathwayId != null && validIds.has(secondaryPathwayId) && secondaryPathwayId !== activePathwayId
          ? secondaryPathwayId
          : null;
      return { activePathwayId, secondaryPathwayId: validSecondary, visiblePathwayIds: validVisible };
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
  secondaryPathwayId: null,
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
      // Clear secondary if it matches the new active pathway.
      const secondaryId = state.secondaryPathwayId !== pathwayId ? state.secondaryPathwayId : null;
      const newVisible = [pathwayId, ...(secondaryId ? [secondaryId] : [])];
      persistSelection(state._courseId, pathwayId, newVisible);
      return { activePathwayId: pathwayId, secondaryPathwayId: secondaryId, visiblePathwayIds: newVisible };
    }),

  setSecondaryPathway: (pathwayId: number | null) =>
    set((state) => {
      const newVisible = [
        ...(state.activePathwayId ? [state.activePathwayId] : []),
        ...(pathwayId ? [pathwayId] : []),
      ];
      persistSelection(state._courseId, state.activePathwayId, newVisible);
      return { secondaryPathwayId: pathwayId, visiblePathwayIds: newVisible };
    }),

  togglePathwayVisibility: (pathwayId: number) =>
    set((state) => {
      const isCore = state.pathways.find((p) => p.pathwayId === pathwayId)?.type === "CORE";
      const isVisible = state.visiblePathwayIds.includes(pathwayId);
      const isActive = state.activePathwayId === pathwayId;

      let next: Partial<PathwayState>;

      if (isCore) {
        // CORE is always visible — clicking just changes the active editing target.
        next = { activePathwayId: pathwayId };
      } else if (isVisible && isActive) {
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

  createPathway: async (name: string, type: string, courseId: string) => {
    const res = await axios.post("/pathway", { name, type, courseId });
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
