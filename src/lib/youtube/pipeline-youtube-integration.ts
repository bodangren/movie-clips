import type { PipelineRunResult } from '../pipeline/types';
import type { UploadScheduler } from './scheduler';
import { generateYouTubeTitle, generateYouTubeDescription, generateYouTubeTags } from './metadata';

export interface PipelineYouTubeIntegration {
  /**
   * Called when a pipeline run completes
   * Automatically queues the video for upload if enabled and successful
   */
  onPipelineComplete(result: PipelineRunResult): Promise<void>;

  /**
   * Check if auto-queue is enabled
   */
  isAutoQueueEnabled(): boolean;

  /**
   * Enable/disable auto-queue
   */
  setAutoQueueEnabled(enabled: boolean): void;
}

export function createPipelineYouTubeIntegration(
  scheduler: UploadScheduler
): PipelineYouTubeIntegration {
  let autoQueueEnabled = false;

  return {
    async onPipelineComplete(result: PipelineRunResult): Promise<void> {
      // Only auto-queue if enabled
      if (!autoQueueEnabled) {
        return;
      }

      // Skip failed pipelines
      if (!result.success) {
        return;
      }

      const { context } = result;

      // Skip if no final output
      if (!context.finalOutput) {
        return;
      }

      // Skip if no media item
      if (!context.mediaItem) {
        return;
      }

      // Generate metadata
      const metadataInput = {
        mediaItem: context.mediaItem,
        analysis: context.analysis,
      };

      const title = generateYouTubeTitle(metadataInput);
      const description = generateYouTubeDescription(metadataInput);
      const tags = generateYouTubeTags(metadataInput);

      // Add to upload queue
      await scheduler.addToQueue({
        videoPath: context.finalOutput,
        title,
        description,
        tags,
      });
    },

    isAutoQueueEnabled(): boolean {
      return autoQueueEnabled;
    },

    setAutoQueueEnabled(enabled: boolean): void {
      autoQueueEnabled = enabled;
    },
  };
}
