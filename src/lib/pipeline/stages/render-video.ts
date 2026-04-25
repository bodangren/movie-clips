import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
} from '../types';
import { renderVideoWithFallback, RenderVideoRequest } from '../../video/service';
import { getConfig } from '../../config/service';

export interface RenderVideoStageOptions {
  outputPath?: string;
  outputDir?: string;
}

export function createRenderVideoStage(options: RenderVideoStageOptions = {}): PipelineStage {
  return {
    name: 'render_video',
    async execute(ctx: PipelineContext, config: PipelineConfig): Promise<PipelineStageResult> {
      try {
        if (!ctx.analysis || !ctx.mediaItem || !ctx.assets || !ctx.mediaItem.metadata) {
          return {
            success: false,
            error: {
              stage: 'render_video',
              message: 'Missing context: need mediaItem, analysis, and assets',
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const appConfig = getConfig();
        const outputDir = options.outputDir ?? config.outputDir ?? appConfig.paths.output;
        const outputPath = options.outputPath ?? `${outputDir}/final_${Date.now()}.mp4`;

        // Construct Revideo metadata
        const metadata = {
          title: ctx.mediaItem.metadata.title,
          posterPath: ctx.mediaItem.type === 'movie' ? ctx.mediaItem.posterPath : undefined,
          sourceVideoPath: ctx.mediaItem.path,
          facts: ctx.analysis.facts.map(fact => {
            const clip = ctx.analysis?.suggestedClips?.find(c => c.factId === fact.id);
            return {
              text: fact.text,
              ttsAudioPath: ctx.assets?.audioFiles.get(fact.id) ?? '',
              startTime: clip?.startTime ?? 0,
              endTime: clip?.endTime ?? 0,
            };
          }),
          outroText: 'Subscribe for more!',
        };

        const request: RenderVideoRequest = {
          metadata_json: JSON.stringify(metadata),
          output: outputPath,
        };

        await renderVideoWithFallback(request);

        ctx.finalOutput = outputPath;
        return { success: true, data: outputPath };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: 'render_video',
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
