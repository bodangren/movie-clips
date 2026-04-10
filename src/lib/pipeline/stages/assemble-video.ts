import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
} from "../types";
import { assembleVideo, AssembleVideoRequest } from "../../video/service";
import { getConfig } from "../../config/service";

export interface AssembleVideoStageOptions {
  outputPath?: string;
  outputDir?: string;
}

export function createAssembleVideoStage(
  options: AssembleVideoStageOptions = {},
): PipelineStage {
  return {
    name: "assemble_video",
    async execute(
      ctx: PipelineContext,
      config: PipelineConfig,
    ): Promise<PipelineStageResult> {
      try {
        if (!ctx.videoSegments || ctx.videoSegments.length === 0) {
          return {
            success: false,
            error: {
              stage: "assemble_video",
              message: "No video segments to assemble",
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const appConfig = getConfig();
        const outputDir = options.outputDir ?? config.outputDir ?? appConfig.paths.output;
        const outputPath =
          options.outputPath ?? `${outputDir}/final_${Date.now()}.mp4`;

        const sortedSegments = [...ctx.videoSegments].sort((a, b) => {
          if (a.type === "title" && b.type !== "title") return -1;
          if (a.type !== "title" && b.type === "title") return 1;
          return 0;
        });

        const request: AssembleVideoRequest = {
          segments: sortedSegments.map((s) => s.outputPath),
          output: outputPath,
        };

        await assembleVideo(request);

        ctx.finalOutput = outputPath;
        return { success: true, data: outputPath };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: "assemble_video",
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          retryable: true,
          originalError: error,
        };
        return { success: false, error: pipelineError };
      }
    },
  };
}