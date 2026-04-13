import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiService, getAiService, resetAiService } from './service';
import type { MovieMetadata, SubtitleEntry } from '../subtitle-parser';
import type { AnalysisResult } from './analyzer';

vi.mock('../config/service', () => ({
  getConfig: vi.fn(() => ({
    google: {
      projectId: 'test-project',
      location: 'us-central1',
      ttsVoices: ['Achernar', 'Algieba'],
    },
    pipeline: {
      maxRetries: 3,
      timeoutMs: 30000,
    },
  })),
}));

vi.mock('./analyzer', () => ({
  LlmAnalyzer: vi.fn().mockImplementation(function () {
    return {
      analyze: vi.fn().mockResolvedValue({
        movie_title: 'Test Movie',
        video_title: '5 Things About Test',
        video_description: 'Discover the secrets!',
        facts: [
          {
            number: 1,
            trivia_text: 'This is a test fact.',
            clip_start: '00:05:00',
            clip_end: '00:05:10',
            scene_context: 'Test scene context.',
          },
        ],
      }),
    };
  }),
}));

vi.mock('./tts', () => ({
  TtsGenerator: vi.fn().mockImplementation(function () {
    return {
      generate: vi.fn().mockResolvedValue('/tmp/test.wav'),
    };
  }),
}));

vi.mock('./mock-service', () => ({
  mockAiService: {
    analyze: vi.fn(),
    generateTts: vi.fn(),
    setConfig: vi.fn(),
  },
}));

describe('AiService', () => {
  const mockMetadata: MovieMetadata = {
    title: 'Test Movie',
    year: 2024,
    runtime: 120,
    genres: ['Action'],
    director: 'Test Director',
    plot: 'A test movie plot.',
  };

  const mockSubtitles: SubtitleEntry[] = [
    { startTime: '00:01:00', endTime: '00:01:05', text: 'Hello world' },
    { startTime: '00:02:00', endTime: '00:02:05', text: 'Another line' },
  ];

  beforeEach(() => {
    resetAiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAiService();
  });

  describe('analyze', () => {
    it('should return analysis result', async () => {
      const service = new AiService({ useMock: false, enableCache: false, enableRetry: false });
      const result = await service.analyze(mockMetadata, mockSubtitles);

      expect(result).toBeDefined();
      expect(result?.movie_title).toBe('Test Movie');
    });

    it('should use mock service when configured', async () => {
      const mockResult: AnalysisResult = {
        movie_title: 'Mock Movie',
        video_title: 'Mock Title',
        video_description: 'Mock description',
        facts: [],
      };

      const { mockAiService: mockService } = await import('./mock-service');
      vi.mocked(mockService.analyze).mockResolvedValue(mockResult);

      const service = new AiService({ useMock: true });
      const result = await service.analyze(mockMetadata, mockSubtitles);

      expect(mockService.analyze).toHaveBeenCalledWith(mockMetadata, mockSubtitles);
      expect(result?.movie_title).toBe('Mock Movie');
    });

    it('should report progress during analysis', async () => {
      const progressUpdates: any[] = [];
      const service = new AiService({ useMock: false, enableCache: false, enableRetry: false });

      await service.analyze(mockMetadata, mockSubtitles, progress => {
        progressUpdates.push(progress);
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('analyzing');
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
    });
  });

  describe('generateTtsForFacts', () => {
    it('should generate TTS for facts', async () => {
      const mockFacts: AnalysisResult['facts'] = [
        {
          number: 1,
          trivia_text: 'Test fact text',
          clip_start: '00:05:00',
          clip_end: '00:05:10',
          scene_context: 'Test context',
        },
      ];

      const service = new AiService({ useMock: false, enableCache: false, enableRetry: false });
      const results = await service.generateTtsForFacts(mockFacts, '/tmp');

      expect(Object.keys(results)).toContain('1');
    });

    it('should use mock TTS when configured', async () => {
      const mockFacts: AnalysisResult['facts'] = [
        {
          number: 1,
          trivia_text: 'Test fact text',
          clip_start: '00:05:00',
          clip_end: '00:05:10',
          scene_context: 'Test context',
        },
      ];

      const { mockAiService: mockService } = await import('./mock-service');
      vi.mocked(mockService.generateTts).mockResolvedValue('/tmp/mock.wav');

      const service = new AiService({ useMock: true });
      const results = await service.generateTtsForFacts(mockFacts, '/tmp');

      expect(mockService.generateTts).toHaveBeenCalled();
      expect(results[1]).toBe('/tmp/mock.wav');
    });
  });

  describe('getAiService singleton', () => {
    it('should return singleton instance', () => {
      const service1 = getAiService();
      const service2 = getAiService();
      expect(service1).toBe(service2);
    });

    it('should update config when called with config', () => {
      const service1 = getAiService({ useMock: false });
      const config1 = service1.getConfig();
      expect(config1.useMock).toBe(false);

      const service2 = getAiService({ useMock: true });
      const config2 = service2.getConfig();
      expect(config2.useMock).toBe(true);
    });
  });

  describe('resetAiService', () => {
    it('should reset singleton', () => {
      const service1 = getAiService();
      resetAiService();
      const service2 = getAiService();
      expect(service1).not.toBe(service2);
    });
  });
});
