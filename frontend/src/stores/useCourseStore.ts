import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

// Helper function to get persisted course from localStorage
const getPersistedCourse = () => {
  try {
    const stored = localStorage.getItem("currentCourse");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useCourseStore = create((set) => ({
  currentCourse: getPersistedCourse(),
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

  setCurrentCourse: async (data) => {
    try {
      console.log(data);
      // Persist to localStorage
      if (data) {
        localStorage.setItem("currentCourse", JSON.stringify(data));
      } else {
        localStorage.removeItem("currentCourse");
      }
      set({ currentCourse: data });
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  updateCourse: async (data) => {
    try {
      const input = {
        courseDesc: data.courseDesc,
        expectedDuration: data.expectedDuration,
        numberTeachingPeriods: data.numberTeachingPeriods,
      };
      const res = await axiosInstance.put(
        `/course/update/${data.courseId}`,
        input
      );
      set({ currentCourse: data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
