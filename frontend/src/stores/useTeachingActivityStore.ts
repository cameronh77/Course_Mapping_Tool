import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useTeachingActivityStore = create((set) => ({
  currentActivities: [],

  createActivity: async (data) => {
    try {
      const res = await axiosInstance.post("/teaching-activity/create", data);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  viewActivitiesByUnit: async (unitId) => {
    try {
      const res = await axiosInstance.get(`/teaching-activity/viewAll/${unitId}`);
      set({ currentActivities: res.data });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  updateActivity: async (activityId, data) => {
    try {
      const res = await axiosInstance.put(`/teaching-activity/update/${activityId}`, data);
      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteActivity: async (activityId) => {
    try {
      await axiosInstance.delete("/teaching-activity/delete", { data: { activityId } });
      set((state: any) => ({
        currentActivities: state.currentActivities.filter(
          (a: any) => a.activityId !== activityId
        ),
      }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
