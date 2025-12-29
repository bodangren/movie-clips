import fs from 'fs-extra';
import SrtParser from 'srt-parser-2';
import { logger } from '../utils/logger';

export interface SubtitleEntry {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
  startTimeMS: number;
  endTimeMS: number;
}

export class SubtitleParser {
  private parser: SrtParser;

  constructor() {
    this.parser = new SrtParser();
  }

  async parse(filePath: string): Promise<SubtitleEntry[]> {
    try {
      const srtContent = await fs.readFile(filePath, 'utf-8');
      const rawEntries = this.parser.fromSrt(srtContent);

      return rawEntries.map((entry) => ({
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
        text: this.cleanText(entry.text),
        startTimeMS: this.timeToMs(entry.startTime),
        endTimeMS: this.timeToMs(entry.endTime),
      }));
    } catch (error) {
      logger.error(`Error parsing SRT file ${filePath}: ${error}`);
      return [];
    }
  }

  private cleanText(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  private timeToMs(timeStr: string): number {
    // HH:MM:SS,ms
    const [hms, ms] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600000 + m * 60000 + s * 1000 + parseInt(ms, 10);
  }
}
