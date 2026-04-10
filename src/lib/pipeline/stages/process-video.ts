import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
  VideoSegment,
} from "../types";
import {
  extractClip,
  createTitleSegment,
  createImageSegment,
  ImageSegmentRequest,
  ExtractClipRequest,
  TitleSegmentRequest,
} from "../../video/service";
import { getConfig } from "../../config/service";
import { unlink } from "fs/promises";

export interface ProcessVideoStageOptions {
  outputDir?: string;
  dimensions?: { width: number; height: number };
}

export function createProcessVideoStage(
  options: ProcessVideoStageOptions = {},
): PipelineStage {
  return {
    name: "process_video",
    async execute(
      ctx: PipelineContext,
      config: PipelineConfig,
    ): Promise<PipelineStageResult> {
      try {
        if (!ctx.mediaItem || !ctx.analysis || !ctx.assets) {
          return {
            success: false,
            error: {
              stage: "process_video",
              message: "Missing context: need mediaItem, analysis, and assets",
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const appConfig = getConfig();
        const outputDir = options.outputDir ?? config.outputDir ?? appConfig.paths.output;
        const dimensions = options.dimensions ?? {
          width: appConfig.video.targetWidth,
          height: appConfig.video.targetHeight,
        };

        const segments: VideoSegment[] = [];
        const suggestions = ctx.analysis.suggestedClips ?? [];

        for (const suggestion of suggestions) {
          const clipRequest: ExtractClipRequest = {
            input: ctx.mediaItem.path,
            start: suggestion.startTime,
            end: suggestion.endTime,
            output: `${outputDir}/clip_${suggestion.factId}.mp4`,
            dimensions,
          };
          await extractClip(clipRequest);
          segments.push({
            id: suggestion.factId,
            type: "clip",
            source: ctx.mediaItem.path,
            startTime: suggestion.startTime,
            endTime: suggestion.endTime,
            outputPath: clipRequest.output,
          });
        }

        const titleCardPath = `${outputDir}/title_card.mp4`;
        if (ctx.assets.audioFiles.size > 0) {
          const firstFactId = ctx.analysis.facts[0]?.id;
          const firstAudio = firstFactId ? ctx.assets.audioFiles.get(firstFactId) : null;

          if (firstAudio) {
            const firstImage = ctx.assets.imageFiles.get(firstFactId ?? "") ?? "";

            if (firstImage) {
              const titleRequest: TitleSegmentRequest = {
                image: firstImage,
                audio: firstAudio,
                output: titleCardPath,
                dimensions,
              };
              await createTitleSegment(titleRequest);
              segments.unshift({
                id: "title",
                type: "title",
                source: firstImage,
                outputPath: titleCardPath,
              });
            }
          }
        }

        for (const [factId] of ctx.assets.audioFiles) {
          if (!segments.find((s) => s.id === factId)) {
            const imagePath = ctx.assets?.imageFiles.get(factId);
            if (imagePath) {
              const imageRequest: ImageSegmentRequest = {
                image: imagePath,
                duration: 5,
                output: `${outputDir}/image_${factId}.mp4`,
                dimensions,
              };
              await createImageSegment(imageRequest);
              segments.push({
                id: factId,
                type: "image",
                source: imagePath,
                duration: 5,
                outputPath: imageRequest.output,
              });
            }
          }
        }

        ctx.videoSegments = segments;
        return { success: true, data: segments };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: "process_video",
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          retryable: true,
          originalError: error,
        };
        return { success: false, error: pipelineError };
      }
    },

    async rollback(ctx: PipelineContext): Promise<void> {
      if (ctx.videoSegments) {
        for (const segment of ctx.videoSegments) {
          try {
            await unlink(segment.outputPath);
          } catch {}
        }
      }
    },
  };
}