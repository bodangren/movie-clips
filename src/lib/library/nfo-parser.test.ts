import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('fs/promises', () => {
  const mockReadFile = vi.fn().mockResolvedValue('');
  return {
    default: { readFile: mockReadFile },
    readFile: mockReadFile,
  };
});

import { NfoParser } from './nfo-parser';
import { readFile } from 'fs/promises';

describe('NfoParser', () => {
  beforeEach(() => {
    vi.mocked(readFile).mockReset();
  });

  it('should parse valid movie NFO', async () => {
    const sampleNfo = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<movie>
  <title>Bad Boys</title>
  <year>1995</year>
  <plot>Two hip detectives protect a witness...</plot>
  <tmdbid>9737</tmdbid>
  <id>tt0112442</id>
</movie>`;

    vi.mocked(readFile).mockResolvedValue(sampleNfo);

    const parser = new NfoParser();
    const result = await parser.parse('movie.nfo');

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Bad Boys');
    expect(result?.year).toBe(1995);
    expect(result?.plot).toBe('Two hip detectives protect a witness...');
    expect(result?.tmdbId).toBe('9737');
    expect(result?.imdbId).toBe('tt0112442');
  });

  it('should return null on invalid XML', async () => {
    vi.mocked(readFile).mockResolvedValue('invalid xml');

    const parser = new NfoParser();
    const result = await parser.parse('bad.nfo');

    expect(result).toBeNull();
  });

  it('should handle missing title', async () => {
    vi.mocked(readFile).mockResolvedValue('<movie><year>1995</year></movie>');

    const parser = new NfoParser();
    const result = await parser.parse('no-title.nfo');

    expect(result).toBeNull();
  });

  it('should handle minimal NFO', async () => {
    vi.mocked(readFile).mockResolvedValue('<movie><title>Minimal</title></movie>');

    const parser = new NfoParser();
    const result = await parser.parse('minimal.nfo');

    expect(result).not.toBeNull();
    expect(result?.title).toBe('Minimal');
    expect(result?.year).toBe(0);
    expect(result?.plot).toBe('');
  });
});
