import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPipelineUploadIntegration } from './pipeline-integration';
import type { YouTubeUploader, UploadVideoOptions, UploadProgress } from './upload';
import type { PipelineRunResult, PipelineContext } from '../pipeline/types';

describe('Pipeline Upload Integration', () => {
  let mockUploader: YouTubeUploader;
  let uploadCalls: Array<{
    options: UploadVideoOptions;
    onProgress?: (progress: UploadProgress) => void;
  }>;

  beforeEach(() => {
    uploadCalls = [];
    mockUploader = {
      uploadVideo: vi.fn(async (options, onProgress) => {
        uploadCalls.push({ options, onProgress });
        return 'test_video_id_123';
      }),
      cancelUpload: vi.fn(),
    };
  });

  function createMockPipelineResult(overrides: Partial<PipelineRunResult> = {}): PipelineRunResult {
    const context: PipelineContext = {
      mediaItem: {
        type: 'movie',
        path: '/movies/test.mp4',
        name: 'Test Movie',
        metadata: {
          title: 'Test Movie',
          year: 2023,
          genre: ['Action', 'Sci-Fi'],
          director: 'Test Director',
          cast: ['Actor One', 'Actor Two'],
          plot: 'A test movie plot',
        },
        subtitlePaths: [],
        posterPath: '/posters/test.jpg',
      },
      analysis: {
        facts: [
          { id: '1', text: 'Fact one', importance: 0.9 },
          { id: '2', text: 'Fact two', importance: 0.8 },
        ],
        summary: 'Test summary',
        suggestedClips: [],
      },
      assets: null,
      videoSegments: null,
      finalOutput: '/output/final_1234567890.mp4',
      errors: [],
      startTime: Date.now(),
      endTime: Date.now(),
      ...((overrides.context || {}) as Partial<PipelineContext>),
    };

    return {
      success: true,
      context,
      completedStages: [
        'select_content',
        'analyze',
        'generate_assets',
        'process_video',
        'render_video',
      ],
      failedStage: null,
      totalDurationMs: 5000,
      ...overrides,
    };
  }

  describe('createPipelineUploadIntegration', () => {
    it('uploads video from pipeline result', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      await integration.uploadFromPipeline(result);

      expect(mockUploader.uploadVideo).toHaveBeenCalledTimes(1);
      expect(uploadCalls[0].options.title).toContain('Test Movie');
    });

    it('skips upload if pipeline failed', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult({ success: false, failedStage: 'render_video' });

      await integration.uploadFromPipeline(result);

      expect(mockUploader.uploadVideo).not.toHaveBeenCalled();
    });

    it('skips upload if no final output', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();
      result.context.finalOutput = null;

      await integration.uploadFromPipeline(result);

      expect(mockUploader.uploadVideo).not.toHaveBeenCalled();
    });

    it('skips upload if no media item', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();
      result.context.mediaItem = null;

      await integration.uploadFromPipeline(result);

      expect(mockUploader.uploadVideo).not.toHaveBeenCalled();
    });

    it('generates title from movie metadata', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      await integration.uploadFromPipeline(result);

      expect(uploadCalls[0].options.title).toBe("5 Things You Didn't Know About Test Movie");
    });

    it('generates description from facts', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      await integration.uploadFromPipeline(result);

      const description = uploadCalls[0].options.description;
      expect(description).toContain('Fact one');
      expect(description).toContain('Fact two');
    });

    it('generates tags from metadata', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      await integration.uploadFromPipeline(result);

      const tags = uploadCalls[0].options.tags;
      expect(tags).toContain('action');
      expect(tags).toContain('sci-fi');
      expect(tags).toContain('2023');
    });

    it('sets privacy status to public by default', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      await integration.uploadFromPipeline(result);

      expect(uploadCalls[0].options.privacyStatus).toBe('public');
    });

    it('forwards progress callback', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();
      const onProgress = vi.fn();

      await integration.uploadFromPipeline(result, onProgress);

      expect(uploadCalls[0].onProgress).toBe(onProgress);
    });

    it('returns video ID on success', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();

      const videoId = await integration.uploadFromPipeline(result);

      expect(videoId).toBe('test_video_id_123');
    });

    it('returns null when skipped', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult({ success: false });

      const videoId = await integration.uploadFromPipeline(result);

      expect(videoId).toBeNull();
    });

    it('handles TV show metadata', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();
      result.context.mediaItem = {
        type: 'tvshow',
        path: '/tv/test',
        name: 'Test Show',
        metadata: {
          title: 'Test Show',
          year: 2022,
          genre: ['Drama'],
          director: '',
          cast: ['Actor Three'],
          plot: 'A test show',
        },
      };

      await integration.uploadFromPipeline(result);

      expect(uploadCalls[0].options.title).toBe("5 Things You Didn't Know About Test Show");
      expect(uploadCalls[0].options.tags).toContain('drama');
    });

    it('uses default title when metadata is missing', async () => {
      const integration = createPipelineUploadIntegration(mockUploader);
      const result = createMockPipelineResult();
      result.context.mediaItem = {
        type: 'movie',
        path: '/movies/unknown.mp4',
        name: 'unknown',
        metadata: {
          title: '',
          year: 0,
          genre: [],
          director: '',
          cast: [],
          plot: '',
        },
        subtitlePaths: [],
      };

      await integration.uploadFromPipeline(result);

      expect(uploadCalls[0].options.title).toBe("5 Things You Didn't Know About unknown");
    });
  });
});
