import type { LibraryScanResult, MediaItem } from './types';
import { libraryScanner } from './scanner';
import { getConfig } from '../config/service';
import { logger } from '../utils/logger';

export type ProgressCallback = (progress: ServiceProgress) => void;

export interface ServiceProgress {
  phase: 'scanning' | 'parsing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

export class LibraryService {
  private scanner = libraryScanner;
  private progressCallback: ProgressCallback | null = null;

  setProgressCallback(callback: ProgressCallback | null): void {
    this.progressCallback = callback;
  }

  private reportProgress(progress: ServiceProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  async scanLibrary(): Promise<LibraryScanResult> {
    const config = getConfig();
    const scanPaths = [config.paths.movies, config.paths.tv].filter(Boolean);

    if (scanPaths.length === 0) {
      logger.warn('No library paths configured');
      return {
        movies: [],
        tvShows: [],
        totalFiles: 0,
        scannedAt: new Date(),
        errors: ['No library paths configured'],
      };
    }

    this.reportProgress({
      phase: 'scanning',
      current: 0,
      total: scanPaths.length,
      message: 'Starting library scan...',
    });

    const allMovies: LibraryScanResult['movies'] = [];
    const allTvShows: LibraryScanResult['tvShows'] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < scanPaths.length; i++) {
      const path = scanPaths[i];
      this.reportProgress({
        phase: 'scanning',
        current: i,
        total: scanPaths.length,
        message: `Scanning ${path}...`,
      });

      try {
        const result = await this.scanner.scan(path);
        allMovies.push(...result.movies);
        allTvShows.push(...result.tvShows);
        allErrors.push(...result.errors);
      } catch (error) {
        logger.error(`Error scanning ${path}: ${error}`);
        allErrors.push(`Failed to scan ${path}: ${error}`);
      }
    }

    this.reportProgress({
      phase: 'complete',
      current: scanPaths.length,
      total: scanPaths.length,
      message: `Found ${allMovies.length} movies, ${allTvShows.length} TV shows`,
    });

    return {
      movies: allMovies,
      tvShows: allTvShows,
      totalFiles: allMovies.length + allTvShows.length,
      scannedAt: new Date(),
      errors: allErrors,
    };
  }

  async findMediaItem(title: string): Promise<MediaItem | null> {
    const result = await this.scanLibrary();

    const movie = result.movies.find(m => m.metadata.title.toLowerCase() === title.toLowerCase());
    if (movie) return movie;

    const tvShow = result.tvShows.find(t => t.metadata.title.toLowerCase() === title.toLowerCase());
    if (tvShow) return tvShow;

    return null;
  }

  async getMediaStats(): Promise<{
    movieCount: number;
    tvShowCount: number;
    lastScan: Date | null;
  }> {
    const result = await this.scanLibrary();
    return {
      movieCount: result.movies.length,
      tvShowCount: result.tvShows.length,
      lastScan: result.scannedAt,
    };
  }
}

export const libraryService = new LibraryService();
