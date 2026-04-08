import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractClip,
  createTitleSegment,
  assembleVideo,
  createImageSegment,
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

  describe("createTitleSegment", () => {
    it("calls create_title_segment command with request", async () => {
      const request = {
        image: "/path/to/image.png",
        audio: "/path/to/audio.mp3",
        output: "/path/to/output.mp4",
      };

      await createTitleSegment(request);

      expect(invoke).toHaveBeenCalledWith("create_title_segment", { request });
    });
  });

  describe("assembleVideo", () => {
    it("calls assemble_video command with segments", async () => {
      const request = {
        segments: ["/path/to/seg1.mp4", "/path/to/seg2.mp4"],
        output: "/path/to/final.mp4",
      };

      await assembleVideo(request);

      expect(invoke).toHaveBeenCalledWith("assemble_video", { request });
    });

    it("handles empty segments array", async () => {
      const request = {
        segments: [],
        output: "/path/to/final.mp4",
      };

      await assembleVideo(request);

      expect(invoke).toHaveBeenCalledWith("assemble_video", { request });
    });
  });

  describe("createImageSegment", () => {
    it("calls create_image_segment command with request", async () => {
      const request = {
        image: "/path/to/image.png",
        duration: 5.0,
        output: "/path/to/output.mp4",
      };

      await createImageSegment(request);

      expect(invoke).toHaveBeenCalledWith("create_image_segment", { request });
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

      vi.mocked(invoke).mockResolvedValue(mockStatus);

      const result = await getVideoStatus();

      expect(invoke).toHaveBeenCalledWith("get_video_status");
      expect(result).toEqual(mockStatus);
    });
  });
});
