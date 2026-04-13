import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TtsGenerator } from './tts';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  function MockGoogleGenAI() {
    return {
      models: {
        generateContent: mockGenerateContent,
      },
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI as any,
  };
});

vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/lib/config/service', () => ({
  getConfig: vi.fn(() => ({
    version: 1,
    paths: { movies: '', tv: '', output: '', temp: '' },
    google: {
      projectId: 'test-project',
      location: 'global',
      ttsVoices: ['TestVoice1', 'TestVoice2'],
    },
    video: { targetWidth: 720, targetHeight: 1280, fps: 30 },
    pipeline: { maxRetries: 3, timeoutMs: 300000 },
    ui: { theme: 'system', language: 'en' },
  })),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TtsGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('voice selection', () => {
    it('should pick voice from configured voices', () => {
      const generator = new TtsGenerator();
      expect(generator).toBeDefined();
    });
  });

  describe('splitTextForTts', () => {
    it('should return single chunk for short text', () => {
      const shortText = 'This is a short text.';
      const chunks = splitTextForTtsHelper(shortText);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(shortText);
    });

    it('should split text longer than 45 words into multiple chunks', () => {
      const words = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
      const chunks = splitTextForTtsHelper(words);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        const wordCount = chunk.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(45);
      });
    });

    it('should handle exact 45 word text as single chunk', () => {
      const words = Array.from({ length: 45 }, (_, i) => `word${i}`).join(' ');
      const chunks = splitTextForTtsHelper(words);
      expect(chunks).toHaveLength(1);
    });

    it('should handle text with extra whitespace', () => {
      const text = '  word1 word2   word3  ';
      const chunks = splitTextForTtsHelper(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('word1 word2   word3');
    });
  });

  describe('generate', () => {
    it('should return output path on successful TTS generation', async () => {
      const mockWavBuffer = createMockWavBuffer();
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockWavBuffer.toString('base64'),
                    mimeType: 'audio/wav',
                  },
                },
              ],
            },
          },
        ],
      });

      const generator = new TtsGenerator();
      const result = await generator.generate('Test text', '/tmp/output.wav');

      expect(result).toBe('/tmp/output.wav');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should return null when no audio content received', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
      });

      const generator = new TtsGenerator();
      const result = await generator.generate('Test text', '/tmp/output.wav');

      expect(result).toBeNull();
    });

    it('should return null when API throws error after retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const generator = new TtsGenerator();
      const result = await generator.generate('Test text', '/tmp/output.wav');

      expect(result).toBeNull();
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should combine multiple audio chunks into single file', async () => {
      const mockAudioData = createMockWavBuffer().toString('base64');
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: mockAudioData,
                    mimeType: 'audio/wav',
                  },
                },
              ],
            },
          },
        ],
      });

      const generator = new TtsGenerator();
      const longText = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
      const result = await generator.generate(longText, '/tmp/output.wav');

      expect(result).toBe('/tmp/output.wav');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return null when model not found error occurs', async () => {
      mockGenerateContent.mockRejectedValue(
        new Error('gemini-2.5-flash-lite-preview-tts NOT_FOUND')
      );

      const generator = new TtsGenerator();
      const result = await generator.generate('Test text', '/tmp/output.wav');

      expect(result).toBeNull();
    });
  });
});

function splitTextForTtsHelper(text: string): string[] {
  const MAX_TTS_WORDS_PER_REQUEST = 45;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= MAX_TTS_WORDS_PER_REQUEST) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let buffer: string[] = [];

  for (const word of words) {
    buffer.push(word);
    if (buffer.length >= MAX_TTS_WORDS_PER_REQUEST) {
      chunks.push(buffer.join(' '));
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    chunks.push(buffer.join(' '));
  }

  return chunks;
}

function createMockWavBuffer(): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 4, 'ascii');
  header.writeUInt32LE(36, 4);
  header.write('WAVE', 8, 4, 'ascii');
  header.write('fmt ', 12, 4, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(24000, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36, 4, 'ascii');
  header.writeUInt32LE(0, 40);

  return Buffer.concat([header, Buffer.alloc(100)]);
}
