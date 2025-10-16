import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useTagStore = create((set, get) => ({
  existingTags: [],
  existingTagConnections: [],

  createTag: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/tag/create", data);
      set((state) => ({
        existingTags: [...state.existingTags, res.data],
      }));
      console.log(res.data);
      console.log(get().existingTags);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  addUnitTags: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/tag/associate-unit", data);
      set((state) => ({
        existingTagConnections: [...state.existingTagConnections, res.data],
      }));
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewCourseTags: async (data) => {
    try {
      const res = await axiosInstance.get(`/tag/view-tags/${data}`);
      set({ existingTags: res.data });
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewUnitTagsByCourse: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.get(`/tag/view-unit-course/${data}`);
      console.log(res);
      set({ existingTagConnections: res.data });
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
