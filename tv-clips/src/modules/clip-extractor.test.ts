import { describe, it, expect, vi } from 'vitest';
import { ClipExtractor } from './clip-extractor';

// Mock fluent-ffmpeg
vi.mock('fluent-ffmpeg', () => {
  const m = {
    setStartTime: vi.fn().mockReturnThis(),
    setDuration: vi.fn().mockReturnThis(),
    size: vi.fn().mockReturnThis(),
    videoFilters: vi.fn().mockReturnThis(),
    videoCodec: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    audioChannels: vi.fn().mockReturnThis(),
    audioFrequency: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function(this: any, event: string, handler: any) {
      if (event === 'end') setTimeout(handler, 10);
      return this;
    }),
    save: vi.fn().mockReturnThis(),
  };
  const ffprobe = vi.fn((path: string, callback: (err: Error | null, data: any) => void) => {
    callback(null, {
      streams: [
        { index: 0, codec_type: 'video' },
        { index: 1, codec_type: 'audio', tags: { language: 'eng' } },
      ],
    });
  });
  const ffmpegMock = vi.fn(() => m) as any;
  ffmpegMock.ffprobe = ffprobe;
  return { default: ffmpegMock };
});

describe('ClipExtractor', () => {
  it('should call ffmpeg with correct parameters', async () => {
    const extractor = new ClipExtractor();
    const result = await extractor.extract('movie.mkv', '00:01:00,000', '00:01:10,000', 'out.mp4');
    
    expect(result).toBe('out.mp4');
  });
});
