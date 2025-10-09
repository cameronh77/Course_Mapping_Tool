import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useUnitStore = create((set) => ({
  existingUnits: [],

  createUnit: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/unit/create", data);
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  viewUnits: async () => {
    try {
      const res = await axiosInstance.get("/unit/view");
      set({ existingUnits: res.data });
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },

  updateUnit: async (unitId, data) => {
    try {
      const res = await axiosInstance.put(`/unit/update/${unitId}`, data);
      set((state) => ({
        existingUnits: state.existingUnits.map((unit) =>
          unit.unitId === unitId ? { ...unit, ...data } : unit
        ),
      }));
      console.log(res.data);
    } catch (error) {
      console.log(error.response.data.message);
    }
  },
}));