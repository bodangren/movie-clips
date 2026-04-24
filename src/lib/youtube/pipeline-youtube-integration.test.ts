import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPipelineYouTubeIntegration,
  type PipelineYouTubeIntegration,
} from './pipeline-youtube-integration';
import type { PipelineRunResult } from '../pipeline/types';
import type { UploadScheduler } from './scheduler';

describe('Pipeline YouTube Integration', () => {
  let integration: PipelineYouTubeIntegration;
  let mockScheduler: UploadScheduler;

  beforeEach(() => {
    mockScheduler = {
      getQueue: vi.fn(async () => ({ items: [], lastUpdated: new Date().toISOString() })),
      addToQueue: vi.fn(async item => ({
        id: 'test-id',
        ...item,
        status: 'pending' as const,
        scheduledFor: new Date().toISOString(),
        youtubeId: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        errorMessage: null,
      })),
      getNextScheduled: vi.fn(),
      updateItemStatus: vi.fn(),
      rescheduleFailed: vi.fn(),
      canReschedule: vi.fn(),
      removeFromQueue: vi.fn(),
    };

    integration = createPipelineYouTubeIntegration(mockScheduler);
  });

  function createMockPipelineResult(overrides: Partial<PipelineRunResult> = {}): PipelineRunResult {
    return {
      success: true,
      context: {
        mediaItem: {
          type: 'movie',
          path: '/movies/test.mp4',
          name: 'Test Movie',
          extension: '.mp4',
          size: 1024 * 1024 * 500,
          modifiedAt: new Date('2026-01-01'),
          metadata: {
            title: 'The Matrix',
            year: 1999,
            genres: ['Action', 'Sci-Fi'],
            director: 'The Wachowskis',
            cast: ['Keanu Reeves'],
            plot: 'A computer hacker learns about reality.',
          },
          subtitlePaths: [],
          posterPath: '/posters/matrix.jpg',
        },
        analysis: {
          facts: [{ id: '1', text: 'Fact one', importance: 0.9 }],
          summary: 'Summary',
          suggestedClips: [],
        },
        assets: null,
        videoSegments: null,
        finalOutput: '/output/final_123.mp4',
        errors: [],
        startTime: Date.now(),
        endTime: Date.now(),
      },
      completedStages: ['render_video'],
      failedStage: null,
      totalDurationMs: 5000,
      ...overrides,
    };
  }

  describe('onPipelineComplete', () => {
    beforeEach(() => {
      integration.setAutoQueueEnabled(true);
    });

    it('queues video on successful pipeline completion', async () => {
      const result = createMockPipelineResult();

      await integration.onPipelineComplete(result);

      expect(mockScheduler.addToQueue).toHaveBeenCalledTimes(1);
      const callArgs = (mockScheduler.addToQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.videoPath).toBe('/output/final_123.mp4');
      expect(callArgs.title).toContain('The Matrix');
    });

    it('skips failed pipelines', async () => {
      const result = createMockPipelineResult({ success: false, failedStage: 'render_video' });

      await integration.onPipelineComplete(result);

      expect(mockScheduler.addToQueue).not.toHaveBeenCalled();
    });

    it('skips when no final output', async () => {
      const result = createMockPipelineResult();
      result.context.finalOutput = null;

      await integration.onPipelineComplete(result);

      expect(mockScheduler.addToQueue).not.toHaveBeenCalled();
    });

    it('skips when no media item', async () => {
      const result = createMockPipelineResult();
      result.context.mediaItem = null;

      await integration.onPipelineComplete(result);

      expect(mockScheduler.addToQueue).not.toHaveBeenCalled();
    });

    it('uses generated metadata', async () => {
      const result = createMockPipelineResult();

      await integration.onPipelineComplete(result);

      const callArgs = (mockScheduler.addToQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.title).toBe("5 Things You Didn't Know About The Matrix");
      expect(callArgs.description).toContain('Fact one');
      expect(callArgs.tags).toContain('action');
    });

    it('handles TV shows', async () => {
      const result = createMockPipelineResult();
      result.context.mediaItem = {
        type: 'tvshow',
        path: '/tv/breaking-bad',
        name: 'Breaking Bad',
        extension: '',
        size: 0,
        modifiedAt: new Date('2026-01-01'),
        metadata: {
          title: 'Breaking Bad',
          year: 2008,
          genres: ['Drama'],
          director: '',
          cast: ['Bryan Cranston'],
          plot: 'A chemistry teacher turned meth cook.',
        },
      };

      await integration.onPipelineComplete(result);

      const callArgs = (mockScheduler.addToQueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.title).toBe("5 Things You Didn't Know About Breaking Bad");
    });
  });

  describe('isAutoQueueEnabled', () => {
    it('returns false by default', () => {
      expect(integration.isAutoQueueEnabled()).toBe(false);
    });

    it('can be enabled', () => {
      integration.setAutoQueueEnabled(true);
      expect(integration.isAutoQueueEnabled()).toBe(true);
    });

    it('can be disabled', () => {
      integration.setAutoQueueEnabled(true);
      integration.setAutoQueueEnabled(false);
      expect(integration.isAutoQueueEnabled()).toBe(false);
    });
  });
});
