import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import type { ThemeCategory } from "../lib/themeStorage";

interface ThemeCategoryState {
  categories: ThemeCategory[];
  loading: boolean;
  fetchByCourse: (courseId: string) => Promise<void>;
  createCategory: (input: {
    courseId: string;
    name: string;
    indexLabel: string;
    position: { x: number; y: number };
  }) => Promise<ThemeCategory | null>;
  updateCategory: (
    id: number,
    patch: Partial<Pick<ThemeCategory, "name" | "indexLabel" | "position" | "tagIds">>
  ) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  /** Update local state only (used for live drag); backend updated on commit. */
  setLocal: (updater: (prev: ThemeCategory[]) => ThemeCategory[]) => void;
}

export const useThemeCategoryStore = create<ThemeCategoryState>((set, get) => ({
  categories: [],
  loading: false,

  fetchByCourse: async (courseId) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get(`/theme-category/by-course/${courseId}`);
      set({ categories: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch theme categories", err);
      set({ loading: false });
    }
  },

  createCategory: async (input) => {
    try {
      const res = await axiosInstance.post(`/theme-category/create`, input);
      const created: ThemeCategory = res.data;
      set((state) => ({ categories: [...state.categories, created] }));
      return created;
    } catch (err) {
      console.error("Failed to create theme category", err);
      return null;
    }
  },

  updateCategory: async (id, patch) => {
    // Optimistic local update
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    try {
      await axiosInstance.put(`/theme-category/${id}`, patch);
    } catch (err) {
      console.error("Failed to update theme category", err);
    }
  },

  deleteCategory: async (id) => {
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    try {
      await axiosInstance.delete(`/theme-category/${id}`);
    } catch (err) {
      console.error("Failed to delete theme category", err);
    }
  },

  setLocal: (updater) => set((state) => ({ categories: updater(state.categories) })),
}));
