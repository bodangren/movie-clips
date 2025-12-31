import { describe, it, expect, vi } from 'vitest';
import fs from 'fs-extra';
import { NfoParser } from './nfo-parser';

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NfoParser', () => {
  const sampleNfo = `
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<movie>
  <title>Bad Boys</title>
  <year>1995</year>
  <plot>Two hip detectives protect a witness...</plot>
  <tmdbid>9737</tmdbid>
  <id>tt0112442</id>
</movie>
  `;

  it('should parse NFO content correctly', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(sampleNfo as never);
    
    const parser = new NfoParser();
    const meta = await parser.parse('movie.nfo');

    expect(meta).not.toBeNull();
    expect(meta?.title).toBe('Bad Boys');
    expect(meta?.year).toBe(1995);
    expect(meta?.tmdbId).toBe('9737');
    expect(meta?.imdbId).toBe('tt0112442');
  });

  it('should return null on invalid XML', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('invalid xml' as never);
    const parser = new NfoParser();
    const meta = await parser.parse('movie.nfo');
    expect(meta).toBeNull();
  });
});
