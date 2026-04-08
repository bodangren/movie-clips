export interface SubtitleEntry {
  startTime: string;
  endTime: string;
  text: string;
}

export interface MovieMetadata {
  title: string;
  year?: number;
  runtime?: number;
  genres?: string[];
  director?: string;
  plot?: string;
}

export interface TvShowMetadata {
  title: string;
  season?: number;
  episode?: number;
  year?: number;
}