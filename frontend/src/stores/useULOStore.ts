import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { CourseLearningOutcome } from "../pages/CourseEdit";

export const useULOStore = create((set) => ({
  currentULOs: [],

  createULO: async (data) => {
    try {
      console.log("Creating ULO:", data);
      const res = await axiosInstance.post("/ULO/create", data);
      console.log(res.data);
      set((state) => ({
        currentULOs: [...state.currentULOs, res.data].sort(
          (a, b) => a.uloId - b.uloId
        ),
      }));
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewULOsByUnit: async (data) => {
    try {
      const res = await axiosInstance.get(`/ULO/viewAll/${data.unitId}`, data);

      set({ currentULOs: res.data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  updateULO: async (data) => {
    try {
      const input = {
        uloDesc: data.uloDesc,
        unitId: data.unitId,
        bloomsLevel: data.bloomsLevel !== undefined ? data.bloomsLevel : undefined,
      };
      const res = await axiosInstance.put(`/ULO/update/${data.uloId}`, input);
      set((state) => ({
        currentULOs: state.currentULOs
          .map((ulo) => (ulo.uloId === data.uloId ? res.data : ulo))
          .sort((a, b) => a.uloId - b.uloId),
      }));
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  deleteULO: async (data: CourseLearningOutcome) => {
    try {
      const res = await axiosInstance.delete("/ULO/delete", { data });
      console.log(res);
      set((state) => ({
        currentULOs: state.currentULOs
          .filter((ulo) => ulo.cloId !== data.uloId)
          .sort((a, b) => a.uloId - b.uloId),
      }));
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
