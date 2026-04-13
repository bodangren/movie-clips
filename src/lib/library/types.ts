export interface SubtitleEntry {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
  startTimeMS: number;
  endTimeMS: number;
}

export interface MovieMetadata {
  title: string;
  year?: number;
  runtime?: number;
  genres?: string[];
  director?: string;
  plot?: string;
  tmdbId?: string;
  imdbId?: string;
}

export interface TvShowMetadata {
  title: string;
  season?: number;
  episode?: number;
  year?: number;
  plot?: string;
}

export interface NfoMetadata {
  title: string;
  year: number;
  plot: string;
  tmdbId?: string;
  imdbId?: string;
}

export interface MediaFile {
  path: string;
  type: 'movie' | 'tvshow' | 'episode';
  name: string;
  extension: string;
  size: number;
  modifiedAt: Date;
}

export interface Movie extends MediaFile {
  type: 'movie';
  metadata: MovieMetadata;
  nfoPath?: string;
  subtitlePaths: string[];
  posterPath?: string;
}

export interface TvShow extends MediaFile {
  type: 'tvshow';
  metadata: TvShowMetadata;
  nfoPath?: string;
}

export interface Episode extends MediaFile {
  type: 'episode';
  parentShow: string;
  season: number;
  episodeNumber: number;
  metadata?: TvShowMetadata;
  nfoPath?: string;
  subtitlePaths: string[];
}

export type MediaItem = Movie | TvShow | Episode;

export interface LibraryScanResult {
  movies: Movie[];
  tvShows: TvShow[];
  totalFiles: number;
  scannedAt: Date;
  errors: string[];
}

export function isMovie(item: MediaItem): item is Movie {
  return item.type === 'movie';
}

export function isTvShow(item: MediaItem): item is TvShow {
  return item.type === 'tvshow';
}

export function isEpisode(item: MediaItem): item is Episode {
  return item.type === 'episode';
}
