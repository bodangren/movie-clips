import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmAnalyzer } from './analyzer';
import { generateObject } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import type { SubtitleEntry, MovieMetadata } from '../subtitle-parser';
import { z } from 'zod';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/google-vertex', () => {
  const mockModel = vi.fn();
  return {
    createVertex: vi.fn(() => () => ({ model: mockModel })),
  };
});

vi.mock('@/lib/config/service', () => ({
  getConfig: vi.fn(() => ({
    version: 1,
    paths: { movies: '', tv: '', output: '', temp: '' },
    google: { projectId: 'test-project', location: 'global', ttsVoices: [] },
    video: { targetWidth: 720, targetHeight: 1280, fps: 30 },
    pipeline: { maxRetries: 3, timeoutMs: 300000 },
    ui: { theme: 'system', language: 'en' },
  })),
}));

const factSchema = z.object({
  number: z.number().int(),
  trivia_text: z.string().describe('Voiceover text, 20-25 words preferred, never exceed 45 words.'),
  clip_start: z.string(),
  clip_end: z.string(),
  scene_context: z.string(),
});

const analysisSchema = z.object({
  movie_title: z.string(),
  video_title: z.string(),
  video_description: z.string(),
  facts: z.array(factSchema).length(5),
});

describe('LlmAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMetadata: MovieMetadata = {
    title: 'The Matrix',
    year: 1999,
  };

  const mockSubtitles: SubtitleEntry[] = [
    { startTime: '00:01:00', endTime: '00:01:05', text: 'What is real?' },
    { startTime: '00:02:00', endTime: '00:02:08', text: 'The Matrix is everywhere.' },
    { startTime: '01:30:00', endTime: '01:30:10', text: 'There is no spoon.' },
  ];

  const validFacts = [
    {
      number: 1,
      trivia_text: 'Fact 1',
      clip_start: '00:01:00',
      clip_end: '00:01:08',
      scene_context: 'Context 1',
    },
    {
      number: 2,
      trivia_text: 'Fact 2',
      clip_start: '00:15:00',
      clip_end: '00:15:08',
      scene_context: 'Context 2',
    },
    {
      number: 3,
      trivia_text: 'Fact 3',
      clip_start: '00:30:00',
      clip_end: '00:30:08',
      scene_context: 'Context 3',
    },
    {
      number: 4,
      trivia_text: 'Fact 4',
      clip_start: '00:45:00',
      clip_end: '00:45:08',
      scene_context: 'Context 4',
    },
    {
      number: 5,
      trivia_text: 'Fact 5',
      clip_start: '01:00:00',
      clip_end: '01:00:08',
      scene_context: 'Context 5',
    },
  ];

  describe('analyze', () => {
    it('should return analysis result when Gemini returns valid response', async () => {
      const mockResult = {
        object: {
          movie_title: 'The Matrix',
          video_title: '5 Mind-Bending Facts',
          video_description: 'Discover the secrets behind this iconic film!',
          facts: validFacts,
        },
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult as any);

      const analyzer = new LlmAnalyzer();
      const result = await analyzer.analyze(mockMetadata, mockSubtitles);

      expect(result).not.toBeNull();
      expect(result!.movie_title).toBe('The Matrix');
      expect(result!.facts).toHaveLength(5);
      expect(generateObject).toHaveBeenCalled();
      const callArgs = vi.mocked(generateObject).mock.calls[0][0] as any;
      expect(callArgs.prompt).toContain('The Matrix');
      expect(callArgs.schema).toBeDefined();
    });

    it('should return null when Vertex provider is not configured', async () => {
      vi.mocked(createVertex).mockReturnValue({
        model: vi.fn(),
      } as any);

      vi.mocked(generateObject).mockResolvedValue({
        object: {
          movie_title: 'The Matrix',
          video_title: 'Title',
          video_description: 'Desc',
          facts: validFacts,
        },
      } as any);

      const analyzer = new LlmAnalyzer();
      const result = await analyzer.analyze(mockMetadata, mockSubtitles);

      expect(result).toBeNull();
    });

    it('should return null when Gemini returns different movie title', async () => {
      const mockResult = {
        object: {
          movie_title: 'Different Movie',
          video_title: '5 Facts',
          video_description: 'Description',
          facts: validFacts,
        },
      };

      vi.mocked(generateObject).mockResolvedValue(mockResult as any);

      const analyzer = new LlmAnalyzer();
      const result = await analyzer.analyze(mockMetadata, mockSubtitles);

      expect(result).toBeNull();
    });

    it('should return null and log error when Gemini throws exception', async () => {
      vi.mocked(generateObject).mockRejectedValue(new Error('API Error'));

      const analyzer = new LlmAnalyzer();
      const result = await analyzer.analyze(mockMetadata, mockSubtitles);

      expect(result).toBeNull();
    });
  });

  describe('schema validation', () => {
    it('should validate correct analysis schema', () => {
      const validAnalysis = {
        movie_title: 'Test Movie',
        video_title: '5 Amazing Facts',
        video_description: 'Discover something new!',
        facts: validFacts,
      };

      const result = analysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });

    it('should reject analysis with fewer than 5 facts', () => {
      const invalidAnalysis = {
        movie_title: 'Test Movie',
        video_title: '5 Amazing Facts',
        video_description: 'Discover something new!',
        facts: [validFacts[0]],
      };

      const result = analysisSchema.safeParse(invalidAnalysis);
      expect(result.success).toBe(false);
    });

    it('should reject analysis with missing required fields', () => {
      const invalidAnalysis = {
        movie_title: 'Test Movie',
        facts: [],
      };

      const result = analysisSchema.safeParse(invalidAnalysis);
      expect(result.success).toBe(false);
    });

    it('should reject fact with missing scene_context', () => {
      const invalidFact = {
        number: 1,
        trivia_text: 'Fact text',
        clip_start: '00:01:00',
        clip_end: '00:01:10',
      };

      const result = analysisSchema.safeParse({
        movie_title: 'Test',
        video_title: 'Title',
        video_description: 'Desc',
        facts: [invalidFact as any],
      });
      expect(result.success).toBe(false);
    });

    it('should reject fact with missing clip timestamps', () => {
      const invalidFact = {
        number: 1,
        trivia_text: 'Fact text',
        scene_context: 'Context',
      };

      const result = analysisSchema.safeParse({
        movie_title: 'Test',
        video_title: 'Title',
        video_description: 'Desc',
        facts: [invalidFact as any],
      });
      expect(result.success).toBe(false);
    });
  });
});
