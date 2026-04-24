import type { UploadScheduler, QueueItem } from './scheduler';

export interface QueueStatus {
  total: number;
  pending: number;
  uploading: number;
  published: number;
  failed: number;
}

export interface UploadHistoryItem {
  id: string;
  title: string;
  youtubeId: string;
  publishedAt: string;
  videoPath: string;
}

export interface UploadStats {
  totalUploaded: number;
  totalFailed: number;
  totalPending: number;
  uploadSuccessRate: number;
  uploadsToday: number;
}

export interface DashboardService {
  getQueueStatus(): Promise<QueueStatus>;
  getUploadHistory(): Promise<UploadHistoryItem[]>;
  getPendingItems(): Promise<QueueItem[]>;
  getFailedItems(): Promise<QueueItem[]>;
  getNextUpload(): Promise<QueueItem | null>;
  getStats(): Promise<UploadStats>;
  retryFailedItem(id: string): Promise<void>;
  removeItem(id: string): Promise<void>;
}

export function createDashboardService(scheduler: UploadScheduler): DashboardService {
  return {
    async getQueueStatus(): Promise<QueueStatus> {
      const queue = await scheduler.getQueue();

      return {
        total: queue.items.length,
        pending: queue.items.filter(i => i.status === 'pending').length,
        uploading: queue.items.filter(i => i.status === 'uploading').length,
        published: queue.items.filter(i => i.status === 'published').length,
        failed: queue.items.filter(i => i.status === 'failed').length,
      };
    },

    async getUploadHistory(): Promise<UploadHistoryItem[]> {
      const queue = await scheduler.getQueue();

      return queue.items
        .filter(
          (i): i is QueueItem & { status: 'published'; youtubeId: string; publishedAt: string } =>
            i.status === 'published' && i.youtubeId !== null && i.publishedAt !== null
        )
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
        .map(item => ({
          id: item.id,
          title: item.title,
          youtubeId: item.youtubeId!,
          publishedAt: item.publishedAt!,
          videoPath: item.videoPath,
        }));
    },

    async getPendingItems(): Promise<QueueItem[]> {
      const queue = await scheduler.getQueue();

      return queue.items
        .filter(i => i.status === 'pending')
        .sort((a, b) => {
          if (!a.scheduledFor && !b.scheduledFor) return 0;
          if (!a.scheduledFor) return 1;
          if (!b.scheduledFor) return -1;
          return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
        });
    },

    async getFailedItems(): Promise<QueueItem[]> {
      const queue = await scheduler.getQueue();
      return queue.items.filter(i => i.status === 'failed');
    },

    async getNextUpload(): Promise<QueueItem | null> {
      return scheduler.getNextScheduled();
    },

    async getStats(): Promise<UploadStats> {
      const queue = await scheduler.getQueue();
      const published = queue.items.filter(i => i.status === 'published');
      const failed = queue.items.filter(i => i.status === 'failed');
      const pending = queue.items.filter(i => i.status === 'pending');

      const today = new Date().toISOString().split('T')[0];
      const uploadsToday = published.filter(i => i.publishedAt?.startsWith(today)).length;

      const completedCount = published.length + failed.length;
      const successRate =
        completedCount > 0 ? Math.round((published.length / completedCount) * 100) : 0;

      return {
        totalUploaded: published.length,
        totalFailed: failed.length,
        totalPending: pending.length,
        uploadSuccessRate: successRate,
        uploadsToday,
      };
    },

    async retryFailedItem(id: string): Promise<void> {
      await scheduler.rescheduleFailed(id);
    },

    async removeItem(id: string): Promise<void> {
      await scheduler.removeFromQueue(id);
    },
  };
}
