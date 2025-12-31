import fs from 'fs-extra';
import xml2js from 'xml2js';
import { logger } from '../utils/logger';

export interface TvShowMetadata {
  title: string;
  year: number;
  plot: string;
  tmdbId?: string;
  imdbId?: string;
}

export interface SeasonMetadata {
  title: string;
  seasonNumber: number;
  year: number;
  plot: string;
}

export interface EpisodeMetadata {
  title: string;
  showTitle: string;
  season: number;
  episode: number;
  year: number;
  plot: string;
  aired?: string;
}

export class TvNfoParser {
  private parser: xml2js.Parser;

  constructor() {
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  async parseShow(filePath: string): Promise<TvShowMetadata | null> {
    try {
      const xml = await fs.readFile(filePath, 'utf-8');
      const result = await this.parser.parseStringPromise(xml);

      if (!result || !result.tvshow) {
        logger.error(`Invalid tvshow NFO format: ${filePath}`);
        return null;
      }

      const tvshow = result.tvshow;
      return {
        title: tvshow.title || tvshow.originaltitle || 'Unknown Title',
        year: parseInt(tvshow.year, 10) || 0,
        plot: tvshow.plot || '',
        tmdbId: tvshow.tmdbid,
        imdbId: tvshow.imdb_id || tvshow.imdbid || tvshow.id,
      };
    } catch (error) {
      logger.error(`Error parsing tvshow NFO file ${filePath}: ${error}`);
      return null;
    }
  }

  async parseSeason(filePath: string): Promise<SeasonMetadata | null> {
    try {
      const xml = await fs.readFile(filePath, 'utf-8');
      const result = await this.parser.parseStringPromise(xml);

      if (!result || !result.season) {
        logger.error(`Invalid season NFO format: ${filePath}`);
        return null;
      }

      const season = result.season;
      return {
        title: season.title || 'Season',
        seasonNumber: parseInt(season.seasonnumber, 10) || 0,
        year: parseInt(season.year, 10) || 0,
        plot: season.plot || '',
      };
    } catch (error) {
      logger.error(`Error parsing season NFO file ${filePath}: ${error}`);
      return null;
    }
  }

  async parseEpisode(filePath: string): Promise<EpisodeMetadata | null> {
    try {
      const xml = await fs.readFile(filePath, 'utf-8');
      const result = await this.parser.parseStringPromise(xml);

      if (!result || !result.episodedetails) {
        logger.error(`Invalid episode NFO format: ${filePath}`);
        return null;
      }

      const episode = result.episodedetails;
      return {
        title: episode.title || 'Unknown Episode',
        showTitle: episode.showtitle || 'Unknown Show',
        season: parseInt(episode.season, 10) || 0,
        episode: parseInt(episode.episode, 10) || 0,
        year: parseInt(episode.year, 10) || 0,
        plot: episode.plot || '',
        aired: episode.aired,
      };
    } catch (error) {
      logger.error(`Error parsing episode NFO file ${filePath}: ${error}`);
      return null;
    }
  }
}
