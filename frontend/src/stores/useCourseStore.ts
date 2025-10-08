import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useCourseStore = create((set) => ({
  existingCourses: [],

  createCourse: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/course/create", data);
      console.log(res.data);
      set({ authUser: res.data });
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
