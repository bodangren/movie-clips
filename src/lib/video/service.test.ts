import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractClip,
  renderVideo,
  getVideoStatus,
} from "./service";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const { invoke } = await import("@tauri-apps/api/core");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("video service", () => {
  describe("extractClip", () => {
    it("calls extract_clip command with request", async () => {
      const request = {
        input: "/path/to/input.mp4",
        start: "00:00:10",
        end: "00:01:00",
        output: "/path/to/output.mp4",
        dimensions: { width: 1080, height: 1920 },
      };

      await extractClip(request);

      expect(invoke).toHaveBeenCalledWith("extract_clip", { request });
    });

    it("calls extract_clip without dimensions", async () => {
      const request = {
        input: "/path/to/input.mp4",
        start: "00:00:00",
        end: "00:00:30",
        output: "/path/to/output.mp4",
      };

      await extractClip(request);

      expect(invoke).toHaveBeenCalledWith("extract_clip", { request });
    });
  });

  describe("renderVideo", () => {
    it("calls render_video command with request", async () => {
      const request = {
        metadata_json: JSON.stringify({ title: "Test Movie" }),
        output: "/path/to/output.mp4",
      };

      await renderVideo(request);

      expect(invoke).toHaveBeenCalledWith("render_video", { request });
    });
  });

  describe("getVideoStatus", () => {
    it("calls get_video_status command", async () => {
      const mockStatus = {
        service_type: "Command",
        ffmpeg_health: {
          available: true,
          version: "ffmpeg version 6.1.1",
          path: "ffmpeg",
          error: null,
        },
        metrics: {
          total_operations: 0,
          successful_operations: 0,
          failed_operations: 0,
          last_operations: [],
          total_duration_ms: 0,
        },
        config: {
          ffmpeg_path: "ffmpeg",
          temp_dir: null,
          dimensions: { width: 1080, height: 1920 },
        },
      };

      (invoke as any).mockResolvedValue(mockStatus);

      const result = await getVideoStatus();

      expect(invoke).toHaveBeenCalledWith("get_video_status");
      expect(result).toEqual(mockStatus);
    });
  });
});
