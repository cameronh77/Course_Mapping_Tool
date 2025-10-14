import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useCLOStore = create((set) => ({
  currentCLOs: [],

  createCLO: async (data) => {
    try {
      console.log("Creating CLO:", data);
      const res = await axiosInstance.post("/CLO/create", data);
      console.log(res.data);
      set((state) => ({
        currentCLOs: [...state.currentCLOs, res.data].sort(
          (a, b) => a.cloId - b.cloId
        ),
      }));
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewCLOsByCourse: async (data) => {
    try {
      const res = await axiosInstance.get(
        `/CLO/viewAll/${data.courseId}`,
        data
      );

      set({ currentCLOs: res.data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  updateCLO: async (data) => {
    try {
      const input = {
        cloDesc: data.cloDesc,
        courseId: data.courseId,
      };
      const res = await axiosInstance.put(`/CLO/update/${data.cloId}`, input);
      set((state) => ({
        currentCLOs: state.currentCLOs
          .map((clo) => (clo.cloId === data.cloId ? res.data : clo))
          .sort((a, b) => a.cloId - b.cloId),
      }));
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
