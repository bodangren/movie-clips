import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, saveConfig, resetConfig, validateConfig } from '@/lib/config/service';
import { getDefaultConfig } from '@/lib/config/defaults';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('config service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateConfig', () => {
    it('should return valid true for valid config', () => {
      const validConfig = {
        version: 1,
        paths: { movies: '/movies', tv: '/tv', output: '/out', temp: '/tmp' },
        google: { location: 'global', ttsVoices: [] },
        video: { targetWidth: 720, targetHeight: 1280, fps: 30 },
        pipeline: { maxRetries: 3, timeoutMs: 300000 },
        ui: { theme: 'system' as const, language: 'en' },
      };

      const result = validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return valid false for invalid config', () => {
      const invalidConfig = {
        video: { targetWidth: 100, targetHeight: 50, fps: 30 },
      };

      const result = validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return valid false for empty input', () => {
      const result = validateConfig({});
      expect(result.valid).toBe(true);
      expect(result.config).toBeDefined();
    });

    it('should return errors array with descriptive messages', () => {
      const invalidConfig = {
        pipeline: { maxRetries: -5, timeoutMs: 100 },
      };

      const result = validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('maxRetries') || e.includes('timeoutMs'))).toBe(
        true
      );
    });
  });

  describe('loadConfig', () => {
    it('should return validated config from Tauri invoke', async () => {
      const mockConfig = {
        version: 1,
        paths: { movies: '/movies', tv: '/tv', output: '/out', temp: '/tmp' },
        google: { location: 'global', ttsVoices: [] },
        video: { targetWidth: 1920, targetHeight: 1080, fps: 60 },
        pipeline: { maxRetries: 5, timeoutMs: 60000 },
        ui: { theme: 'dark' as const, language: 'es' },
      };

      vi.mocked(invoke).mockResolvedValue(mockConfig);

      const result = await loadConfig();
      expect(invoke).toHaveBeenCalledWith('get_config');
      expect(result.video.targetWidth).toBe(1920);
      expect(result.ui.language).toBe('es');
    });

    it('should return defaults when Tauri invoke fails', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Tauri not available'));

      const result = await loadConfig();
      const defaults = getDefaultConfig();
      expect(result.video.targetWidth).toBe(defaults.video.targetWidth);
    });

    it('should return defaults when config validation fails', async () => {
      vi.mocked(invoke).mockResolvedValue({ video: { targetWidth: 100 } });

      const result = await loadConfig();
      const defaults = getDefaultConfig();
      expect(result.video.targetWidth).toBe(defaults.video.targetWidth);
    });
  });

  describe('saveConfig', () => {
    it('should call Tauri invoke with validated config', async () => {
      const config = getDefaultConfig();
      vi.mocked(invoke).mockResolvedValue(undefined);

      await saveConfig(config);
      expect(invoke).toHaveBeenCalledWith('save_config', { config: expect.any(Object) });
    });
  });

  describe('resetConfig', () => {
    it('should save defaults and return them', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const result = await resetConfig();
      const defaults = getDefaultConfig();
      expect(result.version).toBe(defaults.version);
      expect(result.video.targetWidth).toBe(defaults.video.targetWidth);
      expect(invoke).toHaveBeenCalledWith('save_config', { config: expect.any(Object) });
    });
  });
});
