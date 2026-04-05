import { z } from "zod";

export const configSchema = z.object({
  version: z.number().default(1),
  paths: z.object({
    movies: z.string().default(""),
    tv: z.string().default(""),
    output: z.string().default(""),
    temp: z.string().default(""),
  }),
  google: z.object({
    apiKey: z.string().optional(),
    projectId: z.string().optional(),
    location: z.string().default("global"),
    ttsVoices: z.array(z.string()).default([]),
  }),
  video: z.object({
    targetWidth: z.number().min(360).max(3840).default(720),
    targetHeight: z.number().min(640).max(2160).default(1280),
    fps: z.number().min(1).max(120).default(30),
  }),
  pipeline: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    timeoutMs: z.number().min(1000).max(600000).default(300000),
  }),
  ui: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    language: z.string().default("en"),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;
