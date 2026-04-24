import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDashboardService, type DashboardService } from './dashboard';
import type { UploadQueue, QueueItem, UploadScheduler } from './scheduler';

describe('YouTube Dashboard Service', () => {
  let service: DashboardService;
  let mockScheduler: UploadScheduler;
  let mockQueue: UploadQueue;

  beforeEach(() => {
    mockQueue = {
      items: [],
      lastUpdated: new Date().toISOString(),
    };

    mockScheduler = {
      getQueue: vi.fn(async () => mockQueue),
      addToQueue: vi.fn(),
      getNextScheduled: vi.fn(),
      updateItemStatus: vi.fn(),
      rescheduleFailed: vi.fn(),
      canReschedule: vi.fn(),
      removeFromQueue: vi.fn(),
    };

    service = createDashboardService(mockScheduler);
  });

  function createMockItem(overrides: Partial<QueueItem> = {}): QueueItem {
    return {
      id: `test-${Math.random().toString(36).substring(7)}`,
      videoPath: '/output/test.mp4',
      title: 'Test Video',
      description: 'Test description',
      tags: ['test'],
      status: 'pending',
      scheduledFor: new Date().toISOString(),
      youtubeId: null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      errorMessage: null,
      ...overrides,
    };
  }

  describe('getQueueStatus', () => {
    it('returns empty status for empty queue', async () => {
      const status = await service.getQueueStatus();

      expect(status.total).toBe(0);
      expect(status.pending).toBe(0);
      expect(status.uploading).toBe(0);
      expect(status.published).toBe(0);
      expect(status.failed).toBe(0);
    });

    it('counts items by status', async () => {
      mockQueue.items = [
        createMockItem({ status: 'pending' }),
        createMockItem({ status: 'pending' }),
        createMockItem({ status: 'uploading' }),
        createMockItem({ status: 'published' }),
        createMockItem({ status: 'failed' }),
      ];

      const status = await service.getQueueStatus();

      expect(status.total).toBe(5);
      expect(status.pending).toBe(2);
      expect(status.uploading).toBe(1);
      expect(status.published).toBe(1);
      expect(status.failed).toBe(1);
    });
  });

  describe('getUploadHistory', () => {
    it('returns only published items', async () => {
      mockQueue.items = [
        createMockItem({
          status: 'published',
          youtubeId: 'youtube1',
          publishedAt: '2026-04-24T12:00:00Z',
        }),
        createMockItem({
          status: 'published',
          youtubeId: 'youtube2',
          publishedAt: '2026-04-24T18:00:00Z',
        }),
        createMockItem({ status: 'pending' }),
        createMockItem({ status: 'failed' }),
      ];

      const history = await service.getUploadHistory();

      expect(history).toHaveLength(2);
      expect(history[0].youtubeId).toBe('youtube2');
      expect(history[1].youtubeId).toBe('youtube1');
    });

    it('sorts by published date descending', async () => {
      mockQueue.items = [
        createMockItem({
          status: 'published',
          youtubeId: 'older',
          publishedAt: '2026-04-23T12:00:00Z',
        }),
        createMockItem({
          status: 'published',
          youtubeId: 'newer',
          publishedAt: '2026-04-24T12:00:00Z',
        }),
      ];

      const history = await service.getUploadHistory();

      expect(history[0].youtubeId).toBe('newer');
      expect(history[1].youtubeId).toBe('older');
    });

    it('returns empty array when no published items', async () => {
      mockQueue.items = [
        createMockItem({ status: 'pending' }),
        createMockItem({ status: 'failed' }),
      ];

      const history = await service.getUploadHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('getPendingItems', () => {
    it('returns pending items sorted by scheduled time', async () => {
      mockQueue.items = [
        createMockItem({ status: 'pending', scheduledFor: '2026-04-24T18:00:00Z' }),
        createMockItem({ status: 'pending', scheduledFor: '2026-04-24T12:00:00Z' }),
        createMockItem({ status: 'uploading' }),
      ];

      const pending = await service.getPendingItems();

      expect(pending).toHaveLength(2);
      expect(pending[0].scheduledFor).toBe('2026-04-24T12:00:00Z');
    });
  });

  describe('getFailedItems', () => {
    it('returns failed items', async () => {
      mockQueue.items = [
        createMockItem({ status: 'failed', errorMessage: 'Network error' }),
        createMockItem({ status: 'failed', errorMessage: 'Auth failed' }),
        createMockItem({ status: 'pending' }),
      ];

      const failed = await service.getFailedItems();

      expect(failed).toHaveLength(2);
      expect(failed[0].errorMessage).toBeDefined();
    });
  });

  describe('getNextUpload', () => {
    it('delegates to scheduler', async () => {
      const nextItem = createMockItem({ status: 'pending' });
      mockScheduler.getNextScheduled = vi.fn(async () => nextItem);

      const result = await service.getNextUpload();

      expect(result).toBe(nextItem);
      expect(mockScheduler.getNextScheduled).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('calculates upload statistics', async () => {
      mockQueue.items = [
        createMockItem({ status: 'published', publishedAt: '2026-04-24T12:00:00Z' }),
        createMockItem({ status: 'published', publishedAt: '2026-04-24T18:00:00Z' }),
        createMockItem({ status: 'published', publishedAt: '2026-04-23T12:00:00Z' }),
        createMockItem({ status: 'failed' }),
        createMockItem({ status: 'failed' }),
        createMockItem({ status: 'pending' }),
      ];

      const stats = await service.getStats();

      expect(stats.totalUploaded).toBe(3);
      expect(stats.totalFailed).toBe(2);
      expect(stats.totalPending).toBe(1);
      expect(stats.uploadSuccessRate).toBe(60); // 3 published / 5 completed
    });

    it('handles empty queue', async () => {
      const stats = await service.getStats();

      expect(stats.totalUploaded).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.totalPending).toBe(0);
      expect(stats.uploadSuccessRate).toBe(0);
    });

    it('calculates today uploads', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockQueue.items = [
        createMockItem({ status: 'published', publishedAt: `${today}T12:00:00Z` }),
        createMockItem({ status: 'published', publishedAt: `${today}T18:00:00Z` }),
        createMockItem({ status: 'published', publishedAt: '2026-04-23T12:00:00Z' }),
      ];

      const stats = await service.getStats();

      expect(stats.uploadsToday).toBe(2);
    });
  });

  describe('retryFailedItem', () => {
    it('delegates to scheduler', async () => {
      await service.retryFailedItem('item-123');
      expect(mockScheduler.rescheduleFailed).toHaveBeenCalledWith('item-123');
    });
  });

  describe('removeItem', () => {
    it('delegates to scheduler', async () => {
      await service.removeItem('item-123');
      expect(mockScheduler.removeFromQueue).toHaveBeenCalledWith('item-123');
    });
  });
});
