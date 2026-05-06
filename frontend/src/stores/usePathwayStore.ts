import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axios";
import type { Pathway } from "../types";

interface PathwayState {
  pathways: Pathway[];
  activePathwayId: number | null;
  fetchPathways: (courseId: string) => Promise<void>;
  setActivePathway: (pathwayId: number) => void;
  createPathway: (name: string, type: string, courseId: string) => Promise<Pathway>;
  deletePathway: (pathwayId: number) => Promise<void>;
  updatePathway: (pathwayId: number, name: string, type: string) => Promise<void>;
}

export const usePathwayStore = create<PathwayState>((set) => ({
  pathways: [],
  activePathwayId: null,

  fetchPathways: async (courseId: string) => {
    const res = await axios.get(`/pathway?courseId=${courseId}`);
    const pathways: Pathway[] = res.data;
    set({ pathways });
    const core = pathways.find((p) => p.type === "CORE");
    if (core) set({ activePathwayId: core.pathwayId });
  },

  setActivePathway: (pathwayId: number) => set({ activePathwayId: pathwayId }),

  createPathway: async (name: string, type: string, courseId: string) => {
    const res = await axios.post("/pathway", { name, type, courseId });
    const pathway: Pathway = res.data;
    set((state) => ({ pathways: [...state.pathways, pathway] }));
    return pathway;
  },

  deletePathway: async (pathwayId: number) => {
    await axios.delete(`/pathway/${pathwayId}`);
    set((state) => ({
      pathways: state.pathways.filter((p) => p.pathwayId !== pathwayId),
    }));
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
}));
