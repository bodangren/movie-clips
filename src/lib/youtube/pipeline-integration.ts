import type { YouTubeUploader, UploadVideoOptions } from './upload';
import type { PipelineRunResult, MediaItem, AnalysisResult } from '../pipeline/types';
import { isMovie, isTvShow } from '../pipeline/types';

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
      const options = generateUploadOptions(context.mediaItem, context.analysis);

      // Upload the video
      const videoId = await uploader.uploadVideo(options, onProgress);
      return videoId;
    },
  };
}

function generateUploadOptions(
  mediaItem: MediaItem,
  analysis: AnalysisResult | null
): UploadVideoOptions {
  const title = generateTitle(mediaItem);
  const description = generateDescription(mediaItem, analysis);
  const tags = generateTags(mediaItem);

  // TODO: In Phase 3, we'll read the actual file from disk
  // For now, create a placeholder File object for the interface
  // In Tauri, this would read the file from finalOutput path
  const videoFile = new File([], 'video.mp4', { type: 'video/mp4' });

  return {
    videoFile,
    title,
    description,
    tags,
    privacyStatus: 'public',
  };
}

function generateTitle(mediaItem: MediaItem): string {
  if (isMovie(mediaItem)) {
    return mediaItem.metadata.title || mediaItem.name;
  }

  if (isTvShow(mediaItem)) {
    return mediaItem.metadata.title || mediaItem.name;
  }

  // Episode
  const episode = mediaItem;
  const showTitle = episode.metadata?.title || episode.parentShow;
  return `${showTitle} - S${episode.season}E${episode.episodeNumber}`;
}

function generateDescription(mediaItem: MediaItem, analysis: AnalysisResult | null): string {
  const parts: string[] = [];

  // Add summary if available
  if (analysis?.summary) {
    parts.push(analysis.summary);
    parts.push('');
  }

  // Add facts
  if (analysis?.facts && analysis.facts.length > 0) {
    parts.push('Did you know?');
    analysis.facts.forEach((fact, index) => {
      parts.push(`${index + 1}. ${fact.text}`);
    });
    parts.push('');
  }

  // Add metadata info
  const metadata =
    isMovie(mediaItem) || isTvShow(mediaItem) ? mediaItem.metadata : mediaItem.metadata;

  if (metadata) {
    if (metadata.plot) {
      parts.push(metadata.plot);
      parts.push('');
    }

    if (metadata.cast?.length) {
      parts.push(`Starring: ${metadata.cast.join(', ')}`);
    }

    if (metadata.director) {
      parts.push(`Director: ${metadata.director}`);
    }

    if (metadata.year) {
      parts.push(`Year: ${metadata.year}`);
    }
  }

  // Add hashtags
  parts.push('');
  parts.push('#MovieClips #Shorts #MovieFacts');

  return parts.join('\n');
}

function generateTags(mediaItem: MediaItem): string[] {
  const tags: string[] = [];

  const metadata =
    isMovie(mediaItem) || isTvShow(mediaItem) ? mediaItem.metadata : mediaItem.metadata;

  if (metadata) {
    // Add title words
    if (metadata.title) {
      tags.push(...metadata.title.split(' ').filter(w => w.length > 2));
    }

    // Add genre
    if (metadata.genre) {
      tags.push(...metadata.genre);
    }

    // Add year
    if (metadata.year) {
      tags.push(String(metadata.year));
    }

    // Add cast
    if (metadata.cast) {
      tags.push(...metadata.cast.slice(0, 3));
    }

    // Add director
    if (metadata.director) {
      tags.push(metadata.director);
    }
  }

  // Add episode-specific tags
  if (!isMovie(mediaItem) && !isTvShow(mediaItem)) {
    tags.push('TV Series');
    tags.push(`Season ${mediaItem.season}`);
    tags.push(`Episode ${mediaItem.episodeNumber}`);
  }

  // Add default tags
  tags.push('movie clips', 'movie facts', 'shorts');

  // Remove duplicates and limit to 15 tags (YouTube limit is 500 chars total)
  const uniqueTags = [...new Set(tags.map(t => t.toLowerCase()))].slice(0, 15);

  return uniqueTags;
}
