import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { MovieSelector } from './movie-selector';

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MovieSelector', () => {
  const mockLibraryPath = '/mock/movies';

  it('should find a valid movie folder', async () => {
    vi.spyOn(fs, 'pathExists').mockResolvedValue(true as never);
    vi.spyOn(fs, 'readdir').mockImplementation(async (dir: string) => {
      if (dir === mockLibraryPath) return ['Bad Boys (1995)'] as any;
      if (dir === path.join(mockLibraryPath, 'Bad Boys (1995)')) {
        return ['movie.nfo', 'movie.mkv', 'movie.en.srt', 'folder.jpg'] as any;
      }
      return [] as any;
    });
    vi.spyOn(fs, 'stat').mockImplementation(async (p: string) => {
      if (p === path.join(mockLibraryPath, 'Bad Boys (1995)')) {
        return { isDirectory: () => true } as any;
      }
      return { isDirectory: () => false, size: 1000 } as any;
    });

    const selector = new MovieSelector(mockLibraryPath);
    const movies = await selector.scan();

    expect(movies).toHaveLength(1);
    expect(movies[0].title).toBe('Bad Boys (1995)');
    expect(movies[0].videoPath).toContain('movie.mkv');
  });

  it('should return empty if library path does not exist', async () => {
    vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
    const selector = new MovieSelector(mockLibraryPath);
    const movies = await selector.scan();
    expect(movies).toHaveLength(0);
  });
});
