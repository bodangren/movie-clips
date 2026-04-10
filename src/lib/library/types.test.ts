import { describe, it, expect } from 'vitest';
import type {
  MediaItem,
  Movie,
  TvShow,
  Episode,
  SubtitleEntry,
  MovieMetadata,
  NfoMetadata,
  LibraryScanResult,
} from './types';
import { isMovie, isTvShow, isEpisode } from './types';

describe('library/types', () => {
  describe('type guards', () => {
    it('should identify Movie type correctly', () => {
      const movie: MediaItem = {
        type: 'movie',
        path: '/movies/test.avi',
        name: 'test.avi',
        extension: '.avi',
        size: 1000,
        modifiedAt: new Date(),
        metadata: { title: 'Test Movie', year: 2020 },
        subtitlePaths: [],
      };
      expect(isMovie(movie)).toBe(true);
      expect(isTvShow(movie)).toBe(false);
      expect(isEpisode(movie)).toBe(false);
    });

    it('should identify TvShow type correctly', () => {
      const tvShow: MediaItem = {
        type: 'tvshow',
        path: '/tv/test',
        name: 'test',
        extension: '',
        size: 0,
        modifiedAt: new Date(),
        metadata: { title: 'Test Show' },
      };
      expect(isMovie(tvShow)).toBe(false);
      expect(isTvShow(tvShow)).toBe(true);
      expect(isEpisode(tvShow)).toBe(false);
    });

    it('should identify Episode type correctly', () => {
      const episode: MediaItem = {
        type: 'episode',
        path: '/tv/test/s01e01.avi',
        name: 's01e01.avi',
        extension: '.avi',
        size: 500,
        modifiedAt: new Date(),
        parentShow: 'Test Show',
        season: 1,
        episodeNumber: 1,
        subtitlePaths: [],
      };
      expect(isMovie(episode)).toBe(false);
      expect(isTvShow(episode)).toBe(false);
      expect(isEpisode(episode)).toBe(true);
    });
  });

  describe('SubtitleEntry', () => {
    it('should accept valid subtitle entry', () => {
      const entry: SubtitleEntry = {
        startTime: '00:01:30,500',
        endTime: '00:01:35,000',
        text: 'Hello, world!',
        startTimeMS: 90500,
        endTimeMS: 95000,
      };
      expect(entry.text).toBe('Hello, world!');
      expect(entry.startTimeMS).toBe(90500);
      expect(entry.endTimeMS).toBe(95000);
    });
  });

  describe('MovieMetadata', () => {
    it('should accept movie metadata with all fields', () => {
      const metadata: MovieMetadata = {
        title: 'Inception',
        year: 2010,
        runtime: 148,
        genres: ['Action', 'Sci-Fi'],
        director: 'Christopher Nolan',
        plot: 'A thief who steals corporate secrets...',
        tmdbId: 'tt1375666',
        imdbId: 'tt1375666',
      };
      expect(metadata.title).toBe('Inception');
      expect(metadata.year).toBe(2010);
      expect(metadata.genres).toHaveLength(2);
    });

    it('should accept movie metadata with only required fields', () => {
      const metadata: MovieMetadata = { title: 'Minimal Movie' };
      expect(metadata.title).toBe('Minimal Movie');
      expect(metadata.year).toBeUndefined();
    });
  });

  describe('NfoMetadata', () => {
    it('should accept NFO metadata', () => {
      const nfo: NfoMetadata = {
        title: 'Test Movie',
        year: 2021,
        plot: 'A test plot',
        tmdbId: 'tt123',
        imdbId: 'tt123',
      };
      expect(nfo.title).toBe('Test Movie');
      expect(nfo.year).toBe(2021);
    });
  });

  describe('LibraryScanResult', () => {
    it('should accept valid scan result', () => {
      const result: LibraryScanResult = {
        movies: [],
        tvShows: [],
        totalFiles: 0,
        scannedAt: new Date(),
        errors: [],
      };
      expect(result.movies).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should track errors during scan', () => {
      const result: LibraryScanResult = {
        movies: [],
        tvShows: [],
        totalFiles: 10,
        scannedAt: new Date(),
        errors: ['Failed to parse movie.nfo: invalid XML', 'Missing subtitle file'],
      };
      expect(result.errors).toHaveLength(2);
    });
  });
});