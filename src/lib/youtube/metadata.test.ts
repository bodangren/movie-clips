import { describe, it, expect } from 'vitest';
import {
  generateYouTubeTitle,
  generateYouTubeDescription,
  generateYouTubeTags,
  type MetadataInput,
} from './metadata';
import type { MediaItem } from '../pipeline/types';

describe('YouTube Metadata Generation', () => {
  function createMockMediaItem(overrides: Partial<MediaItem> = {}): MediaItem {
    return {
      type: 'movie',
      path: '/movies/test.mp4',
      name: 'Test Movie',
      metadata: {
        title: 'The Matrix',
        year: 1999,
        genre: ['Action', 'Sci-Fi'],
        director: 'The Wachowskis',
        cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'],
        plot: 'A computer hacker learns about the true nature of reality.',
      },
      subtitlePaths: [],
      posterPath: '/posters/matrix.jpg',
      ...overrides,
    };
  }

  function createMockInput(overrides: Partial<MetadataInput> = {}): MetadataInput {
    return {
      mediaItem: createMockMediaItem(),
      analysis: {
        facts: [
          {
            id: '1',
            text: 'The iconic bullet time effect was created using 120 cameras.',
            importance: 0.95,
          },
          { id: '2', text: 'Keanu Reeves trained for 4 months in martial arts.', importance: 0.9 },
          { id: '3', text: 'The code rain uses Japanese katakana characters.', importance: 0.85 },
          { id: '4', text: 'The film influenced countless action movies.', importance: 0.8 },
          { id: '5', text: 'It won 4 Academy Awards.', importance: 0.75 },
        ],
        summary: 'A groundbreaking sci-fi action film.',
        suggestedClips: [],
      },
      ...overrides,
    };
  }

  describe('generateYouTubeTitle', () => {
    it('uses template with movie title', () => {
      const input = createMockInput();
      const title = generateYouTubeTitle(input);

      expect(title).toBe("5 Things You Didn't Know About The Matrix");
    });

    it('uses fallback when movie has no title', () => {
      const input = createMockInput();
      input.mediaItem = createMockMediaItem({
        metadata: {
          title: '',
          year: 0,
          genre: [],
          director: '',
          cast: [],
          plot: '',
        },
      });

      const title = generateYouTubeTitle(input);
      expect(title).toBe("5 Things You Didn't Know About Test Movie");
    });

    it('handles TV show titles', () => {
      const input = createMockInput();
      input.mediaItem = {
        type: 'tvshow',
        path: '/tv/breaking-bad',
        name: 'Breaking Bad',
        metadata: {
          title: 'Breaking Bad',
          year: 2008,
          genre: ['Drama', 'Crime'],
          director: '',
          cast: ['Bryan Cranston', 'Aaron Paul'],
          plot: 'A high school chemistry teacher turned meth cook.',
        },
      };

      const title = generateYouTubeTitle(input);
      expect(title).toBe("5 Things You Didn't Know About Breaking Bad");
    });

    it('handles episode titles', () => {
      const input = createMockInput();
      input.mediaItem = {
        type: 'episode',
        path: '/tv/game-of-thrones/s01e01.mkv',
        name: 'Winter Is Coming',
        parentShow: 'Game of Thrones',
        season: 1,
        episodeNumber: 1,
        metadata: {
          title: 'Game of Thrones',
          year: 2011,
          genre: ['Fantasy', 'Drama'],
          director: '',
          cast: ['Emilia Clarke', 'Kit Harington'],
          plot: 'Noble families fight for control of the Iron Throne.',
        },
        subtitlePaths: [],
      };

      const title = generateYouTubeTitle(input);
      expect(title).toBe("5 Things You Didn't Know About Game of Thrones - S1E1");
    });

    it('truncates long titles to 100 characters', () => {
      const input = createMockInput();
      input.mediaItem = createMockMediaItem({
        metadata: {
          title:
            'This Is an Extremely Long Movie Title That Goes On and On Forever and Ever Without Any End in Sight',
          year: 2023,
          genre: [],
          director: '',
          cast: [],
          plot: '',
        },
      });

      const title = generateYouTubeTitle(input);
      expect(title.length).toBeLessThanOrEqual(100);
    });
  });

  describe('generateYouTubeDescription', () => {
    it('includes summary', () => {
      const input = createMockInput();
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('A groundbreaking sci-fi action film.');
    });

    it('includes numbered facts', () => {
      const input = createMockInput();
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('Did you know?');
      expect(desc).toContain('1. The iconic bullet time effect');
      expect(desc).toContain('2. Keanu Reeves trained');
      expect(desc).toContain('5. It won 4 Academy Awards.');
    });

    it('limits to top 5 facts by importance', () => {
      const input = createMockInput();
      input.analysis!.facts = [
        ...input.analysis!.facts,
        { id: '6', text: 'Sixth fact', importance: 0.7 },
        { id: '7', text: 'Seventh fact', importance: 0.65 },
      ];

      const desc = generateYouTubeDescription(input);
      const factMatches = desc.match(/^\d+\./gm);
      expect(factMatches?.length).toBe(5);
    });

    it('sorts facts by importance', () => {
      const input = createMockInput();
      input.analysis!.facts = [
        { id: '1', text: 'Low importance', importance: 0.5 },
        { id: '2', text: 'High importance', importance: 0.95 },
      ];

      const desc = generateYouTubeDescription(input);
      const lines = desc.split('\n');
      const fact1Index = lines.findIndex(l => l.includes('High importance'));
      const fact2Index = lines.findIndex(l => l.includes('Low importance'));

      expect(fact1Index).toBeLessThan(fact2Index);
    });

    it('includes cast and director', () => {
      const input = createMockInput();
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('Starring: Keanu Reeves');
      expect(desc).toContain('Director: The Wachowskis');
    });

    it('includes year', () => {
      const input = createMockInput();
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('Year: 1999');
    });

    it('includes hashtags', () => {
      const input = createMockInput();
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('#TheMatrix');
      expect(desc).toContain('#MovieFacts');
      expect(desc).toContain('#Shorts');
    });

    it('handles missing analysis gracefully', () => {
      const input = createMockInput({ analysis: null });
      const desc = generateYouTubeDescription(input);

      expect(desc).toContain('Starring: Keanu Reeves');
      expect(desc).toContain('#MovieFacts');
    });

    it('handles missing metadata gracefully', () => {
      const input = createMockInput();
      input.mediaItem = createMockMediaItem({
        metadata: {
          title: 'Unknown',
          year: 0,
          genre: [],
          director: '',
          cast: [],
          plot: '',
        },
      });

      const desc = generateYouTubeDescription(input);
      expect(desc).toContain('#MovieFacts');
    });
  });

  describe('generateYouTubeTags', () => {
    it('includes title words', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('matrix');
    });

    it('includes genres', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('action');
      expect(tags).toContain('sci-fi');
    });

    it('includes year', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('1999');
    });

    it('includes cast members', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('keanu reeves');
    });

    it('includes director', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('the wachowskis');
    });

    it('limits to 15 tags', () => {
      const input = createMockInput();
      input.mediaItem = createMockMediaItem({
        metadata: {
          title: 'A Very Long Title With Many Words For Testing',
          year: 2023,
          genre: ['Action', 'Adventure', 'Sci-Fi', 'Fantasy', 'Drama', 'Comedy'],
          director: 'Director Name',
          cast: ['Actor One', 'Actor Two', 'Actor Three', 'Actor Four', 'Actor Five'],
          plot: '',
        },
      });

      const tags = generateYouTubeTags(input);
      expect(tags.length).toBeLessThanOrEqual(15);
    });

    it('removes duplicates', () => {
      const input = createMockInput();
      input.mediaItem = createMockMediaItem({
        metadata: {
          title: 'Action Action',
          year: 2023,
          genre: ['Action'],
          director: '',
          cast: [],
          plot: '',
        },
      });

      const tags = generateYouTubeTags(input);
      const actionCount = tags.filter(t => t === 'action').length;
      expect(actionCount).toBe(1);
    });

    it('includes default tags', () => {
      const input = createMockInput();
      const tags = generateYouTubeTags(input);

      expect(tags).toContain('movie clips');
      expect(tags).toContain('movie facts');
      expect(tags).toContain('shorts');
    });
  });
});
