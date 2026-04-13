import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
  AnalysisResult,
} from '../types';
import { subtitleParser } from '../../library/subtitle-parser';
import type { MovieMetadata, SubtitleEntry } from '../../library/types';
import { LlmAnalyzer } from '../../ai/analyzer';

export interface AnalyzeStageOptions {
  customPrompt?: string;
}

export function createAnalyzeStage(_options: AnalyzeStageOptions = {}): PipelineStage {
  return {
    name: 'analyze',
    async execute(ctx: PipelineContext, _config: PipelineConfig): Promise<PipelineStageResult> {
      try {
        if (!ctx.mediaItem) {
          return {
            success: false,
            error: {
              stage: 'analyze',
              message: 'No media item selected',
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const analyzer = new LlmAnalyzer();

        let metadata: MovieMetadata;
        let subtitles: SubtitleEntry[] = [];

        if (ctx.mediaItem.type === 'movie') {
          metadata = {
            title: ctx.mediaItem.metadata.title,
            year: ctx.mediaItem.metadata.year,
            runtime: (ctx.mediaItem.metadata as { runtime?: number }).runtime,
            genres: (ctx.mediaItem.metadata as { genres?: string[] }).genres,
            director: (ctx.mediaItem.metadata as { director?: string }).director,
            plot: (ctx.mediaItem.metadata as { plot?: string }).plot,
          };

          if (ctx.mediaItem.subtitlePaths && ctx.mediaItem.subtitlePaths.length > 0) {
            subtitles = await subtitleParser.parse(ctx.mediaItem.subtitlePaths[0]);
          }
        } else {
          return {
            success: false,
            error: {
              stage: 'analyze',
              message: 'TV shows not yet supported',
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        const analysis = await analyzer.analyze(metadata, subtitles);

        if (!analysis) {
          return {
            success: false,
            error: {
              stage: 'analyze',
              message: 'Analysis failed',
              timestamp: Date.now(),
              retryable: true,
            },
          };
        }

        const result: AnalysisResult = {
          facts: analysis.facts.map(
            (f: { number: number; trivia_text: string; clip_start: string; clip_end: string }) => ({
              id: `fact_${f.number}`,
              text: f.trivia_text,
              importance: 1,
              timestamp: f.clip_start,
            })
          ),
          summary: analysis.video_description,
          suggestedClips: analysis.facts.map(
            (f: {
              number: number;
              clip_start: string;
              clip_end: string;
              scene_context: string;
            }) => ({
              startTime: f.clip_start,
              endTime: f.clip_end,
              reason: f.scene_context,
              factId: `fact_${f.number}`,
            })
          ),
        };

        ctx.analysis = result;
        return { success: true, data: result };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: 'analyze',
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
