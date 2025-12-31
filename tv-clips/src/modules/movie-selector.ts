import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';

export interface MovieAssets {
  title: string;
  folderPath: string;
  nfoPath: string;
  videoPath: string;
  subtitlePath: string;
  posterPath?: string;
}

export class MovieSelector {
  private libraryPath: string;

  constructor(libraryPath: string) {
    this.libraryPath = libraryPath;
  }

  async scan(): Promise<MovieAssets[]> {
    logger.info(`Scanning library: ${this.libraryPath}`);
    if (!(await fs.pathExists(this.libraryPath))) {
      logger.error(`Library path does not exist: ${this.libraryPath}`);
      return [];
    }

    const entries = await fs.readdir(this.libraryPath);
    const validMovies: MovieAssets[] = [];

    for (const entry of entries) {
      const folderPath = path.join(this.libraryPath, entry);
      const stat = await fs.stat(folderPath);

      if (stat.isDirectory()) {
        const assets = await this.validateMovieFolder(folderPath, entry);
        if (assets) {
          validMovies.push(assets);
        }
      }
    }

    logger.info(`Found ${validMovies.length} valid movies.`);
    return validMovies;
  }

  private async validateMovieFolder(folderPath: string, folderName: string): Promise<MovieAssets | null> {
    const files = await fs.readdir(folderPath);

    const nfoFile = files.find((f) => f.endsWith('.nfo'));
    const videoFile = files.find((f) => /\.(mp4|mkv|avi|mov)$/i.test(f));
    const subtitleFile = files.find((f) => f.endsWith('.srt'));
    const posterFile = files.find((f) => /folder\.(jpg|png|jpeg)/i.test(f) || /poster\.(jpg|png|jpeg)/i.test(f));

    if (nfoFile && videoFile && subtitleFile) {
      return {
        title: folderName,
        folderPath,
        nfoPath: path.join(folderPath, nfoFile),
        videoPath: path.join(folderPath, videoFile),
        subtitlePath: path.join(folderPath, subtitleFile),
        posterPath: posterFile ? path.join(folderPath, posterFile) : undefined,
      };
    }

    return null;
  }
}
