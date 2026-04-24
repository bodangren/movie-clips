import type { AppConfig } from './schema';

export function getDefaultConfig(): AppConfig {
  const isDev = import.meta.env.DEV;

  return {
    version: 1,
    paths: {
      movies: isDev ? './Movies' : '',
      tv: isDev ? './tv-clips' : '',
      output: isDev ? './output' : '',
      temp: isDev ? './temp' : '',
    },
    google: {
      location: 'global',
      ttsVoices: [],
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
    youtube: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: 'http://localhost:8080/callback',
    },
    ui: {
      theme: 'system',
      language: 'en',
    },
  };
}
