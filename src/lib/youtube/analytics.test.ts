import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createYouTubeAnalyticsClient,
  parseAnalyticsResponse,
  type VideoMetrics,
  type ChannelMetrics,
} from './analytics';
import type { YouTubeAuth } from './auth';

const mockAuth: YouTubeAuth = {
  isAuthenticated: vi.fn(),
  getValidAccessToken: vi.fn(),
  saveTokens: vi.fn(),
  clearAuth: vi.fn(),
  getAuthorizationUrl: vi.fn(),
};

describe('parseAnalyticsResponse', () => {
  it('parses valid analytics response', () => {
    const data = {
      columns: [{ name: 'video' }, { name: 'views' }, { name: 'likes' }],
      rows: [
        ['abc123', '1000', '50'],
        ['def456', '2000', '100'],
      ],
    };

    const result = parseAnalyticsResponse(data);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ video: 'abc123', views: '1000', likes: '50' });
    expect(result[1]).toEqual({ video: 'def456', views: '2000', likes: '100' });
  });

  it('returns empty array for invalid data', () => {
    expect(parseAnalyticsResponse(null)).toEqual([]);
    expect(parseAnalyticsResponse({})).toEqual([]);
    expect(parseAnalyticsResponse({ columns: [] })).toEqual([]);
  });

  it('handles missing values', () => {
    const data = {
      columns: [{ name: 'video' }, { name: 'views' }],
      rows: [['abc123']],
    };

    const result = parseAnalyticsResponse(data);
    expect(result[0]).toEqual({ video: 'abc123', views: '0' });
  });
});

describe('createYouTubeAnalyticsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws when not authenticated', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue(null);

    const client = createYouTubeAnalyticsClient(mockAuth);

    await expect(client.getVideoMetrics('abc123', '2024-01-01', '2024-01-31')).rejects.toThrow(
      'Not authenticated with YouTube'
    );
  });

  it('fetches video metrics', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue('test-token');

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Analytics API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        columns: [
          { name: 'video' },
          { name: 'views' },
          { name: 'estimatedMinutesWatched' },
          { name: 'likes' },
          { name: 'comments' },
          { name: 'subscribersGained' },
          { name: 'subscribersLost' },
          { name: 'averageViewDuration' },
        ],
        rows: [['abc123', '5000', '120.5', '200', '50', '10', '2', '45.2']],
      }),
    });

    // Video details API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'abc123',
            snippet: {
              title: 'Test Video',
              publishedAt: '2024-01-15T10:00:00Z',
              thumbnails: { default: { url: 'http://example.com/thumb.jpg' } },
            },
          },
        ],
      }),
    });

    const client = createYouTubeAnalyticsClient(mockAuth);
    const metrics = await client.getVideoMetrics('abc123', '2024-01-01', '2024-01-31');

    expect(metrics.videoId).toBe('abc123');
    expect(metrics.title).toBe('Test Video');
    expect(metrics.views).toBe(5000);
    expect(metrics.watchTimeMinutes).toBe(120.5);
    expect(metrics.likes).toBe(200);
    expect(metrics.comments).toBe(50);
    expect(metrics.subscribersGained).toBe(10);
    expect(metrics.subscribersLost).toBe(2);
    expect(metrics.averageViewDuration).toBe(45.2);
  });

  it('fetches channel metrics', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue('test-token');

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        columns: [
          { name: 'views' },
          { name: 'estimatedMinutesWatched' },
          { name: 'subscribersGained' },
          { name: 'estimatedRevenue' },
        ],
        rows: [['100000', '5000.5', '500', '125.50']],
      }),
    });

    const client = createYouTubeAnalyticsClient(mockAuth);
    const metrics = await client.getChannelMetrics('2024-01-01', '2024-01-31');

    expect(metrics.totalViews).toBe(100000);
    expect(metrics.totalWatchTimeMinutes).toBe(5000.5);
    expect(metrics.totalSubscribers).toBe(500);
    expect(metrics.estimatedRevenue).toBe(125.5);
  });

  it('fetches top videos', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue('test-token');

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Analytics response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        columns: [{ name: 'video' }, { name: 'views' }, { name: 'estimatedMinutesWatched' }],
        rows: [
          ['video1', '10000', '300'],
          ['video2', '5000', '150'],
        ],
      }),
    });

    // Video details response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'video1',
            snippet: {
              title: 'Video One',
              publishedAt: '2024-01-10T10:00:00Z',
              thumbnails: { default: { url: 'http://example.com/1.jpg' } },
            },
          },
          {
            id: 'video2',
            snippet: {
              title: 'Video Two',
              publishedAt: '2024-01-20T10:00:00Z',
              thumbnails: { default: { url: 'http://example.com/2.jpg' } },
            },
          },
        ],
      }),
    });

    const client = createYouTubeAnalyticsClient(mockAuth);
    const videos = await client.getTopVideos('2024-01-01', '2024-01-31', 2);

    expect(videos).toHaveLength(2);
    expect(videos[0].videoId).toBe('video1');
    expect(videos[0].views).toBe(10000);
    expect(videos[1].videoId).toBe('video2');
    expect(videos[1].views).toBe(5000);
  });

  it('handles API errors', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue('test-token');

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Quota exceeded',
    });

    const client = createYouTubeAnalyticsClient(mockAuth);
    await expect(client.getChannelMetrics('2024-01-01', '2024-01-31')).rejects.toThrow(
      'Analytics API error'
    );
  });

  it('limits top videos results', async () => {
    vi.mocked(mockAuth.getValidAccessToken).mockResolvedValue('test-token');

    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Analytics response with 5 videos
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        columns: [{ name: 'video' }, { name: 'views' }],
        rows: [
          ['v1', '100'],
          ['v2', '90'],
          ['v3', '80'],
          ['v4', '70'],
          ['v5', '60'],
        ],
      }),
    });

    // Video details
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
      }),
    });

    const client = createYouTubeAnalyticsClient(mockAuth);
    const videos = await client.getTopVideos('2024-01-01', '2024-01-31', 3);

    expect(videos).toHaveLength(3);
  });
});
