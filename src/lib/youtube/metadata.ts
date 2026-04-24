import type { MediaItem, AnalysisResult } from '../pipeline/types';
import { isMovie, isTvShow } from '../pipeline/types';

export interface MetadataInput {
  mediaItem: MediaItem;
  analysis: AnalysisResult | null;
}

const MAX_TITLE_LENGTH = 100;
const MAX_TAGS = 15;

export function generateYouTubeTitle(input: MetadataInput): string {
  const mediaTitle = getMediaTitle(input.mediaItem);
  const title = `5 Things You Didn't Know About ${mediaTitle}`;

  // Truncate if too long (YouTube limit is 100 chars)
  if (title.length > MAX_TITLE_LENGTH) {
    return title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }

  return title;
}

export function generateYouTubeDescription(input: MetadataInput): string {
  const parts: string[] = [];

  // Add summary if available
  if (input.analysis?.summary) {
    parts.push(input.analysis.summary);
    parts.push('');
  }

  // Add facts (top 5 by importance, sorted)
  const topFacts = getTopFacts(input.analysis, 5);
  if (topFacts.length > 0) {
    parts.push('Did you know?');
    topFacts.forEach((fact, index) => {
      parts.push(`${index + 1}. ${fact.text}`);
    });
    parts.push('');
  }

  // Add metadata info
  const metadata = getMetadata(input.mediaItem);
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
  const hashtags = generateHashtags(input.mediaItem);
  if (hashtags.length > 0) {
    parts.push(hashtags.join(' '));
  }

  return parts.join('\n');
}

export function generateYouTubeTags(input: MetadataInput): string[] {
  const tags: string[] = [];

  const metadata = getMetadata(input.mediaItem);

  if (metadata) {
    // Add title words (filter out short words)
    if (metadata.title) {
      const titleWords = metadata.title
        .split(/[\s\-:]+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 2);
      tags.push(...titleWords);
    }

    // Add genres
    if (metadata.genres) {
      tags.push(...metadata.genres.map(g => g.toLowerCase()));
    }

    // Add year
    if (metadata.year) {
      tags.push(String(metadata.year));
    }

    // Add cast (top 3)
    if (metadata.cast) {
      tags.push(...metadata.cast.slice(0, 3).map(c => c.toLowerCase()));
    }

    // Add director
    if (metadata.director) {
      tags.push(metadata.director.toLowerCase());
    }
  }

  // Add default tags
  tags.push('movie clips', 'movie facts', 'shorts');

  // Remove duplicates and limit
  const uniqueTags = [...new Set(tags)];
  return uniqueTags.slice(0, MAX_TAGS);
}

// Helper functions

function getMediaTitle(mediaItem: MediaItem): string {
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

function getMetadata(mediaItem: MediaItem) {
  if (isMovie(mediaItem) || isTvShow(mediaItem)) {
    return mediaItem.metadata;
  }

  return mediaItem.metadata || null;
}

function getTopFacts(analysis: AnalysisResult | null, count: number) {
  if (!analysis?.facts || analysis.facts.length === 0) {
    return [];
  }

  return [...analysis.facts].sort((a, b) => b.importance - a.importance).slice(0, count);
}

function generateHashtags(mediaItem: MediaItem): string[] {
  const hashtags: string[] = ['#MovieFacts', '#Shorts'];

  const metadata = getMetadata(mediaItem);
  if (metadata?.title) {
    // Create hashtag from title (remove spaces, keep alphanumeric)
    const titleTag = metadata.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');
    if (titleTag) {
      hashtags.unshift(`#${titleTag}`);
    }
  }

  // Add genre hashtags
  if (metadata?.genres) {
    metadata.genres.forEach(g => {
      const genreTag = g.replace(/[^a-zA-Z0-9]/g, '');
      if (genreTag) {
        hashtags.push(`#${genreTag}`);
      }
    });
  }

  return hashtags;
}
