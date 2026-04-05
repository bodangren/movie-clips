import { create } from "zustand";
import type { AppConfig } from "@/lib/config/schema";
import { getDefaultConfig } from "@/lib/config/defaults";
import { loadConfig, saveConfig, resetConfig } from "@/lib/config/service";

interface ConfigState {
  config: AppConfig;
  loading: boolean;
  error: string | null;
  unsavedChanges: boolean;

  load: () => Promise<void>;
  save: () => Promise<void>;
  reset: () => Promise<void>;
  update: (updates: Partial<AppConfig>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: getDefaultConfig(),
  loading: false,
  error: null,
  unsavedChanges: false,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const config = await loadConfig();
      set({ config, loading: false, unsavedChanges: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  save: async () => {
    set({ loading: true, error: null });
    try {
      const { config } = useConfigStore.getState();
      await saveConfig(config);
      set({ loading: false, unsavedChanges: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  reset: async () => {
    set({ loading: true, error: null });
    try {
      const defaults = await resetConfig();
      set({ config: defaults, loading: false, unsavedChanges: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  update: (updates) => {
    set((state) => ({
      config: { ...state.config, ...updates },
      unsavedChanges: true,
    }));
  },
}));
