import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import path from 'path';

const ORIGINAL_ENV = { ...process.env };

const loadConfig = async (overrides: Record<string, string | undefined>) => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  const { config } = await import('./config');
  return config;
};

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('config', () => {
  it('uses GEMINI_TTS_VOICES when provided', async () => {
    const config = await loadConfig({
      GEMINI_TTS_VOICES: 'VoiceA, VoiceB , ,VoiceC',
      GOOGLE_LOCATION: undefined,
      TV_PATH: undefined,
      OUTPUT_PATH: undefined,
      TEMP_PATH: undefined,
    });

    expect(config.google.ttsVoices).toEqual(['VoiceA', 'VoiceB', 'VoiceC']);
  });

  it('falls back to defaults when env is missing', async () => {
    const config = await loadConfig({
      GEMINI_TTS_VOICES: '',
      GOOGLE_LOCATION: '',
      TV_PATH: '',
      OUTPUT_PATH: '',
      TEMP_PATH: '',
    });

    expect(config.google.ttsVoices.length).toBeGreaterThan(0);
    expect(config.google.ttsVoices).toContain('Achernar');
    expect(config.google.location).toBe('global');
    expect(config.paths.tv).toBe(path.join(process.cwd(), 'TV'));
    expect(config.paths.output).toBe(path.join(process.cwd(), 'output'));
    expect(config.paths.temp).toBe(path.join(process.cwd(), 'temp'));
    expect(config.paths.data).toBe(path.join(process.cwd(), 'data'));
  });
});
