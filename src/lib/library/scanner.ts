import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import type { MediaItem, Movie, TvShow, Episode, LibraryScanResult, MediaFile } from './types';
import { nfoParser } from './nfo-parser';
import { subtitleParser } from './subtitle-parser';
import { logger } from '../utils/logger';

export class LibraryScanner {
  async scan(directoryPath: string): Promise<LibraryScanResult> {
    const result: LibraryScanResult = {
      movies: [],
      tvShows: [],
      totalFiles: 0,
      scannedAt: new Date(),
      errors: [],
    };

    try {
      const entries = await readdir(directoryPath, { withFileTypes: true });
      result.totalFiles = entries.length;

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const tvShowResult = await this.processTvShowDirectory(
            join(directoryPath, entry.name),
            entry.name
          );
          if (tvShowResult) {
            result.tvShows.push(tvShowResult);
          }
        } else if (entry.isFile()) {
          const movieResult = await this.processMovieFile(
            join(directoryPath, entry.name),
            directoryPath
          );
          if (movieResult) {
            result.movies.push(movieResult);
          }
        }
      }
    } catch (error) {
      logger.error(`Error scanning library ${directoryPath}: ${error}`);
      result.errors.push(`Failed to scan directory: ${error}`);
    }

    return result;
  }

  private async processMovieFile(
    filePath: string,
    parentDir: string
  ): Promise<Movie | null> {
    const ext = extname(filePath).toLowerCase();
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'];
    
    if (!videoExtensions.includes(ext)) {
      return null;
    }

    const baseName = basename(filePath, ext);
    const nfoPath = join(parentDir, `${baseName}.nfo`);
    const srtPath = join(parentDir, `${baseName}.srt`);

    const mediaFile: MediaFile = {
      path: filePath,
      type: 'movie',
      name: basename(filePath),
      extension: ext,
      size: (await stat(filePath)).size,
      modifiedAt: (await stat(filePath)).mtime,
    };

    const nfoMetadata = await nfoParser.parse(nfoPath);
    const subtitles = await subtitleParser.parse(srtPath);

    return {
      ...mediaFile,
      type: 'movie',
      metadata: {
        title: nfoMetadata?.title || baseName,
        year: nfoMetadata?.year,
        plot: nfoMetadata?.plot,
        tmdbId: nfoMetadata?.tmdbId,
        imdbId: nfoMetadata?.imdbId,
      },
      nfoPath: nfoPath,
      subtitlePaths: subtitles.length > 0 ? [srtPath] : [],
    };
  }

  private async processTvShowDirectory(
    dirPath: string,
    showName: string
  ): Promise<TvShow | null> {
    const nfoPath = join(dirPath, 'tvshow.nfo');
    
    try {
      const nfoMetadata = await nfoParser.parse(nfoPath);
      
      const mediaFile: MediaFile = {
        path: dirPath,
        type: 'tvshow',
        name: showName,
        extension: '',
        size: 0,
        modifiedAt: new Date(),
      };

      return {
        ...mediaFile,
        type: 'tvshow',
        metadata: {
          title: nfoMetadata?.title || showName,
          year: nfoMetadata?.year,
          plot: nfoMetadata?.plot,
        },
        nfoPath: nfoPath,
      };
    } catch {
      return null;
    }
  }

  async detectMediaType(filePath: string): Promise<'movie' | 'tvshow' | 'episode' | null> {
    const ext = extname(filePath).toLowerCase();
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'];
    
    if (!videoExtensions.includes(ext)) {
      return null;
    }

    const baseName = basename(filePath, ext);
    
    if (baseName.match(/^s\d{2}e\d{2}/i)) {
      return 'episode';
    }

    const parentDir = basename(dirname(filePath));
    const parentNfoPath = join(dirname(filePath), `${parentDir}.nfo`);
    
    try {
      await stat(parentNfoPath);
      return 'tvshow';
    } catch {
      return 'movie';
    }
  }
}

export const libraryScanner = new LibraryScanner();