import { readFile } from 'fs/promises';
import type { SubtitleEntry } from './types';
import { logger } from '../utils/logger';

export class SubtitleParser {
  async parse(filePath: string): Promise<SubtitleEntry[]> {
    try {
      const srtContent = await readFile(filePath, 'utf-8');
      return this.parseSrt(srtContent);
    } catch (error) {
      logger.error(`Error reading SRT file ${filePath}: ${error}`);
      return [];
    }
  }

  private parseSrt(content: string): SubtitleEntry[] {
    const blocks = content.trim().split(/\n\s*\n/);
    const entries: SubtitleEntry[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const id = lines[0].trim();
      const timeLine = lines[1].trim();
      const textLines = lines.slice(2);

      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
      );

      if (!timeMatch) continue;

      const [, startH, startM, startS, startMs, endH, endM, endS, endMs] = timeMatch;

      const entry: SubtitleEntry = {
        id,
        startTime: `${startH}:${startM}:${startS},${startMs}`,
        endTime: `${endH}:${endM}:${endS},${endMs}`,
        text: this.cleanText(textLines.join('\n')),
        startTimeMS: this.timeToMs(`${startH}:${startM}:${startS},${startMs}`),
        endTimeMS: this.timeToMs(`${endH}:${endM}:${endS},${endMs}`),
      };

      entries.push(entry);
    }

    return entries;
  }

  private cleanText(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }

  private timeToMs(timeStr: string): number {
    const [hms, ms] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600000 + m * 60000 + s * 1000 + parseInt(ms, 10);
  }
}

export const subtitleParser = new SubtitleParser();
