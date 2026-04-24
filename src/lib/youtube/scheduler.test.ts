import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createUploadScheduler,
  type UploadScheduler,
  type QueueItem,
  type UploadQueue,
  type SchedulerConfig,
} from './scheduler';

describe('Upload Scheduler', () => {
  let scheduler: UploadScheduler;
  let mockStorage: { data: UploadQueue | null };
  let currentTime: Date;

  beforeEach(() => {
    mockStorage = { data: null };
    currentTime = new Date('2026-04-24T10:00:00Z'); // 10:00 AM UTC

    const config: SchedulerConfig = {
      uploadWindows: ['0 12 * * *', '0 18 * * *'], // 12:00 and 18:00 daily
      maxUploadsPerDay: 6,
      timezone: 'UTC',
    };

    const storage = {
      load: vi.fn(async () => mockStorage.data),
      save: vi.fn(async (queue: UploadQueue) => {
        mockStorage.data = queue;
      }),
    };

    scheduler = createUploadScheduler(config, storage);
  });

  describe('addToQueue', () => {
    it('adds item to queue with pending status', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      expect(item.status).toBe('pending');
      expect(item.videoPath).toBe('/output/test.mp4');
      expect(item.id).toBeDefined();
    });

    it('assigns scheduled time based on next window', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      // Should schedule for 12:00 (next window)
      expect(item.scheduledFor).toBeDefined();
      const scheduledDate = new Date(item.scheduledFor!);
      expect(scheduledDate.getUTCHours()).toBe(12);
      expect(scheduledDate.getUTCMinutes()).toBe(0);
    });

    it('persists queue to storage', async () => {
      await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      expect(mockStorage.data).not.toBeNull();
      expect(mockStorage.data!.items).toHaveLength(1);
    });
  });

  describe('getQueue', () => {
    it('returns empty queue initially', async () => {
      const queue = await scheduler.getQueue();
      expect(queue.items).toHaveLength(0);
    });

    it('returns all queue items', async () => {
      await scheduler.addToQueue({
        videoPath: '/output/1.mp4',
        title: 'Video 1',
        description: 'Desc 1',
        tags: ['test'],
      });
      await scheduler.addToQueue({
        videoPath: '/output/2.mp4',
        title: 'Video 2',
        description: 'Desc 2',
        tags: ['test'],
      });

      const queue = await scheduler.getQueue();
      expect(queue.items).toHaveLength(2);
    });
  });

  describe('getNextScheduled', () => {
    it('returns null when window has not arrived yet', async () => {
      await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      const next = await scheduler.getNextScheduled();
      expect(next).toBeNull(); // Window is in the future
    });

    it('returns null when queue is empty', async () => {
      const next = await scheduler.getNextScheduled();
      expect(next).toBeNull();
    });

    it('returns null when no pending items', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      // Mark as uploading
      await scheduler.updateItemStatus(item.id, 'uploading');

      const next = await scheduler.getNextScheduled();
      expect(next).toBeNull();
    });
  });

  describe('updateItemStatus', () => {
    it('updates item status', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      await scheduler.updateItemStatus(item.id, 'uploading');
      const queue = await scheduler.getQueue();
      const updated = queue.items.find(i => i.id === item.id);
      expect(updated!.status).toBe('uploading');
    });

    it('sets publishedAt for published status', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      await scheduler.updateItemStatus(item.id, 'published', 'youtube123');
      const queue = await scheduler.getQueue();
      const updated = queue.items.find(i => i.id === item.id);
      expect(updated!.status).toBe('published');
      expect(updated!.youtubeId).toBe('youtube123');
      expect(updated!.publishedAt).toBeDefined();
    });

    it('increments retry count for failed status', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      await scheduler.updateItemStatus(item.id, 'failed', undefined, 'Network error');
      const queue = await scheduler.getQueue();
      const updated = queue.items.find(i => i.id === item.id);
      expect(updated!.status).toBe('failed');
      expect(updated!.errorMessage).toBe('Network error');
      expect(updated!.retryCount).toBe(1);
    });
  });

  describe('quota validation', () => {
    it('enforces max uploads per day', async () => {
      // Add 6 videos (max per day)
      for (let i = 0; i < 6; i++) {
        await scheduler.addToQueue({
          videoPath: `/output/${i}.mp4`,
          title: `Video ${i}`,
          description: `Desc ${i}`,
          tags: ['test'],
        });
      }

      // 7th video should fail
      await expect(
        scheduler.addToQueue({
          videoPath: '/output/7.mp4',
          title: 'Video 7',
          description: 'Desc 7',
          tags: ['test'],
        })
      ).rejects.toThrow('Daily upload quota exceeded');
    });

    it('tracks daily upload count', async () => {
      // Add 5 videos (under the 6 limit)
      for (let i = 0; i < 5; i++) {
        await scheduler.addToQueue({
          videoPath: `/output/${i}.mp4`,
          title: `Video ${i}`,
          description: `Desc ${i}`,
          tags: ['test'],
        });
      }

      // 6th video should succeed
      const item = await scheduler.addToQueue({
        videoPath: '/output/5.mp4',
        title: 'Video 5',
        description: 'Desc',
        tags: ['test'],
      });
      expect(item.status).toBe('pending');
    });
  });

  describe('window calculation', () => {
    it('assigns scheduled time for new items', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      expect(item.scheduledFor).toBeDefined();
      const scheduledDate = new Date(item.scheduledFor!);
      expect(scheduledDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('schedules items at valid windows', async () => {
      const item1 = await scheduler.addToQueue({
        videoPath: '/output/1.mp4',
        title: 'Video 1',
        description: 'Desc 1',
        tags: ['test'],
      });

      const item2 = await scheduler.addToQueue({
        videoPath: '/output/2.mp4',
        title: 'Video 2',
        description: 'Desc 2',
        tags: ['test'],
      });

      // Both should have valid scheduled times
      expect(item1.scheduledFor).toBeDefined();
      expect(item2.scheduledFor).toBeDefined();
    });
  });

  describe('retry logic', () => {
    it('reschedules failed items to next window', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      // Mark as failed
      await scheduler.updateItemStatus(item.id, 'failed', undefined, 'Network error');

      // Reschedule
      await scheduler.rescheduleFailed(item.id);

      const queue = await scheduler.getQueue();
      const updated = queue.items.find(i => i.id === item.id);
      expect(updated!.status).toBe('pending');
      expect(updated!.scheduledFor).toBeDefined();
    });

    it('limits retries to 3 attempts', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      // Simulate 2 retries (3 total attempts: initial + 2 retries)
      for (let i = 0; i < 2; i++) {
        await scheduler.updateItemStatus(item.id, 'failed', undefined, 'Error');
        await scheduler.rescheduleFailed(item.id);
      }

      // 3rd failure should mark as permanently failed
      await scheduler.updateItemStatus(item.id, 'failed', undefined, 'Final error');

      const canReschedule = await scheduler.canReschedule(item.id);
      expect(canReschedule).toBe(false);
    });
  });

  describe('removeFromQueue', () => {
    it('removes item from queue', async () => {
      const item = await scheduler.addToQueue({
        videoPath: '/output/test.mp4',
        title: 'Test Video',
        description: 'Test description',
        tags: ['test'],
      });

      await scheduler.removeFromQueue(item.id);

      const queue = await scheduler.getQueue();
      expect(queue.items).toHaveLength(0);
    });

    it('throws if item not found', async () => {
      await expect(scheduler.removeFromQueue('non-existent')).rejects.toThrow('Item not found');
    });
  });
});
