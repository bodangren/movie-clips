import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SqliteAnalyticsRepository,
  rowToRecord,
  type AnalyticsRecord,
  type AnalyticsRow,
} from './repository';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: (...args: unknown[]) => mockExecute(...args),
        select: (...args: unknown[]) => mockSelect(...args),
      })
    ),
  },
}));

describe('rowToRecord', () => {
  it('converts database row to analytics record', () => {
    const row: AnalyticsRow = {
      id: 1,
      video_id: 'abc123',
      title: 'Test Video',
      published_at: '2024-01-15',
      metric_date: '2024-01-20',
      views: 1000,
      watch_time_minutes: 500,
      likes: 100,
      comments: 20,
      subscribers_gained: 50,
      subscribers_lost: 5,
      average_view_duration: 30,
      thumbnail_url: 'http://example.com/thumb.jpg',
      created_at: '2024-01-20T10:00:00Z',
    };

    const record = rowToRecord(row);
    expect(record.videoId).toBe('abc123');
    expect(record.title).toBe('Test Video');
    expect(record.views).toBe(1000);
    expect(record.watchTimeMinutes).toBe(500);
  });
});

describe('SqliteAnalyticsRepository', () => {
  let repo: SqliteAnalyticsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SqliteAnalyticsRepository();
  });

  it('initializes database with schema and indexes', async () => {
    await repo.initialize();

    expect(mockExecute).toHaveBeenCalledTimes(3);
    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS analytics')
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_analytics_video_date')
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_analytics_metric_date')
    );
  });

  it('saves a record', async () => {
    await repo.initialize();
    mockExecute.mockResolvedValueOnce({ lastInsertId: 42, rowsAffected: 1 });

    const record: AnalyticsRecord = {
      videoId: 'abc123',
      title: 'Test Video',
      publishedAt: '2024-01-15',
      metricDate: '2024-01-20',
      views: 1000,
      watchTimeMinutes: 500,
      likes: 100,
      comments: 20,
      subscribersGained: 50,
      subscribersLost: 5,
      averageViewDuration: 30,
      thumbnailUrl: 'http://example.com/thumb.jpg',
    };

    const id = await repo.saveRecord(record);
    expect(id).toBe(42);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO analytics'),
      expect.arrayContaining(['abc123', 'Test Video', '2024-01-15', '2024-01-20', 1000, 500])
    );
  });

  it('saves multiple records', async () => {
    await repo.initialize();
    mockExecute.mockResolvedValue({ lastInsertId: 1, rowsAffected: 1 });

    const records: AnalyticsRecord[] = [
      {
        videoId: 'v1',
        title: 'Video 1',
        publishedAt: '2024-01-15',
        metricDate: '2024-01-20',
        views: 100,
        watchTimeMinutes: 50,
        likes: 10,
        comments: 2,
        subscribersGained: 5,
        subscribersLost: 0,
        averageViewDuration: 30,
        thumbnailUrl: '',
      },
      {
        videoId: 'v2',
        title: 'Video 2',
        publishedAt: '2024-01-16',
        metricDate: '2024-01-20',
        views: 200,
        watchTimeMinutes: 100,
        likes: 20,
        comments: 4,
        subscribersGained: 10,
        subscribersLost: 1,
        averageViewDuration: 30,
        thumbnailUrl: '',
      },
    ];

    const saved = await repo.saveRecords(records);
    expect(saved).toBe(2);
    expect(mockExecute).toHaveBeenCalledTimes(2 + 3); // 2 saves + 3 init
  });

  it('gets records by video id', async () => {
    await repo.initialize();
    const mockRows: AnalyticsRow[] = [
      {
        id: 1,
        video_id: 'abc123',
        title: 'Test',
        published_at: '2024-01-15',
        metric_date: '2024-01-20',
        views: 1000,
        watch_time_minutes: 500,
        likes: 100,
        comments: 20,
        subscribers_gained: 50,
        subscribers_lost: 5,
        average_view_duration: 30,
        thumbnail_url: '',
        created_at: '',
      },
    ];
    mockSelect.mockResolvedValueOnce(mockRows);

    const records = await repo.getRecordsByVideo('abc123', '2024-01-01', '2024-01-31');
    expect(records).toHaveLength(1);
    expect(records[0].videoId).toBe('abc123');
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('WHERE video_id = ?'), [
      'abc123',
      '2024-01-01',
      '2024-01-31',
    ]);
  });

  it('gets records by date range', async () => {
    await repo.initialize();
    mockSelect.mockResolvedValueOnce([]);

    await repo.getRecordsByDateRange('2024-01-01', '2024-01-31');
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining('WHERE metric_date >= ? AND metric_date <= ?'),
      ['2024-01-01', '2024-01-31']
    );
  });

  it('gets latest record for video', async () => {
    await repo.initialize();
    const mockRows: AnalyticsRow[] = [
      {
        id: 1,
        video_id: 'abc123',
        title: 'Test',
        published_at: '2024-01-15',
        metric_date: '2024-01-20',
        views: 1000,
        watch_time_minutes: 500,
        likes: 100,
        comments: 20,
        subscribers_gained: 50,
        subscribers_lost: 5,
        average_view_duration: 30,
        thumbnail_url: '',
        created_at: '',
      },
    ];
    mockSelect.mockResolvedValueOnce(mockRows);

    const record = await repo.getLatestRecord('abc123');
    expect(record).not.toBeNull();
    expect(record?.videoId).toBe('abc123');
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY metric_date DESC LIMIT 1'),
      ['abc123']
    );
  });

  it('returns null when no latest record found', async () => {
    await repo.initialize();
    mockSelect.mockResolvedValueOnce([]);

    const record = await repo.getLatestRecord('nonexistent');
    expect(record).toBeNull();
  });

  it('gets top videos by views', async () => {
    await repo.initialize();
    mockSelect.mockResolvedValueOnce([]);

    await repo.getTopVideosByViews('2024-01-01', '2024-01-31', 5);
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('ORDER BY views DESC'), [
      '2024-01-01',
      '2024-01-31',
      5,
    ]);
  });

  it('deletes old records', async () => {
    await repo.initialize();
    mockExecute.mockResolvedValueOnce({ rowsAffected: 10, lastInsertId: 0 });

    const deleted = await repo.deleteOldRecords('2023-12-31');
    expect(deleted).toBe(10);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM analytics WHERE metric_date < ?'),
      ['2023-12-31']
    );
  });

  it('gets aggregated metrics', async () => {
    await repo.initialize();
    mockSelect.mockResolvedValueOnce([
      {
        totalViews: 100000,
        totalWatchTime: 5000,
        totalLikes: 5000,
        totalComments: 1000,
        totalSubscribersGained: 500,
        videoCount: 50,
      },
    ]);

    const metrics = await repo.getAggregatedMetrics('2024-01-01', '2024-01-31');
    expect(metrics.totalViews).toBe(100000);
    expect(metrics.totalWatchTime).toBe(5000);
    expect(metrics.videoCount).toBe(50);
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('SUM(views)'), [
      '2024-01-01',
      '2024-01-31',
    ]);
  });

  it('returns zero metrics when no data', async () => {
    await repo.initialize();
    mockSelect.mockResolvedValueOnce([]);

    const metrics = await repo.getAggregatedMetrics('2024-01-01', '2024-01-31');
    expect(metrics.totalViews).toBe(0);
    expect(metrics.videoCount).toBe(0);
  });

  it('throws when not initialized', () => {
    const uninitializedRepo = new SqliteAnalyticsRepository();
    expect(() => uninitializedRepo.saveRecord({} as AnalyticsRecord)).rejects.toThrow(
      'Repository not initialized'
    );
  });
});
