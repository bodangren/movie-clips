import { describe, it, expect, vi, beforeEach } from "vitest";
import * as configService from "@/lib/config/service";
import * as configDefaults from "@/lib/config/defaults";
import { useConfigStore } from "@/stores/config.store";
import type { AppConfig } from "@/lib/config/schema";

vi.mock("@/lib/config/service");
vi.mock("@/lib/config/defaults");

describe("useConfigStore", () => {
  const mockConfig: AppConfig = {
    version: 1,
    paths: { movies: "/movies", tv: "/tv", output: "/out", temp: "/tmp" },
    google: { location: "global", ttsVoices: [] },
    video: { targetWidth: 720, targetHeight: 1280, fps: 30 },
    pipeline: { maxRetries: 3, timeoutMs: 300000 },
    ui: { theme: "system", language: "en" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configDefaults.getDefaultConfig).mockReturnValue(mockConfig);
    useConfigStore.setState({
      config: mockConfig,
      loading: false,
      error: null,
      unsavedChanges: false,
    });
  });

  describe("initial state", () => {
    it("should have default config", () => {
      const state = useConfigStore.getState();
      expect(state.config).toEqual(mockConfig);
    });

    it("should not be loading initially", () => {
      expect(useConfigStore.getState().loading).toBe(false);
    });

    it("should have no error initially", () => {
      expect(useConfigStore.getState().error).toBeNull();
    });

    it("should have no unsaved changes initially", () => {
      expect(useConfigStore.getState().unsavedChanges).toBe(false);
    });
  });

  describe("load", () => {
    it("should load config from service", async () => {
      const loadedConfig: AppConfig = { ...mockConfig, ui: { theme: "dark", language: "es" } };
      vi.mocked(configService.loadConfig).mockResolvedValue(loadedConfig);

      await useConfigStore.getState().load();

      expect(configService.loadConfig).toHaveBeenCalled();
      expect(useConfigStore.getState().config).toEqual(loadedConfig);
      expect(useConfigStore.getState().loading).toBe(false);
    });

    it("should set error on load failure", async () => {
      vi.mocked(configService.loadConfig).mockRejectedValue(new Error("Network error"));

      await useConfigStore.getState().load();

      expect(useConfigStore.getState().error).toBe("Network error");
      expect(useConfigStore.getState().loading).toBe(false);
    });
  });

  describe("save", () => {
    it("should save current config", async () => {
      vi.mocked(configService.saveConfig).mockResolvedValue(undefined);

      await useConfigStore.getState().save();

      expect(configService.saveConfig).toHaveBeenCalledWith(mockConfig);
      expect(useConfigStore.getState().unsavedChanges).toBe(false);
    });

    it("should set error on save failure", async () => {
      vi.mocked(configService.saveConfig).mockRejectedValue(new Error("Save failed"));

      await useConfigStore.getState().save();

      expect(useConfigStore.getState().error).toBe("Save failed");
    });
  });

  describe("reset", () => {
    it("should reset to defaults", async () => {
      vi.mocked(configService.resetConfig).mockResolvedValue(mockConfig);

      await useConfigStore.getState().reset();

      expect(configService.resetConfig).toHaveBeenCalled();
      expect(useConfigStore.getState().config).toEqual(mockConfig);
      expect(useConfigStore.getState().unsavedChanges).toBe(false);
    });
  });

  describe("update", () => {
    it("should update config and mark unsaved", () => {
      useConfigStore.getState().update({ ui: { theme: "dark", language: "fr" } });

      const state = useConfigStore.getState();
      expect(state.config.ui.theme).toBe("dark");
      expect(state.config.ui.language).toBe("fr");
      expect(state.unsavedChanges).toBe(true);
    });

    it("should merge partial updates", () => {
      useConfigStore.getState().update({ video: { ...mockConfig.video, fps: 60 } });

      const state = useConfigStore.getState();
      expect(state.config.video.fps).toBe(60);
      expect(state.config.video.targetWidth).toBe(720);
    });
  });
});
