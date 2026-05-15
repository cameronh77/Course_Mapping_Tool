import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axios";
import type { CoursePathwayType } from "../types";

interface CoursePathwayTypeState {
  types: CoursePathwayType[];
  fetchTypes: (courseId: string) => Promise<void>;
  createType: (courseId: string, label: string, color: string) => Promise<CoursePathwayType>;
  updateType: (id: number, label: string, color: string) => Promise<void>;
  deleteType: (id: number) => Promise<void>;
  getTypeByLabel: (label: string) => CoursePathwayType | undefined;
}

export const useCoursePathwayTypeStore = create<CoursePathwayTypeState>((set, get) => ({
  types: [],

  fetchTypes: async (courseId: string) => {
    const res = await axios.get(`/course-pathway-type?courseId=${courseId}`);
    set({ types: res.data });
  },

  createType: async (courseId: string, label: string, color: string) => {
    const res = await axios.post("/course-pathway-type", { courseId, label, color });
    const created: CoursePathwayType = res.data;
    set((state) => ({ types: [...state.types, created] }));
    return created;
  },

  updateType: async (id: number, label: string, color: string) => {
    const res = await axios.put(`/course-pathway-type/${id}`, { label, color });
    const updated: CoursePathwayType = res.data;
    set((state) => ({
      types: state.types.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteType: async (id: number) => {
    await axios.delete(`/course-pathway-type/${id}`);
    set((state) => ({ types: state.types.filter((t) => t.id !== id) }));
  },

  getTypeByLabel: (label: string) => get().types.find((t) => t.label === label),
}));
