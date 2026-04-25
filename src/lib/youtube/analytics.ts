import type { YouTubeAuth } from './auth';

export interface VideoMetrics {
  videoId: string;
  title: string;
  publishedAt: string;
  views: number;
  watchTimeMinutes: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  subscribersLost: number;
  averageViewDuration: number;
  thumbnailUrl: string;
}

export interface ChannelMetrics {
  totalViews: number;
  totalWatchTimeMinutes: number;
  totalSubscribers: number;
  estimatedRevenue: number;
}

export interface AnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  videoId?: string;
  metrics: string[];
}

export interface AnalyticsClient {
  getVideoMetrics(videoId: string, startDate: string, endDate: string): Promise<VideoMetrics>;
  getChannelMetrics(startDate: string, endDate: string): Promise<ChannelMetrics>;
  getTopVideos(startDate: string, endDate: string, maxResults?: number): Promise<VideoMetrics[]>;
}

const ANALYTICS_API_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';
const DATA_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface DailyMetricsJob {
  run(): Promise<VideoMetrics[]>;
}

export function createDailyMetricsJob(client: AnalyticsClient, daysBack = 1): DailyMetricsJob {
  return {
    async run(): Promise<VideoMetrics[]> {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];

      return client.getTopVideos(startDate, endDate, 50);
    },
  };
}

export function createYouTubeAnalyticsClient(auth: YouTubeAuth): AnalyticsClient {
  async function fetchAnalytics(query: AnalyticsQuery): Promise<Record<string, string>[]> {
    const token = await auth.getValidAccessToken();
    if (!token) {
      throw new Error('Not authenticated with YouTube');
    }

    const params = new URLSearchParams({
      ids: 'channel==MINE',
      startDate: query.startDate,
      endDate: query.endDate,
      metrics: query.metrics.join(','),
      dimensions: 'video',
      sort: '-views',
    });

    if (query.videoId) {
      params.set('filters', `video==${query.videoId}`);
    }

    const response = await fetch(`${ANALYTICS_API_BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Analytics API error: ${error}`);
    }

    const data = await response.json();
    return parseAnalyticsResponse(data);
  }

  async function fetchVideoDetails(
    videoIds: string[]
  ): Promise<Map<string, { title: string; publishedAt: string; thumbnailUrl: string }>> {
    const token = await auth.getValidAccessToken();
    if (!token) {
      throw new Error('Not authenticated with YouTube');
    }

    const params = new URLSearchParams({
      part: 'snippet,statistics',
      id: videoIds.join(','),
      access_token: token,
    });

    const response = await fetch(`${DATA_API_BASE}/videos?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    const details = new Map<string, { title: string; publishedAt: string; thumbnailUrl: string }>();

    for (const item of data.items || []) {
      details.set(item.id, {
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.default?.url || '',
      });
    }

    return details;
  }

  return {
    async getVideoMetrics(
      videoId: string,
      startDate: string,
      endDate: string
    ): Promise<VideoMetrics> {
      const rows = await fetchAnalytics({
        startDate,
        endDate,
        videoId,
        metrics: [
          'views',
          'estimatedMinutesWatched',
          'likes',
          'comments',
          'subscribersGained',
          'subscribersLost',
          'averageViewDuration',
        ],
      });

      const details = await fetchVideoDetails([videoId]);
      const detail = details.get(videoId);
      const row = rows[0] || {};

      return {
        videoId,
        title: detail?.title || 'Unknown',
        publishedAt: detail?.publishedAt || '',
        thumbnailUrl: detail?.thumbnailUrl || '',
        views: parseInt(row.views || '0', 10),
        watchTimeMinutes: parseFloat(row.estimatedMinutesWatched || '0'),
        likes: parseInt(row.likes || '0', 10),
        comments: parseInt(row.comments || '0', 10),
        subscribersGained: parseInt(row.subscribersGained || '0', 10),
        subscribersLost: parseInt(row.subscribersLost || '0', 10),
        averageViewDuration: parseFloat(row.averageViewDuration || '0'),
      };
    },

    async getChannelMetrics(startDate: string, endDate: string): Promise<ChannelMetrics> {
      const rows = await fetchAnalytics({
        startDate,
        endDate,
        metrics: ['views', 'estimatedMinutesWatched', 'subscribersGained', 'estimatedRevenue'],
      });

      const row = rows[0] || {};

      return {
        totalViews: parseInt(row.views || '0', 10),
        totalWatchTimeMinutes: parseFloat(row.estimatedMinutesWatched || '0'),
        totalSubscribers: parseInt(row.subscribersGained || '0', 10),
        estimatedRevenue: parseFloat(row.estimatedRevenue || '0'),
      };
    },

    async getTopVideos(
      startDate: string,
      endDate: string,
      maxResults = 10
    ): Promise<VideoMetrics[]> {
      const rows = await fetchAnalytics({
        startDate,
        endDate,
        metrics: [
          'views',
          'estimatedMinutesWatched',
          'likes',
          'comments',
          'subscribersGained',
          'subscribersLost',
          'averageViewDuration',
        ],
      });

      const videoIds = rows.slice(0, maxResults).map(row => row.video);
      const details = await fetchVideoDetails(videoIds);

      return rows.slice(0, maxResults).map(row => {
        const videoId = row.video;
        const detail = details.get(videoId);

        return {
          videoId,
          title: detail?.title || 'Unknown',
          publishedAt: detail?.publishedAt || '',
          thumbnailUrl: detail?.thumbnailUrl || '',
          views: parseInt(row.views || '0', 10),
          watchTimeMinutes: parseFloat(row.estimatedMinutesWatched || '0'),
          likes: parseInt(row.likes || '0', 10),
          comments: parseInt(row.comments || '0', 10),
          subscribersGained: parseInt(row.subscribersGained || '0', 10),
          subscribersLost: parseInt(row.subscribersLost || '0', 10),
          averageViewDuration: parseFloat(row.averageViewDuration || '0'),
        };
      });
    },
  };
}

function parseAnalyticsResponse(data: unknown): Record<string, string>[] {
  if (!data || typeof data !== 'object' || !('rows' in data)) {
    return [];
  }

  const response = data as { columns?: { name: string }[]; rows?: string[][] };
  const columns = response.columns || [];
  const rows = response.rows || [];

  return rows.map(row => {
    const record: Record<string, string> = {};
    columns.forEach((col, index) => {
      record[col.name] = row[index] || '0';
    });
    return record;
  });
}

export { parseAnalyticsResponse };
