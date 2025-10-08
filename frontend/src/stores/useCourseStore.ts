import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useCourseStore = create((set) => ({
  existingCourses: [],

  createCourse: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/course/create", data);
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewCourses: async () => {
    try {
      const res = await axiosInstance.get("/course/view");
      set({ existingCourses: res.data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
