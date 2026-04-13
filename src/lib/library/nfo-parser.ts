import { readFile } from 'fs/promises';
import type { NfoMetadata } from './types';
import { logger } from '../utils/logger';

export class NfoParser {
  async parse(filePath: string): Promise<NfoMetadata | null> {
    try {
      const xml = await readFile(filePath, 'utf-8');
      return this.parseXml(xml);
    } catch (error) {
      logger.error(`Error reading NFO file ${filePath}: ${error}`);
      return null;
    }
  }

  private parseXml(xml: string): NfoMetadata | null {
    try {
      const title = this.getElementText(xml, 'title');
      if (!title) {
        logger.error('Invalid NFO format: missing title');
        return null;
      }

      const yearStr = this.getElementText(xml, 'year');
      const year = yearStr ? parseInt(yearStr, 10) : 0;

      return {
        title,
        year,
        plot: this.getElementText(xml, 'plot') || '',
        tmdbId: this.getElementText(xml, 'tmdbid'),
        imdbId: this.getElementText(xml, 'id'),
      };
    } catch (error) {
      logger.error(`Error parsing NFO XML: ${error}`);
      return null;
    }
  }

  private getElementText(xml: string, tagName: string): string | undefined {
    const pattern = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
    const match = xml.match(pattern);
    return match?.[1]?.trim();
  }
}

export const nfoParser = new NfoParser();
