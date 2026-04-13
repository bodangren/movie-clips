import type { AnalysisResult } from './analyzer';
import type { SubtitleEntry, MovieMetadata } from '../subtitle-parser';
import { logger } from '../utils/logger';

export interface MockServiceConfig {
  delayMs: number;
  simulateErrors: boolean;
  errorMessage?: string;
}

const DEFAULT_MOCK_CONFIG: MockServiceConfig = {
  delayMs: 500,
  simulateErrors: false,
};

export class MockAiService {
  private config: MockServiceConfig;

  constructor(config: Partial<MockServiceConfig> = {}) {
    this.config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }

  async analyze(
    metadata: MovieMetadata,
    _subtitles: SubtitleEntry[]
  ): Promise<AnalysisResult | null> {
    await this.simulateDelay();

    if (this.config.simulateErrors) {
      throw new Error(this.config.errorMessage || 'Simulated AI error');
    }

    logger.info(`Mock analyzing: ${metadata.title}`);

    return {
      movie_title: metadata.title,
      video_title: `5 Things You Didn't Know About ${metadata.title.split(' ')[0]}`,
      video_description:
        'Discover the fascinating secrets behind this incredible film! Like and subscribe for more mind-blowing movie facts!',
      facts: [
        {
          number: 1,
          trivia_text: 'This scene was filmed in a single take, stunning everyone on set.',
          clip_start: '00:05:30',
          clip_end: '00:05:42',
          scene_context: 'The director challenged the actors to improvise this entire sequence.',
        },
        {
          number: 2,
          trivia_text: 'That background extra in the corner is actually a famous director.',
          clip_start: '00:15:20',
          clip_end: '00:15:35',
          scene_context: 'He was visiting the set and decided to join the crowd scene.',
        },
        {
          number: 3,
          trivia_text: 'The weather changed dramatically, creating this unforgettable moment.',
          clip_start: '00:32:10',
          clip_end: '00:32:28',
          scene_context: 'No CGI was used - nature itself provided the drama.',
        },
        {
          number: 4,
          trivia_text: 'This prop was hand-crafted by a master artisan over three months.',
          clip_start: '00:48:45',
          clip_end: '00:49:02',
          scene_context: 'The detail work is so precise you can see individual brush strokes.',
        },
        {
          number: 5,
          trivia_text: "The final line was improvised and became the movie's signature moment.",
          clip_start: '01:25:00',
          clip_end: '01:25:18',
          scene_context: 'The actor felt so strongly about it that he insisted on keeping it.',
        },
      ],
    };
  }

  async generateTts(_text: string, outputPath: string): Promise<string | null> {
    await this.simulateDelay();

    if (this.config.simulateErrors) {
      throw new Error(this.config.errorMessage || 'Simulated TTS error');
    }

    logger.info(`Mock TTS generated: ${outputPath}`);
    return outputPath;
  }

  setConfig(config: Partial<MockServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private async simulateDelay(): Promise<void> {
    if (this.config.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delayMs));
    }
  }
}

export const mockAiService = new MockAiService();
