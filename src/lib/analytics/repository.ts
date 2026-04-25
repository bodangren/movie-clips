import Database from '@tauri-apps/plugin-sql';

export interface AnalyticsRecord {
  id?: number;
  videoId: string;
  title: string;
  publishedAt: string;
  metricDate: string;
  views: number;
  watchTimeMinutes: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  subscribersLost: number;
  averageViewDuration: number;
  thumbnailUrl: string;
  createdAt?: string;
}

export interface AnalyticsRepository {
  initialize(): Promise<void>;
  saveRecord(record: AnalyticsRecord): Promise<number>;
  saveRecords(records: AnalyticsRecord[]): Promise<number>;
  getRecordsByVideo(
    videoId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsRecord[]>;
  getRecordsByDateRange(startDate: string, endDate: string): Promise<AnalyticsRecord[]>;
  getLatestRecord(videoId: string): Promise<AnalyticsRecord | null>;
  getTopVideosByViews(
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<AnalyticsRecord[]>;
  deleteOldRecords(beforeDate: string): Promise<number>;
  getAggregatedMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    totalViews: number;
    totalWatchTime: number;
    totalLikes: number;
    totalComments: number;
    totalSubscribersGained: number;
    videoCount: number;
  }>;
}

const DB_PATH = 'sqlite:movie_clips_analytics.db';

export class SqliteAnalyticsRepository implements AnalyticsRepository {
  private db: Database | null = null;

  async initialize(): Promise<void> {
    this.db = await Database.load(DB_PATH);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        published_at TEXT NOT NULL,
        metric_date TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        watch_time_minutes REAL NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        subscribers_gained INTEGER NOT NULL DEFAULT 0,
        subscribers_lost INTEGER NOT NULL DEFAULT 0,
        average_view_duration REAL NOT NULL DEFAULT 0,
        thumbnail_url TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, metric_date)
      )
    `);

    // Index for common queries
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_analytics_video_date 
      ON analytics(video_id, metric_date)
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_analytics_metric_date 
      ON analytics(metric_date)
    `);
  }

  private getDb(): Database {
    if (!this.db) {
      throw new Error('Repository not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async saveRecord(record: AnalyticsRecord): Promise<number> {
    const db = this.getDb();
    const result = await db.execute(
      `
      INSERT OR REPLACE INTO analytics 
      (video_id, title, published_at, metric_date, views, watch_time_minutes, likes, comments, 
       subscribers_gained, subscribers_lost, average_view_duration, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        record.videoId,
        record.title,
        record.publishedAt,
        record.metricDate,
        record.views,
        record.watchTimeMinutes,
        record.likes,
        record.comments,
        record.subscribersGained,
        record.subscribersLost,
        record.averageViewDuration,
        record.thumbnailUrl,
      ]
    );
    return result.lastInsertId;
  }

  async saveRecords(records: AnalyticsRecord[]): Promise<number> {
    let saved = 0;
    for (const record of records) {
      await this.saveRecord(record);
      saved++;
    }
    return saved;
  }

  async getRecordsByVideo(
    videoId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsRecord[]> {
    const db = this.getDb();
    let query = 'SELECT * FROM analytics WHERE video_id = ?';
    const params: (string | number)[] = [videoId];

    if (startDate) {
      query += ' AND metric_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND metric_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY metric_date DESC';

    const rows = await db.select<AnalyticsRow[]>(query, params);
    return rows.map(rowToRecord);
  }

  async getRecordsByDateRange(startDate: string, endDate: string): Promise<AnalyticsRecord[]> {
    const db = this.getDb();
    const rows = await db.select<AnalyticsRow[]>(
      'SELECT * FROM analytics WHERE metric_date >= ? AND metric_date <= ? ORDER BY views DESC',
      [startDate, endDate]
    );
    return rows.map(rowToRecord);
  }

  async getLatestRecord(videoId: string): Promise<AnalyticsRecord | null> {
    const db = this.getDb();
    const rows = await db.select<AnalyticsRow[]>(
      'SELECT * FROM analytics WHERE video_id = ? ORDER BY metric_date DESC LIMIT 1',
      [videoId]
    );
    return rows.length > 0 ? rowToRecord(rows[0]) : null;
  }

  async getTopVideosByViews(
    startDate: string,
    endDate: string,
    limit = 10
  ): Promise<AnalyticsRecord[]> {
    const db = this.getDb();
    const rows = await db.select<AnalyticsRow[]>(
      `SELECT * FROM analytics 
       WHERE metric_date >= ? AND metric_date <= ? 
       ORDER BY views DESC 
       LIMIT ?`,
      [startDate, endDate, limit]
    );
    return rows.map(rowToRecord);
  }

  async deleteOldRecords(beforeDate: string): Promise<number> {
    const db = this.getDb();
    const result = await db.execute('DELETE FROM analytics WHERE metric_date < ?', [beforeDate]);
    return result.rowsAffected;
  }

  async getAggregatedMetrics(
    startDate: string,
    endDate: string
  ): Promise<{
    totalViews: number;
    totalWatchTime: number;
    totalLikes: number;
    totalComments: number;
    totalSubscribersGained: number;
    videoCount: number;
  }> {
    const db = this.getDb();
    const rows = await db.select<
      {
        totalViews: number;
        totalWatchTime: number;
        totalLikes: number;
        totalComments: number;
        totalSubscribersGained: number;
        videoCount: number;
      }[]
    >(
      `SELECT 
        COALESCE(SUM(views), 0) as totalViews,
        COALESCE(SUM(watch_time_minutes), 0) as totalWatchTime,
        COALESCE(SUM(likes), 0) as totalLikes,
        COALESCE(SUM(comments), 0) as totalComments,
        COALESCE(SUM(subscribers_gained), 0) as totalSubscribersGained,
        COUNT(DISTINCT video_id) as videoCount
       FROM analytics 
       WHERE metric_date >= ? AND metric_date <= ?`,
      [startDate, endDate]
    );

    return (
      rows[0] || {
        totalViews: 0,
        totalWatchTime: 0,
        totalLikes: 0,
        totalComments: 0,
        totalSubscribersGained: 0,
        videoCount: 0,
      }
    );
  }
}

interface AnalyticsRow {
  id: number;
  video_id: string;
  title: string;
  published_at: string;
  metric_date: string;
  views: number;
  watch_time_minutes: number;
  likes: number;
  comments: number;
  subscribers_gained: number;
  subscribers_lost: number;
  average_view_duration: number;
  thumbnail_url: string;
  created_at: string;
}

function rowToRecord(row: AnalyticsRow): AnalyticsRecord {
  return {
    id: row.id,
    videoId: row.video_id,
    title: row.title,
    publishedAt: row.published_at,
    metricDate: row.metric_date,
    views: row.views,
    watchTimeMinutes: row.watch_time_minutes,
    likes: row.likes,
    comments: row.comments,
    subscribersGained: row.subscribers_gained,
    subscribersLost: row.subscribers_lost,
    averageViewDuration: row.average_view_duration,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
  };
}

export { rowToRecord };
