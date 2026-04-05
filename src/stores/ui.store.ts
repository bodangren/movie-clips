import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  theme: Theme;
  settingsTab: string;

  toggleSidebar: () => void;
  navigate: (page: string) => void;
  setTheme: (theme: Theme) => void;
  setSettingsTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentPage: "dashboard",
  theme: "system",
  settingsTab: "paths",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  navigate: (page) => set({ currentPage: page }),
  setTheme: (theme) => set({ theme }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
}));
