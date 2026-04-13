import { create } from "zustand";
import { MediaItem } from "@/lib/library/types";

interface LibraryState {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  lastScanned: string | null;

  setItems: (items: MediaItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  scan: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  items: [],
  loading: false,
  error: null,
  lastScanned: null,

  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  scan: async () => {
    set({ loading: true, error: null });
    // In a real implementation, this would call a Tauri command or service
    // For now, we'll just mock it or wait for actual integration
    setTimeout(() => {
      set({ loading: false, lastScanned: new Date().toISOString() });
    }, 1000);
  },
}));
