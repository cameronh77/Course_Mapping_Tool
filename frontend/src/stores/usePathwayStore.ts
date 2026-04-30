import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { Pathway, PathwayRequirement } from "../types";

interface PathwayStore {
  pathways: Pathway[];

  loadPathways: (courseId: string) => Promise<void>;

  createPathway: (data: {
    courseId: string;
    sName: string;
    color?: string;
    entryYear?: number | null;
    entrySemester?: number | null;
    description?: string;
  }) => Promise<Pathway | null>;

  updatePathway: (
    sId: number,
    data: Partial<Pick<Pathway, "sName" | "color" | "entryYear" | "entrySemester" | "description">>
  ) => Promise<void>;

  deletePathway: (sId: number) => Promise<void>;

  assignUnit: (courseId: string, unitId: string, sId: number | null) => Promise<void>;

  createRequirement: (data: {
    sId: number;
    type: PathwayRequirement["type"];
    label: string;
    targetValue?: string;
    logicGroup?: string;
    unitOptions?: string[];
  }) => Promise<void>;

  updateRequirement: (
    reqId: number,
    data: Partial<Pick<PathwayRequirement, "label" | "targetValue" | "logicGroup">> & { unitOptions?: string[] }
  ) => Promise<void>;

  deleteRequirement: (reqId: number, sId: number) => Promise<void>;
}

export const usePathwayStore = create<PathwayStore>((set, get) => ({
  pathways: [],

  loadPathways: async (courseId) => {
    try {
      const res = await axiosInstance.get(`/pathway/view?courseId=${courseId}`);
      set({ pathways: res.data });
    } catch (error) {
      console.error("Failed to load pathways", error);
    }
  },

  createPathway: async (data) => {
    try {
      const res = await axiosInstance.post("/pathway/create", data);
      set((state) => ({ pathways: [...state.pathways, res.data] }));
      return res.data;
    } catch (error) {
      console.error("Failed to create pathway", error);
      return null;
    }
  },

  updatePathway: async (sId, data) => {
    try {
      const res = await axiosInstance.put(`/pathway/update/${sId}`, data);
      set((state) => ({
        pathways: state.pathways.map((p) => (p.sId === sId ? res.data : p)),
      }));
    } catch (error) {
      console.error("Failed to update pathway", error);
    }
  },

  deletePathway: async (sId) => {
    try {
      await axiosInstance.delete(`/pathway/delete/${sId}`);
      set((state) => ({ pathways: state.pathways.filter((p) => p.sId !== sId) }));
    } catch (error) {
      console.error("Failed to delete pathway", error);
    }
  },

  assignUnit: async (courseId, unitId, sId) => {
    try {
      await axiosInstance.post("/pathway/assign-unit", { courseId, unitId, sId });
      // Refresh pathways to reflect updated courseUnits
      const currentPathways = get().pathways;
      if (currentPathways.length > 0) {
        await get().loadPathways(courseId);
      }
    } catch (error) {
      console.error("Failed to assign unit to pathway", error);
    }
  },

  createRequirement: async (data) => {
    try {
      const res = await axiosInstance.post("/pathway/requirement/create", data);
      set((state) => ({
        pathways: state.pathways.map((p) =>
          p.sId === data.sId
            ? { ...p, requirements: [...p.requirements, res.data] }
            : p
        ),
      }));
    } catch (error) {
      console.error("Failed to create requirement", error);
    }
  },

  updateRequirement: async (reqId, data) => {
    try {
      const res = await axiosInstance.put(`/pathway/requirement/update/${reqId}`, data);
      set((state) => ({
        pathways: state.pathways.map((p) => ({
          ...p,
          requirements: p.requirements.map((r) => (r.reqId === reqId ? res.data : r)),
        })),
      }));
    } catch (error) {
      console.error("Failed to update requirement", error);
    }
  },

  deleteRequirement: async (reqId, sId) => {
    try {
      await axiosInstance.delete(`/pathway/requirement/delete/${reqId}`);
      set((state) => ({
        pathways: state.pathways.map((p) =>
          p.sId === sId
            ? { ...p, requirements: p.requirements.filter((r) => r.reqId !== reqId) }
            : p
        ),
      }));
    } catch (error) {
      console.error("Failed to delete requirement", error);
    }
  },
}));
