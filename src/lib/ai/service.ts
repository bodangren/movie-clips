import type { AnalysisResult } from './analyzer';
import type { SubtitleEntry, MovieMetadata } from '../subtitle-parser';
import { LlmAnalyzer } from './analyzer';
import { TtsGenerator } from './tts';
import { Cache, generateCacheKey } from './cache';
import { withRetry } from './retry';
import { mockAiService, type MockServiceConfig } from './mock-service';
import { logger } from '../utils/logger';

export interface AiServiceConfig {
  useMock: boolean;
  mockConfig?: Partial<MockServiceConfig>;
  enableCache: boolean;
  enableRetry: boolean;
}

export interface AnalyzeProgress {
  stage: 'analyzing' | 'generating-tts' | 'complete' | 'error';
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: AnalyzeProgress) => void;

const DEFAULT_AI_SERVICE_CONFIG: AiServiceConfig = {
  useMock: false,
  enableCache: true,
  enableRetry: true,
};

export class AiService {
  private analyzer: LlmAnalyzer;
  private ttsGenerator: TtsGenerator;
  private cache: Cache;
  private config: AiServiceConfig;

  constructor(config: Partial<AiServiceConfig> = {}) {
    this.config = { ...DEFAULT_AI_SERVICE_CONFIG, ...config };
    this.analyzer = new LlmAnalyzer();
    this.ttsGenerator = new TtsGenerator();
    this.cache = new Cache({ ttlMs: 24 * 60 * 60 * 1000 });
  }

  async analyze(
    metadata: MovieMetadata,
    subtitles: SubtitleEntry[],
    onProgress?: ProgressCallback
  ): Promise<AnalysisResult | null> {
    const report = (stage: AnalyzeProgress['stage'], progress: number, message: string) => {
      onProgress?.({ stage, progress, message });
    };

    try {
      report('analyzing', 0, `Analyzing ${metadata.title}...`);

      const cacheKey = generateCacheKey({
        type: 'analysis',
        movieTitle: metadata.title,
        subtitlesHash: this.hashSubtitles(subtitles),
      });

      if (this.config.enableCache) {
        const cached = this.cache.get<AnalysisResult>(cacheKey);
        if (cached) {
          logger.info(`Cache hit for analysis: ${metadata.title}`);
          report('complete', 100, 'Analysis complete (cached)');
          return cached;
        }
      }

      let result: AnalysisResult | null = null;

      if (this.config.useMock) {
        if (this.config.mockConfig) {
          mockAiService.setConfig(this.config.mockConfig);
        }
        result = await mockAiService.analyze(metadata, subtitles);
      } else {
        const analyzeFn = () => this.analyzer.analyze(metadata, subtitles);
        result = this.config.enableRetry
          ? await withRetry(analyzeFn, {
              maxAttempts: 3,
              initialDelayMs: 1000,
              maxDelayMs: 10000,
            })
          : await analyzeFn();
      }

      if (!result) {
        report('error', 0, 'Analysis failed');
        return null;
      }

      if (this.config.enableCache) {
        this.cache.set(cacheKey, result);
      }

      report('complete', 100, 'Analysis complete');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Analysis error: ${message}`);
      report('error', 0, `Error: ${message}`);
      return null;
    }
  }

  async generateTtsForFacts(
    facts: AnalysisResult['facts'],
    outputDir: string,
    onProgress?: ProgressCallback
  ): Promise<Record<number, string>> {
    const report = (stage: AnalyzeProgress['stage'], progress: number, message: string) => {
      onProgress?.({ stage, progress, message });
    };

    const results: Record<number, string> = {};
    const total = facts.length;

    try {
      report('generating-tts', 0, 'Starting TTS generation...');

      for (let i = 0; i < facts.length; i++) {
        const fact = facts[i];
        const factText = `${fact.trivia_text} ${fact.scene_context}`;
        const outputPath = `${outputDir}/fact_${fact.number}.wav`;

        const progress = Math.round(((i + 1) / total) * 100);
        report('generating-tts', progress, `Generating TTS for fact ${fact.number}/${total}...`);

        let audioPath: string | null = null;

        if (this.config.useMock) {
          if (this.config.mockConfig) {
            mockAiService.setConfig(this.config.mockConfig);
          }
          audioPath = await mockAiService.generateTts(factText, outputPath);
        } else {
          const ttsFn = () => this.ttsGenerator.generate(factText, outputPath);
          audioPath = this.config.enableRetry
            ? await withRetry(ttsFn, {
                maxAttempts: 3,
                initialDelayMs: 1000,
                maxDelayMs: 30000,
              })
            : await ttsFn();
        }

        if (!audioPath) {
          logger.error(`Failed to generate TTS for fact ${fact.number}`);
          continue;
        }

        results[fact.number] = audioPath;
      }

      report('complete', 100, 'TTS generation complete');
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`TTS generation error: ${message}`);
      report('error', 0, `Error: ${message}`);
      return results;
    }
  }

  setConfig(config: Partial<AiServiceConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.config.useMock && this.config.mockConfig) {
      mockAiService.setConfig(this.config.mockConfig);
    }
  }

  getConfig(): AiServiceConfig {
    return { ...this.config };
  }

  private hashSubtitles(subtitles: SubtitleEntry[]): string {
    const str = subtitles.map((s) => `${s.startTime}-${s.endTime}-${s.text}`).join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

let cachedAiService: AiService | null = null;

export function getAiService(config?: Partial<AiServiceConfig>): AiService {
  if (!cachedAiService) {
    cachedAiService = new AiService(config);
  } else if (config) {
    cachedAiService.setConfig(config);
  }
  return cachedAiService;
}

export function resetAiService(): void {
  cachedAiService = null;
}
