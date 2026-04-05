import { describe, it, expect, beforeEach } from "vitest";
import { usePipelineStore } from "@/stores/pipeline.store";

describe("usePipelineStore", () => {
  beforeEach(() => {
    usePipelineStore.setState({
      status: "idle",
      progress: 0,
      currentStep: "",
      errors: [],
    });
  });

  it("should have correct initial state", () => {
    const state = usePipelineStore.getState();
    expect(state.status).toBe("idle");
    expect(state.progress).toBe(0);
    expect(state.currentStep).toBe("");
    expect(state.errors).toEqual([]);
  });

  describe("start", () => {
    it("should set status to running and reset progress", () => {
      usePipelineStore.getState().start();
      const state = usePipelineStore.getState();
      expect(state.status).toBe("running");
      expect(state.progress).toBe(0);
      expect(state.errors).toEqual([]);
    });
  });

  describe("updateProgress", () => {
    it("should update progress and current step", () => {
      usePipelineStore.getState().updateProgress(50, "Processing video");
      const state = usePipelineStore.getState();
      expect(state.progress).toBe(50);
      expect(state.currentStep).toBe("Processing video");
    });
  });

  describe("complete", () => {
    it("should set status to completed with 100% progress", () => {
      usePipelineStore.getState().complete();
      const state = usePipelineStore.getState();
      expect(state.status).toBe("completed");
      expect(state.progress).toBe(100);
    });
  });

  describe("fail", () => {
    it("should set status to failed and add error", () => {
      usePipelineStore.getState().fail("Processing error");
      const state = usePipelineStore.getState();
      expect(state.status).toBe("failed");
      expect(state.errors).toContain("Processing error");
    });
  });

  describe("pause", () => {
    it("should set status to paused", () => {
      usePipelineStore.getState().start();
      usePipelineStore.getState().pause();
      expect(usePipelineStore.getState().status).toBe("paused");
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      usePipelineStore.getState().start();
      usePipelineStore.getState().fail("error");
      usePipelineStore.getState().reset();
      const state = usePipelineStore.getState();
      expect(state.status).toBe("idle");
      expect(state.progress).toBe(0);
      expect(state.currentStep).toBe("");
      expect(state.errors).toEqual([]);
    });
  });

  describe("addError", () => {
    it("should append error to errors array", () => {
      usePipelineStore.getState().addError("Warning 1");
      usePipelineStore.getState().addError("Warning 2");
      expect(usePipelineStore.getState().errors).toEqual(["Warning 1", "Warning 2"]);
    });
  });
});
