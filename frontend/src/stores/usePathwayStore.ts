import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axios";
import type { Pathway } from "../types";

interface PathwayState {
  pathways: Pathway[];
  activePathwayId: number | null;
  visiblePathwayIds: number[];
  fetchPathways: (courseId: string) => Promise<void>;
  setActivePathway: (pathwayId: number) => void;
  togglePathwayVisibility: (pathwayId: number) => void;
  createPathway: (name: string, type: string, courseId: string) => Promise<Pathway>;
  deletePathway: (pathwayId: number) => Promise<void>;
  updatePathway: (pathwayId: number, name: string, type: string) => Promise<void>;
  duplicatePathway: (pathwayId: number, name: string, type: string) => Promise<Pathway>;
}

export const usePathwayStore = create<PathwayState>((set) => ({
  pathways: [],
  activePathwayId: null,
  visiblePathwayIds: [],

  fetchPathways: async (courseId: string) => {
    const res = await axios.get(`/pathway?courseId=${courseId}`);
    const pathways: Pathway[] = res.data;
    set({ pathways });
    const core = pathways.find((p) => p.type === "CORE");
    if (core) set({ activePathwayId: core.pathwayId, visiblePathwayIds: [core.pathwayId] });
  },

  setActivePathway: (pathwayId: number) => set({ activePathwayId: pathwayId }),

  togglePathwayVisibility: (pathwayId: number) =>
    set((state) => {
      const isVisible = state.visiblePathwayIds.includes(pathwayId);

      const isActive = state.activePathwayId === pathwayId;

      if (isVisible && isActive) {
        // Active pathway clicked again — hide it and promote next visible to active
        const newVisible = state.visiblePathwayIds.filter((id) => id !== pathwayId);
        const newActive = newVisible.length > 0 ? newVisible[newVisible.length - 1] : null;
        return { visiblePathwayIds: newVisible, activePathwayId: newActive };
      } else if (isVisible && !isActive) {
        // Already visible but not the editing target — promote to active (don't hide)
        return { activePathwayId: pathwayId };
      } else {
        // Hidden — show it and make it the active editing target
        return {
          visiblePathwayIds: [...state.visiblePathwayIds, pathwayId],
          activePathwayId: pathwayId,
        };
      }
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
        state.activePathwayId === pathwayId
          ? (newVisible[0] ?? null)
          : state.activePathwayId;
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
      pathways: state.pathways.map((p) =>
        p.pathwayId === pathwayId ? updated : p
      ),
    }));
  },

  duplicatePathway: async (pathwayId: number, name: string, type: string) => {
    const res = await axios.post(`/pathway/${pathwayId}/duplicate`, { name, type });
    const newPathway: Pathway = res.data;
    set((state) => ({
      pathways: [...state.pathways, newPathway],
      visiblePathwayIds: [...state.visiblePathwayIds, newPathway.pathwayId],
      activePathwayId: newPathway.pathwayId,
    }));
    return newPathway;
  },
}));
