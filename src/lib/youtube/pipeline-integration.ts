import type { YouTubeUploader, UploadVideoOptions } from './upload';
import type { PipelineRunResult } from '../pipeline/types';
import { generateYouTubeTitle, generateYouTubeDescription, generateYouTubeTags } from './metadata';

export interface PipelineUploadIntegration {
  uploadFromPipeline(
    result: PipelineRunResult,
    onProgress?: (progress: { loaded: number; total: number }) => void
  ): Promise<string | null>;
}

export function createPipelineUploadIntegration(
  uploader: YouTubeUploader
): PipelineUploadIntegration {
  return {
    async uploadFromPipeline(result, onProgress) {
      // Skip if pipeline failed
      if (!result.success) {
        return null;
      }

      const { context } = result;

      // Skip if no final output
      if (!context.finalOutput) {
        return null;
      }

      // Skip if no media item
      if (!context.mediaItem) {
        return null;
      }

      // Generate upload options from pipeline context
      const metadataInput = {
        mediaItem: context.mediaItem,
        analysis: context.analysis,
      };

      const title = generateYouTubeTitle(metadataInput);
      const description = generateYouTubeDescription(metadataInput);
      const tags = generateYouTubeTags(metadataInput);

      // TODO: In Phase 3/4, read the actual file from disk via Tauri fs API
      // For now, create a placeholder File object for the interface
      const videoFile = new File([], 'video.mp4', { type: 'video/mp4' });

      const options: UploadVideoOptions = {
        videoFile,
        title,
        description,
        tags,
        privacyStatus: 'public',
      };

      // Upload the video
      const videoId = await uploader.uploadVideo(options, onProgress);
      return videoId;
    },
  };
}
