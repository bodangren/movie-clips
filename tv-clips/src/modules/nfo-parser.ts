import fs from 'fs-extra';
import xml2js from 'xml2js';
import { logger } from '../utils/logger';

export interface MovieMetadata {
  title: string;
  year: number;
  plot: string;
  tmdbId?: string;
  imdbId?: string;
}

export class NfoParser {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  async parse(filePath: string): Promise<MovieMetadata | null> {
    try {
      const xml = await fs.readFile(filePath, 'utf-8');
      const result = await this.parser.parseStringPromise(xml);

      if (!result || !result.movie) {
        logger.error(`Invalid NFO format: ${filePath}`);
        return null;
      }

      const movie = result.movie;
      return {
        title: movie.title || 'Unknown Title',
        year: parseInt(movie.year, 10) || 0,
        plot: movie.plot || '',
        tmdbId: movie.tmdbid,
        imdbId: movie.id,
      };
    } catch (error) {
      logger.error(`Error parsing NFO file ${filePath}: ${error}`);
      return null;
    }
  }
}
