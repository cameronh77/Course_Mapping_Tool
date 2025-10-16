import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useUnitStore = create((set) => ({
  existingUnits: [],

  checkUnitExists: async (unitId) => {
    try {
      const res = await axiosInstance.get(`/unit/view?search=${unitId}`);

      const units = res.data;

      const foundById = units.find(
        (unit) => unit.unitId === unitId
      )

      if (foundById) {
        return { isDuplicate: true, field: "unitId" };
      }

      return { isDuplicate: false };
    } catch(error) {
      console.error("Error checking unit existence:", error);
      throw new Error("Failed to perform duplicate check.");
    }
  },

  createUnit: async (data) => {
    try {
      console.log(data);
      const res = await axiosInstance.post("/unit/create", data);
      return res.data;
    } catch (error) {
      console.log(error.response.data.message);
      throw error;
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