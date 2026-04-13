import type { MediaItem, Movie, TvShow, Episode } from '../library/types';

export type PipelineStageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface PipelineContext {
  mediaItem: MediaItem | null;
  analysis: AnalysisResult | null;
  assets: GeneratedAssets | null;
  videoSegments: VideoSegment[] | null;
  finalOutput: string | null;
  errors: PipelineError[];
  startTime: number | null;
  endTime: number | null;
}

export interface AnalysisResult {
  facts: Fact[];
  summary: string;
  suggestedClips: ClipSuggestion[];
}

export interface Fact {
  id: string;
  text: string;
  importance: number;
  timestamp?: string;
}

export interface ClipSuggestion {
  startTime: string;
  endTime: string;
  reason: string;
  factId: string;
}

export interface GeneratedAssets {
  audioFiles: Map<string, string>;
  imageFiles: Map<string, string>;
}

export interface VideoSegment {
  id: string;
  type: 'clip' | 'render';
  source: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  outputPath: string;
}

export interface PipelineError {
  stage: string;
  message: string;
  timestamp: number;
  retryable: boolean;
  originalError?: unknown;
}

export interface PipelineStageResult {
  success: boolean;
  data?: unknown;
  error?: PipelineError;
}

export interface PipelineConfig {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  parallelProcessing: boolean;
  checkpointEnabled: boolean;
  outputDir: string;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 300000,
  parallelProcessing: true,
  checkpointEnabled: true,
  outputDir: '',
};

export interface PipelineStage {
  name: string;
  execute(ctx: PipelineContext, config: PipelineConfig): Promise<PipelineStageResult>;
  rollback?(ctx: PipelineContext): Promise<void>;
}

export interface PipelineRunResult {
  success: boolean;
  context: PipelineContext;
  completedStages: string[];
  failedStage: string | null;
  totalDurationMs: number;
}

export type { MediaItem, Movie, TvShow, Episode };
export { isMovie, isTvShow, isEpisode } from '../library/types';
