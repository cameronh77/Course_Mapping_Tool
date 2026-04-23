import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAssessmentStore = create((set) => ({
  currentAssessments: [],

  createAssessment: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/assessment/create", data);
      return res.data;
    } catch (error) {
      console.log(error.response.data.message);
      throw error;
    }
  },

  viewAssessments: async (unitId) => {
    try {
      const res = await axiosInstance.get("/assessment/view", {
        params: unitId ? { search: unitId } : undefined,
      });
      console.log(res.data);
      set({ currentAssessments: res.data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  updateAssessment: async (assessmentId, data) => {
    try {
      const res = await axiosInstance.put(
        `/assessment/update/${assessmentId}`,
        data
      );
      set((state) => ({
        currentAssessments: state.currentAssessments.map((assessment) =>
          assessment.assessmentId === assessmentId
            ? { ...assessment, ...data }
            : assessment
        ),
      }));
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));
