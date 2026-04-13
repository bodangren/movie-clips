import type {
  PipelineContext,
  PipelineConfig,
  PipelineStage,
  PipelineStageResult,
  PipelineError,
  MediaItem,
} from '../types';
import { libraryScanner } from '../../library/scanner';
import { getConfig } from '../../config/service';

export interface SelectContentStageOptions {
  mediaPath?: string;
  mediaId?: string;
}

export function createSelectContentStage(options: SelectContentStageOptions = {}): PipelineStage {
  return {
    name: 'select_content',
    async execute(ctx: PipelineContext, _config: PipelineConfig): Promise<PipelineStageResult> {
      try {
        const config = getConfig();

        let mediaItem: MediaItem | null = null;

        if (options.mediaId) {
          const library = await libraryScanner.scan(config.paths.movies);
          mediaItem =
            library.movies.find((item: { path: string }) => item.path === options.mediaId) ?? null;
          if (!mediaItem) {
            mediaItem =
              library.tvShows.find((item: { path: string }) => item.path === options.mediaId) ??
              null;
          }
        } else if (options.mediaPath) {
          const mediaType = await libraryScanner.detectMediaType(options.mediaPath);
          if (mediaType === 'movie') {
            const parentDir = options.mediaPath.substring(0, options.mediaPath.lastIndexOf('/'));
            const movies = await libraryScanner.scan(parentDir);
            mediaItem =
              movies.movies.find((m: { path: string }) => m.path === options.mediaPath) ?? null;
          }
        }

        if (!mediaItem) {
          return {
            success: false,
            error: {
              stage: 'select_content',
              message: 'Media item not found',
              timestamp: Date.now(),
              retryable: false,
            },
          };
        }

        ctx.mediaItem = mediaItem;
        return { success: true, data: mediaItem };
      } catch (error) {
        const pipelineError: PipelineError = {
          stage: 'select_content',
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
