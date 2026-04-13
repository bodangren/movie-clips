import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtitleParser } from './subtitle-parser';

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    default: { ...actual },
    ...actual,
    readFile: vi.fn().mockResolvedValue(''),
  };
});

describe('SubtitleParser', () => {
  let parser: SubtitleParser;

  beforeEach(() => {
    parser = new SubtitleParser();
    vi.clearAllMocks();
  });

  describe('parse', () => {
    it('should parse standard SRT format', async () => {
      const { readFile } = await import('fs/promises');

      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Hello, world!

2
00:00:05,000 --> 00:00:08,500
This is a test subtitle.
`;

      vi.mocked(readFile).mockResolvedValue(srtContent);

      const result = await parser.parse('test.srt');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].text).toBe('Hello, world!');
      expect(result[0].startTimeMS).toBe(1000);
      expect(result[0].endTimeMS).toBe(4000);
      expect(result[1].text).toBe('This is a test subtitle.');
    });

    it('should handle multi-line subtitles', async () => {
      const { readFile } = await import('fs/promises');

      const srtContent = `1
00:00:01,000 --> 00:00:04,000
Line 1
Line 2
Line 3
`;

      vi.mocked(readFile).mockResolvedValue(srtContent);

      const result = await parser.parse('test.srt');

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should strip HTML tags from subtitles', async () => {
      const { readFile } = await import('fs/promises');

      const srtContent = `1
00:00:01,000 --> 00:00:04,000
<i>Italic text</i> and <b>bold</b>
`;

      vi.mocked(readFile).mockResolvedValue(srtContent);

      const result = await parser.parse('test.srt');

      expect(result[0].text).toBe('Italic text and bold');
    });

    it('should return empty array on file read error', async () => {
      const { readFile } = await import('fs/promises');
      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));

      const result = await parser.parse('nonexistent.srt');

      expect(result).toEqual([]);
    });
  });
});
