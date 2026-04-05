import { create } from "zustand";

export type PipelineStatus = "idle" | "running" | "completed" | "failed" | "paused";

interface PipelineState {
  status: PipelineStatus;
  progress: number;
  currentStep: string;
  errors: string[];

  start: () => void;
  updateProgress: (progress: number, step: string) => void;
  complete: () => void;
  fail: (error: string) => void;
  pause: () => void;
  reset: () => void;
  addError: (error: string) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  status: "idle",
  progress: 0,
  currentStep: "",
  errors: [],

  start: () => set({ status: "running", progress: 0, currentStep: "Starting...", errors: [] }),
  updateProgress: (progress, step) => set({ progress, currentStep: step }),
  complete: () => set({ status: "completed", progress: 100, currentStep: "Completed" }),
  fail: (error) => set((state) => ({ status: "failed", errors: [...state.errors, error] })),
  pause: () => set({ status: "paused" }),
  reset: () => set({ status: "idle", progress: 0, currentStep: "", errors: [] }),
  addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
}));
