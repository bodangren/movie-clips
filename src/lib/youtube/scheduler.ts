import { v4 as uuidv4 } from 'uuid';

export type QueueItemStatus = 'pending' | 'uploading' | 'published' | 'failed';

export interface QueueItem {
  id: string;
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  status: QueueItemStatus;
  scheduledFor: string | null; // ISO date string
  youtubeId: string | null;
  publishedAt: string | null; // ISO date string
  createdAt: string; // ISO date string
  retryCount: number;
  errorMessage: string | null;
}

export interface UploadQueue {
  items: QueueItem[];
  lastUpdated: string; // ISO date string
}

export interface SchedulerConfig {
  uploadWindows: string[]; // Cron expressions: "0 12 * * *"
  maxUploadsPerDay: number;
  timezone: string;
}

export interface QueueStorage {
  load(): Promise<UploadQueue | null>;
  save(queue: UploadQueue): Promise<void>;
}

export interface UploadScheduler {
  addToQueue(
    item: Omit<
      QueueItem,
      | 'id'
      | 'status'
      | 'scheduledFor'
      | 'youtubeId'
      | 'publishedAt'
      | 'createdAt'
      | 'retryCount'
      | 'errorMessage'
    >
  ): Promise<QueueItem>;
  getQueue(): Promise<UploadQueue>;
  getNextScheduled(): Promise<QueueItem | null>;
  updateItemStatus(
    id: string,
    status: QueueItemStatus,
    youtubeId?: string,
    errorMessage?: string
  ): Promise<void>;
  rescheduleFailed(id: string): Promise<void>;
  canReschedule(id: string): Promise<boolean>;
  removeFromQueue(id: string): Promise<void>;
}

const MAX_RETRIES = 3;

export function createUploadScheduler(
  config: SchedulerConfig,
  storage: QueueStorage
): UploadScheduler {
  return {
    async addToQueue(item) {
      const queue = await loadQueue(storage);

      // Check daily quota
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayUploads = queue.items.filter(
        i =>
          i.scheduledFor &&
          new Date(i.scheduledFor) >= today &&
          new Date(i.scheduledFor) < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      ).length;

      if (todayUploads >= config.maxUploadsPerDay) {
        throw new Error('Daily upload quota exceeded');
      }

      // Calculate next scheduled time
      const scheduledFor = calculateNextWindow(config.uploadWindows);

      const queueItem: QueueItem = {
        id: uuidv4(),
        ...item,
        status: 'pending',
        scheduledFor: scheduledFor.toISOString(),
        youtubeId: null,
        publishedAt: null,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        errorMessage: null,
      };

      queue.items.push(queueItem);
      queue.lastUpdated = new Date().toISOString();
      await storage.save(queue);

      return queueItem;
    },

    async getQueue() {
      return loadQueue(storage);
    },

    async getNextScheduled() {
      const queue = await loadQueue(storage);
      const now = new Date().toISOString();

      return (
        queue.items
          .filter(i => i.status === 'pending' && i.scheduledFor && i.scheduledFor <= now)
          .sort(
            (a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime()
          )[0] || null
      );
    },

    async updateItemStatus(id, status, youtubeId?, errorMessage?) {
      const queue = await loadQueue(storage);
      const item = queue.items.find(i => i.id === id);

      if (!item) {
        throw new Error('Item not found');
      }

      item.status = status;

      if (status === 'published' && youtubeId) {
        item.youtubeId = youtubeId;
        item.publishedAt = new Date().toISOString();
      }

      if (status === 'failed' && errorMessage) {
        item.errorMessage = errorMessage;
        item.retryCount++;
      }

      queue.lastUpdated = new Date().toISOString();
      await storage.save(queue);
    },

    async rescheduleFailed(id) {
      const queue = await loadQueue(storage);
      const item = queue.items.find(i => i.id === id);

      if (!item) {
        throw new Error('Item not found');
      }

      if (item.retryCount >= MAX_RETRIES) {
        throw new Error('Max retries exceeded');
      }

      item.status = 'pending';
      item.errorMessage = null;
      item.scheduledFor = calculateNextWindow(config.uploadWindows).toISOString();

      queue.lastUpdated = new Date().toISOString();
      await storage.save(queue);
    },

    async canReschedule(id) {
      const queue = await loadQueue(storage);
      const item = queue.items.find(i => i.id === id);

      if (!item) {
        return false;
      }

      return item.retryCount < MAX_RETRIES;
    },

    async removeFromQueue(id) {
      const queue = await loadQueue(storage);
      const index = queue.items.findIndex(i => i.id === id);

      if (index === -1) {
        throw new Error('Item not found');
      }

      queue.items.splice(index, 1);
      queue.lastUpdated = new Date().toISOString();
      await storage.save(queue);
    },
  };
}

async function loadQueue(storage: QueueStorage): Promise<UploadQueue> {
  const queue = await storage.load();
  if (queue) {
    return queue;
  }

  return {
    items: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate the next upload window based on cron-like expressions
 * Supports simple format: "minute hour * * *" (daily at specific time)
 */
function calculateNextWindow(windows: string[]): Date {
  const now = new Date();
  const candidates: Date[] = [];

  for (const windowExpr of windows) {
    const [minute, hour] = windowExpr.split(' ').map(Number);

    // Today's window
    const todayWindow = new Date(now);
    todayWindow.setUTCHours(hour, minute, 0, 0);

    if (todayWindow > now) {
      candidates.push(todayWindow);
    } else {
      // Tomorrow's window
      const tomorrowWindow = new Date(todayWindow);
      tomorrowWindow.setUTCDate(tomorrowWindow.getUTCDate() + 1);
      candidates.push(tomorrowWindow);
    }
  }

  // Return the earliest future window
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}
