import type { AppConfig } from './schema';

const PROJECT_ROOT = '/home/daniel-bo/Desktop/movie-clips';

export function getDefaultConfig(): AppConfig {
  const isDev = import.meta.env.DEV;

  return {
    version: 1,
    paths: {
      movies: isDev ? `${PROJECT_ROOT}/Movies` : '',
      tv: isDev ? `${PROJECT_ROOT}/tv-clips` : '',
      output: isDev ? `${PROJECT_ROOT}/output` : '',
      temp: isDev ? `${PROJECT_ROOT}/temp` : '',
    },
    google: {
      location: 'global',
      ttsVoices: [],
    },
    video: {
      targetWidth: 720,
      targetHeight: 1280,
      fps: 30,
      encoder: 'auto',
      preset: 'balanced',
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
