import { describe, it, expect } from 'vitest';
import { getDefaultConfig } from '@/lib/config/defaults';
import type { AppConfig } from '@/lib/config/schema';

describe('getDefaultConfig', () => {
  it('should return a valid config object with all required fields', () => {
    const config = getDefaultConfig();
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('paths');
    expect(config).toHaveProperty('google');
    expect(config).toHaveProperty('video');
    expect(config).toHaveProperty('pipeline');
    expect(config).toHaveProperty('ui');
  });

  it('should have correct default video settings', () => {
    const config = getDefaultConfig();
    expect(config.video.targetWidth).toBe(720);
    expect(config.video.targetHeight).toBe(1280);
    expect(config.video.fps).toBe(30);
  });

  it('should have correct default pipeline settings', () => {
    const config = getDefaultConfig();
    expect(config.pipeline.maxRetries).toBe(3);
    expect(config.pipeline.timeoutMs).toBe(300000);
  });

  it('should have correct default UI settings', () => {
    const config = getDefaultConfig();
    expect(config.ui.theme).toBe('system');
    expect(config.ui.language).toBe('en');
  });

  it('should have correct default google settings', () => {
    const config = getDefaultConfig();
    expect(config.google.location).toBe('global');
    expect(config.google.ttsVoices).toEqual([]);
  });

  it('should have empty string paths in production', () => {
    const config = getDefaultConfig();
    expect(typeof config.paths.movies).toBe('string');
    expect(typeof config.paths.tv).toBe('string');
    expect(typeof config.paths.output).toBe('string');
    expect(typeof config.paths.temp).toBe('string');
  });

  it('should return version 1', () => {
    const config = getDefaultConfig();
    expect(config.version).toBe(1);
  });

  it('should return an object matching AppConfig type structure', () => {
    const config: AppConfig = getDefaultConfig();
    expect(config.paths).toBeDefined();
    expect(config.google).toBeDefined();
    expect(config.video).toBeDefined();
    expect(config.pipeline).toBeDefined();
    expect(config.ui).toBeDefined();
  });
});
