import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createYouTubeUploader, type YouTubeUploader } from './upload';
import type { YouTubeAuth } from './auth';

function createMockAuth(): YouTubeAuth {
  return {
    isAuthenticated: vi.fn().mockResolvedValue(true),
    getValidAccessToken: vi.fn().mockResolvedValue('test_access_token'),
    saveTokens: vi.fn().mockResolvedValue(undefined),
    clearAuth: vi.fn().mockResolvedValue(undefined),
    getAuthorizationUrl: vi.fn().mockReturnValue(''),
  };
}

function createMockVideoFile(size: number = 1024 * 1024): File {
  return new File([new Uint8Array(size)], 'test-video.mp4', {
    type: 'video/mp4',
  });
}

describe('YouTube Upload', () => {
  let uploader: YouTubeUploader;
  let mockAuth: YouTubeAuth;
  let progressCallbacks: Array<{ loaded: number; total: number }>;

  beforeEach(() => {
    mockAuth = createMockAuth();
    uploader = createYouTubeUploader(mockAuth);
    progressCallbacks = [];
    vi.clearAllMocks();
  });

  describe('uploadVideo', () => {
    it('initiates resumable upload and returns video ID', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      // Mock init response with Location header
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        // Mock chunk upload response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'test_video_id_123', snippet: { title: 'Test' } }),
        } as Response);

      const result = await uploader.uploadVideo({
        videoFile: mockFile,
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test', 'video'],
        privacyStatus: 'public',
      });

      expect(result).toBe('test_video_id_123');
      expect(mockAuth.getValidAccessToken).toHaveBeenCalled();
    });

    it('sends correct metadata in init request', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'video123' }),
        } as Response);

      await uploader.uploadVideo({
        videoFile: mockFile,
        title: 'My Movie Clip',
        description: 'Amazing facts about this movie',
        tags: ['movie', 'facts'],
        privacyStatus: 'unlisted',
      });

      const initCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const initBody = JSON.parse(initCall[1].body);

      expect(initBody.snippet.title).toBe('My Movie Clip');
      expect(initBody.snippet.description).toBe('Amazing facts about this movie');
      expect(initBody.snippet.tags).toEqual(['movie', 'facts']);
      expect(initBody.status.privacyStatus).toBe('unlisted');
    });

    it('reports upload progress', async () => {
      const mockFile = createMockVideoFile(1024 * 1024 * 10); // 10MB
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'video123' }),
        } as Response);

      await uploader.uploadVideo(
        {
          videoFile: mockFile,
          title: 'Test',
          description: 'Test',
          tags: [],
          privacyStatus: 'public',
        },
        progress => {
          progressCallbacks.push(progress);
        }
      );

      expect(progressCallbacks.length).toBeGreaterThan(0);
      expect(progressCallbacks[progressCallbacks.length - 1].loaded).toBe(mockFile.size);
      expect(progressCallbacks[progressCallbacks.length - 1].total).toBe(mockFile.size);
    });

    it('retries on 5xx errors with exponential backoff', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        // First chunk upload fails with 503
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service Unavailable' } }),
        } as Response)
        // Retry succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'video123' }),
        } as Response);

      const result = await uploader.uploadVideo({
        videoFile: mockFile,
        title: 'Test',
        description: 'Test',
        tags: [],
        privacyStatus: 'public',
      });

      expect(result).toBe('video123');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('aborts on 4xx errors after init', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: { message: 'Bad Request' } }),
        } as Response);

      await expect(
        uploader.uploadVideo({
          videoFile: mockFile,
          title: 'Test',
          description: 'Test',
          tags: [],
          privacyStatus: 'public',
        })
      ).rejects.toThrow('Upload failed: 400');
    });

    it('fails when not authenticated', async () => {
      mockAuth.getValidAccessToken = vi.fn().mockResolvedValue(null);

      await expect(
        uploader.uploadVideo({
          videoFile: createMockVideoFile(),
          title: 'Test',
          description: 'Test',
          tags: [],
          privacyStatus: 'public',
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('retries up to 3 times then fails', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        // All attempts fail with 503 (1 initial + 3 retries = 4 chunk calls)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service Unavailable' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service Unavailable' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service Unavailable' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: 'Service Unavailable' } }),
        } as Response);

      await expect(
        uploader.uploadVideo({
          videoFile: mockFile,
          title: 'Test',
          description: 'Test',
          tags: [],
          privacyStatus: 'public',
        })
      ).rejects.toThrow('Upload failed after 3 retries');

      expect(global.fetch).toHaveBeenCalledTimes(5); // 1 init + 4 chunk attempts
    }, 15000);

    it('splits large files into chunks', async () => {
      const mockFile = createMockVideoFile(1024 * 1024 * 10); // 10MB
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        // First chunk upload succeeds but not final (return null to indicate more chunks)
        .mockResolvedValueOnce({
          ok: true,
          status: 308,
          json: async () => ({}),
        } as Response)
        // Second chunk upload succeeds and returns video ID
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'video123' }),
        } as Response);

      await uploader.uploadVideo({
        videoFile: mockFile,
        title: 'Test',
        description: 'Test',
        tags: [],
        privacyStatus: 'public',
      });

      // Should have 1 init call + 2 chunk calls
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBe(3);
    });
  });

  describe('cancelUpload', () => {
    it('cancels active upload session', async () => {
      const mockFile = createMockVideoFile();
      const sessionUri = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test123';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ Location: sessionUri }),
          json: async () => ({}),
        } as Response)
        // Mock that respects abort signal
        .mockImplementation((_url: string, options?: RequestInit) => {
          return new Promise((_resolve, reject) => {
            if (options?.signal) {
              options.signal.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
              });
            }
          });
        });

      const uploadPromise = uploader.uploadVideo({
        videoFile: mockFile,
        title: 'Test',
        description: 'Test',
        tags: [],
        privacyStatus: 'public',
      });

      // Cancel after a short delay
      setTimeout(() => uploader.cancelUpload(), 10);

      await expect(uploadPromise).rejects.toThrow('Upload cancelled');
    });
  });
});
