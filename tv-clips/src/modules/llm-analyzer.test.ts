import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiMocks = vi.hoisted(() => {
  const generateObject = vi.fn();
  return { generateObject };
});

const vertexMocks = vi.hoisted(() => {
  const provider = vi.fn((model) => ({ model }));
  const createVertex = vi.fn(() => provider);
  return { createVertex, provider };
});

vi.mock('ai', () => ({
  generateObject: aiMocks.generateObject,
}));

vi.mock('@ai-sdk/google-vertex', () => ({
  createVertex: vertexMocks.createVertex,
}));

const buildFacts = () =>
  Array.from({ length: 3 }, (_, index) => ({
    number: index + 1,
    trivia_text: 'This is a punchy trivia line for testing output quality.',
    clip_start: '00:01:00,000',
    clip_end: '00:01:10,000',
    scene_context: 'Short context for the clip.',
  }));

beforeEach(() => {
  vi.resetModules();
  aiMocks.generateObject.mockReset();
  vertexMocks.createVertex.mockClear();
  vertexMocks.provider.mockClear();
  process.env.GOOGLE_API_KEY = 'test-api-key';
  process.env.GOOGLE_PROJECT_ID = 'test-project';
  process.env.GOOGLE_LOCATION = 'us-central1';
});

describe('LlmAnalyzer', () => {
  it('returns structured results for the episode', async () => {
    aiMocks.generateObject.mockResolvedValue({
      object: {
        show_title: 'Test Show',
        episode_title: 'Pilot',
        video_title: 'Three Secrets Hidden in This Episode',
        video_description: 'Watch to uncover hidden details you missed. Drop your favorite moment below.',
        comment_prompt: 'Do you remember what happens right after that line?',
        facts: buildFacts(),
      },
    });

    const { LlmAnalyzer } = await import('./llm-analyzer');
    const analyzer = new LlmAnalyzer();
    const result = await analyzer.analyze(
      { title: 'Test Show', year: 2023, plot: '' },
      { title: 'Pilot', showTitle: 'Test Show', season: 1, episode: 1, year: 2023, plot: '' },
      [
        {
          id: '1',
          startTime: '00:01:00,000',
          endTime: '00:01:05,000',
          startTimeMS: 60000,
          endTimeMS: 65000,
          text: 'Hello world',
        },
      ]
    );

    expect(vertexMocks.createVertex).toHaveBeenCalledWith({
      project: 'test-project',
      location: 'us-central1',
    });
    expect(vertexMocks.provider).toHaveBeenCalledWith('gemini-2.5-flash');
    expect(result).not.toBeNull();
    expect(result?.show_title).toBe('Test Show');
    expect(result?.episode_title).toBe('Pilot');
    expect(result?.video_title).toBeTruthy();
    expect(result?.video_description).toBeTruthy();
    expect(result?.facts).toHaveLength(3);
  });

  it('returns null when show_title mismatches', async () => {
    aiMocks.generateObject.mockResolvedValue({
      object: {
        show_title: 'Wrong Show',
        episode_title: 'Pilot',
        video_title: 'Vague Title',
        video_description: 'Vague description',
        comment_prompt: 'Do you remember what happens next?',
        facts: buildFacts(),
      },
    });

    const { LlmAnalyzer } = await import('./llm-analyzer');
    const analyzer = new LlmAnalyzer();
    const result = await analyzer.analyze(
      { title: 'Test Show', year: 2023, plot: '' },
      { title: 'Pilot', showTitle: 'Test Show', season: 1, episode: 1, year: 2023, plot: '' },
      [
        {
          id: '1',
          startTime: '00:01:00,000',
          endTime: '00:01:05,000',
          startTimeMS: 60000,
          endTimeMS: 65000,
          text: 'Hello world',
        },
      ]
    );

    expect(result).toBeNull();
  });

  it('includes full subtitle entries in the prompt', async () => {
    aiMocks.generateObject.mockResolvedValue({
      object: {
        show_title: 'Test Show',
        episode_title: 'Pilot',
        video_title: 'Three Secrets Hidden in This Episode',
        video_description: 'Watch to uncover hidden details you missed. Drop your favorite moment below.',
        comment_prompt: 'Do you remember what happens right after that line?',
        facts: buildFacts(),
      },
    });

    const { LlmAnalyzer } = await import('./llm-analyzer');
    const analyzer = new LlmAnalyzer();

    const subtitles = Array.from({ length: 3 }, (_, index) => ({
      id: `${index}`,
      startTime: `00:00:0${index},000`,
      endTime: `00:00:0${index},500`,
      startTimeMS: index * 1000,
      endTimeMS: index * 1000 + 500,
      text: `Line ${index} ` + 'a'.repeat(200),
    }));

    await analyzer.analyze(
      { title: 'Test Show', year: 2023, plot: '' },
      { title: 'Pilot', showTitle: 'Test Show', season: 1, episode: 1, year: 2023, plot: '' },
      subtitles
    );

    const request = aiMocks.generateObject.mock.calls[0]?.[0];
    const prompt = request?.prompt as string;
    const match = prompt.match(/SUBTITLES \(format: start_time \| text\):\n([\s\S]*)/);
    expect(match).toBeTruthy();

    const subtitleSection = (match?.[1] ?? '').trim();
    expect(subtitleSection.split('\n')).toHaveLength(3);
    expect(subtitleSection).toContain('a'.repeat(200));
  });

  it('returns null when Gemini request times out', async () => {
    vi.useFakeTimers();
    aiMocks.generateObject.mockReturnValue(new Promise(() => {}));

    const { LlmAnalyzer } = await import('./llm-analyzer');
    const analyzer = new LlmAnalyzer();

    const analyzePromise = analyzer.analyze(
      { title: 'Test Show', year: 2023, plot: '' },
      { title: 'Pilot', showTitle: 'Test Show', season: 1, episode: 1, year: 2023, plot: '' },
      [
        {
          id: '1',
          startTime: '00:01:00,000',
          endTime: '00:01:05,000',
          startTimeMS: 60000,
          endTimeMS: 65000,
          text: 'Hello world',
        },
      ]
    );

    await vi.advanceTimersByTimeAsync(300000);
    await expect(analyzePromise).resolves.toBeNull();
    vi.useRealTimers();
  });
});
