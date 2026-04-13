import { describe, it, expect } from 'vitest';
import { configSchema } from '@/lib/config/schema';

describe('configSchema', () => {
  it('should accept valid config with all fields', () => {
    const validConfig = {
      version: 1,
      paths: {
        movies: '/home/movies',
        tv: '/home/tv',
        output: '/home/output',
        temp: '/home/temp',
      },
      google: {
        apiKey: 'test-key',
        projectId: 'test-project',
        location: 'us-central1',
        ttsVoices: ['voice-1', 'voice-2'],
      },
      video: {
        targetWidth: 720,
        targetHeight: 1280,
        fps: 30,
      },
      pipeline: {
        maxRetries: 3,
        timeoutMs: 300000,
      },
      ui: {
        theme: 'dark' as const,
        language: 'en',
      },
    };

    const result = configSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should apply defaults when fields are missing', () => {
    const partialConfig = {};
    const result = configSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paths.movies).toBe('');
      expect(result.data.video.targetWidth).toBe(720);
      expect(result.data.video.targetHeight).toBe(1280);
      expect(result.data.video.fps).toBe(30);
      expect(result.data.pipeline.maxRetries).toBe(3);
      expect(result.data.pipeline.timeoutMs).toBe(300000);
      expect(result.data.ui.theme).toBe('system');
      expect(result.data.ui.language).toBe('en');
      expect(result.data.google.location).toBe('global');
    }
  });

  it('should reject invalid video dimensions', () => {
    const invalidConfig = {
      video: {
        targetWidth: 100,
        targetHeight: 50,
        fps: 30,
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject invalid fps values', () => {
    const invalidConfig = {
      video: {
        targetWidth: 720,
        targetHeight: 1280,
        fps: 200,
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject invalid maxRetries', () => {
    const invalidConfig = {
      pipeline: {
        maxRetries: -1,
        timeoutMs: 300000,
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject invalid timeoutMs', () => {
    const invalidConfig = {
      pipeline: {
        maxRetries: 3,
        timeoutMs: 500,
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject invalid theme values', () => {
    const invalidConfig = {
      ui: {
        theme: 'blue',
        language: 'en',
      },
    };

    const result = configSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should accept empty optional google fields', () => {
    const config = {
      google: {},
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.google.apiKey).toBeUndefined();
      expect(result.data.google.projectId).toBeUndefined();
    }
  });

  it('should accept empty ttsVoices array', () => {
    const config = {
      google: {
        ttsVoices: [],
      },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should set version to 1 by default', () => {
    const result = configSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
    }
  });
});
