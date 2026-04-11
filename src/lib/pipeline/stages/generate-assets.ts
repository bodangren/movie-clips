import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
  GeneratedAssets,
  Fact,
} from "../types";
import { TtsGenerator } from "../../ai/tts";
import { getConfig } from "../../config/service";
import { unlink } from "fs/promises";
import { join } from "path";

export interface GenerateAssetsStageOptions {
  outputDir?: string;
}

export function createGenerateAssetsStage(
  options: GenerateAssetsStageOptions = {},
): PipelineStage {
  return {
    name: "generate_assets",
    async execute(
      ctx: PipelineContext,
      config: PipelineConfig,
    ): Promise<PipelineStageResult> {
      try {
        if (!ctx.analysis || !ctx.analysis.facts.length) {
          return {
            success: false,
            error: {
              stage: "generate_assets",
              message: "No analysis results available",
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const appConfig = getConfig();
        const outputDir = options.outputDir ?? config.outputDir ?? appConfig.paths.output;

        const tts = new TtsGenerator();
        const audioFiles = new Map<string, string>();
        const imageFiles = new Map<string, string>();

        if (config.parallelProcessing) {
          const audioPromises = ctx.analysis.facts.map(async (fact: Fact) => {
            const audioPath = join(outputDir, `audio_${fact.id}.wav`);
            const result = await tts.generate(fact.text, audioPath);
            if (result) {
              audioFiles.set(fact.id, result);
            }
          });
          await Promise.all(audioPromises);
        } else {
          for (const fact of ctx.analysis.facts) {
            const audioPath = join(outputDir, `audio_${fact.id}.wav`);
            const result = await tts.generate(fact.text, audioPath);
            if (result) {
              audioFiles.set(fact.id, result);
            }
          }
        }

        const assets: GeneratedAssets = {
          audioFiles,
          imageFiles,
          titleCard: null,
        };

        ctx.assets = assets;
        return { success: true, data: assets };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: "generate_assets",
          message: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          retryable: true,
          originalError: error,
        };
        return { success: false, error: pipelineError };
      }
    },

    async rollback(ctx: PipelineContext): Promise<void> {
      if (ctx.assets) {
        for (const audioPath of ctx.assets.audioFiles.values()) {
          try {
            await unlink(audioPath);
            // eslint-disable-next-line no-empty
          } catch {}
        }
        for (const imagePath of ctx.assets.imageFiles.values()) {
          try {
            await unlink(imagePath);
            // eslint-disable-next-line no-empty
          } catch {}
        }
      }
    },
  };
}