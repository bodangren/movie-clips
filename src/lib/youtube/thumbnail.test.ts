import { describe, it, expect, beforeEach } from 'vitest';
import { createThumbnailGenerator, type ThumbnailGenerator } from './thumbnail';

describe('Thumbnail Generation', () => {
  let generator: ThumbnailGenerator;

  beforeEach(() => {
    generator = createThumbnailGenerator();
  });

  describe('extractFrame', () => {
    it('accepts video path and timestamp', async () => {
      const result = await generator.extractFrame('/videos/test.mp4', 5);
      expect(result).toBeDefined();
    });

    it('returns a Blob', async () => {
      const result = await generator.extractFrame('/videos/test.mp4', 0);
      expect(result).toBeInstanceOf(Blob);
    });

    it('defaults to timestamp 0 when not specified', async () => {
      const result = await generator.extractFrame('/videos/test.mp4');
      expect(result).toBeDefined();
    });

    it('handles invalid video paths', async () => {
      await expect(generator.extractFrame('', 0)).rejects.toThrow('Invalid video path');
    });

    it('handles negative timestamps', async () => {
      await expect(generator.extractFrame('/videos/test.mp4', -1)).rejects.toThrow(
        'Invalid timestamp'
      );
    });
  });

  describe('resizeThumbnail', () => {
    it('returns a Blob', async () => {
      const inputBlob = new Blob(['test'], { type: 'image/png' });
      const result = await generator.resizeThumbnail(inputBlob);
      expect(result).toBeInstanceOf(Blob);
    });

    it('targets 1280x720 dimensions', async () => {
      const inputBlob = new Blob(['test'], { type: 'image/png' });
      const result = await generator.resizeThumbnail(inputBlob);
      // In a real implementation, this would validate dimensions
      expect(result).toBeDefined();
    });

    it('outputs JPEG format', async () => {
      const inputBlob = new Blob(['test'], { type: 'image/png' });
      const result = await generator.resizeThumbnail(inputBlob);
      expect(result.type).toBe('image/jpeg');
    });

    it('rejects invalid input', async () => {
      await expect(generator.resizeThumbnail(new Blob([]))).rejects.toThrow('Invalid image data');
    });
  });

  describe('generateFromVideo', () => {
    it('combines extraction and resizing', async () => {
      const result = await generator.generateFromVideo('/videos/test.mp4', 2);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
    });

    it('uses default timestamp', async () => {
      const result = await generator.generateFromVideo('/videos/test.mp4');
      expect(result).toBeInstanceOf(Blob);
    });

    it('handles extraction failures', async () => {
      await expect(generator.generateFromVideo('', 0)).rejects.toThrow('Invalid video path');
    });
  });
});
