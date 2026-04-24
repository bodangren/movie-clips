import { z } from 'zod';

const defaultPaths = { movies: '', tv: '', output: '', temp: '' };
const defaultGoogle = { location: 'global', ttsVoices: [] };
const defaultVideo = { targetWidth: 720, targetHeight: 1280, fps: 30 };
const defaultPipeline = { maxRetries: 3, timeoutMs: 300000 };
const defaultUi = { theme: 'system' as const, language: 'en' };

const pathsSchema = z.object({
  movies: z.string().default(''),
  tv: z.string().default(''),
  output: z.string().default(''),
  temp: z.string().default(''),
});

const googleSchema = z.object({
  apiKey: z.string().optional(),
  projectId: z.string().optional(),
  location: z.string().default('global'),
  ttsVoices: z.array(z.string()).default([]),
});

const videoSchema = z.object({
  targetWidth: z.number().min(360).max(3840).default(720),
  targetHeight: z.number().min(640).max(2160).default(1280),
  fps: z.number().min(1).max(120).default(30),
  encoder: z.enum(['auto', 'nvenc', 'vaapi', 'videotoolbox', 'software']).default('auto'),
  preset: z.enum(['fast', 'balanced', 'slow']).default('balanced'),
});

const pipelineSchema = z.object({
  maxRetries: z.number().min(0).max(10).default(3),
  timeoutMs: z.number().min(1000).max(600000).default(300000),
});

const uiSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
});

const defaultYouTube = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  redirectUri: 'http://localhost:8080/callback',
};

const youtubeSchema = z.object({
  enabled: z.boolean().default(false),
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  redirectUri: z.string().default('http://localhost:8080/callback'),
});

export const configSchema = z.object({
  version: z.number().default(1),
  paths: z.preprocess(val => val ?? {}, pathsSchema).default(defaultPaths),
  google: z.preprocess(val => val ?? {}, googleSchema).default(defaultGoogle),
  video: z.preprocess(val => val ?? {}, videoSchema).default(defaultVideo),
  pipeline: z.preprocess(val => val ?? {}, pipelineSchema).default(defaultPipeline),
  youtube: z.preprocess(val => val ?? {}, youtubeSchema).default(defaultYouTube),
  ui: z.preprocess(val => val ?? {}, uiSchema).default(defaultUi),
});

export type AppConfig = z.infer<typeof configSchema>;
