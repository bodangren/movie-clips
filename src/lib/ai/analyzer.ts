import { generateObject } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { z } from 'zod';
import type { SubtitleEntry, MovieMetadata } from '../subtitle-parser';
import { logger } from '../utils/logger';
import { getConfig } from '../config/service';

const LLM_REQUEST_TIMEOUT_MS = 300000;
const LLM_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 4096;

const factSchema = z.object({
  number: z.number().int(),
  trivia_text: z
    .string()
    .describe('Voiceover text, 20-25 words preferred, never exceed 45 words.'),
  clip_start: z.string(),
  clip_end: z.string(),
  scene_context: z.string(),
});

const analysisSchema = z.object({
  movie_title: z.string(),
  video_title: z.string(),
  video_description: z.string(),
  facts: z.array(factSchema).length(5),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export class LlmAnalyzer {
  private vertexProvider: ReturnType<typeof createVertex> | null = null;

  constructor() {
    const config = getConfig();
    if (config.google.projectId) {
      this.vertexProvider = createVertex({
        project: config.google.projectId,
        location: config.google.location || 'global',
      });
    }
  }

  async analyze(
    metadata: MovieMetadata,
    subtitles: SubtitleEntry[]
  ): Promise<AnalysisResult | null> {
    const config = getConfig();
    logger.info(`Analyzing movie: ${metadata.title} via Gemini 2.5 Flash`);

    if (!this.vertexProvider) {
      logger.error('Gemini Vertex provider not configured. Set GOOGLE_PROJECT_ID.');
      return null;
    }

    const prompt = this.buildPrompt(metadata, subtitles);

    try {
      const result = await this.withTimeout(
        generateObject({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: this.vertexProvider(LLM_MODEL) as any,
          schema: analysisSchema,
          prompt,
          temperature: 0.4,
          topP: 0.9,
          maxTokens: MAX_OUTPUT_TOKENS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
        config.pipeline.timeoutMs || LLM_REQUEST_TIMEOUT_MS
      );

      const object = result.object as AnalysisResult;
      if (object.movie_title !== metadata.title) {
        logger.error(
          `Gemini returned unexpected movie_title: "${object.movie_title}" (expected "${metadata.title}")`
        );
        return null;
      }

      return object;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error during Gemini analysis: ${message}`);
      return null;
    }
  }

  private buildPrompt(metadata: MovieMetadata, subtitles: SubtitleEntry[]): string {
    const subtitleSample = this.serializeSubtitles(subtitles);

    return `
You are a film expert creating content for a "5 Things You Didn't Know" YouTube channel.
Return ONLY valid JSON that matches the response schema. No markdown or extra keys.
The movie_title must be exactly "${metadata.title}".

Analyze the following subtitles from "${metadata.title}" (${metadata.year || 'Unknown Year'}) and identify 5 fascinating trivia moments.

REQUIREMENTS:
1. Each fact must be genuinely surprising or little-known.
2. Connect facts to specific scenes identifiable in the subtitles.
3. Spread selections across the film (beginning, middle, end).
4. Clip timestamps should capture 8-12 seconds of dialogue/action that highlights the trivia.
5. Voiceover text (trivia_text) should be conversational and enthusiastic.
6. Keep each trivia_text to 20-25 words, never exceed 45 words.
7. Provide a video_title that is engaging but DOES NOT mention the movie title or year.
8. Provide a video_description that is engaging, includes a brief call to action, and stays vague about the movie title (do not mention it).

AVOID:
- Plot summaries or obvious observations.
- Facts that require visual-only context.
- Clips with minimal dialogue/dead air.
- Back-to-back scenes (minimum 5 minutes apart).

SUBTITLES (format: start_time | text):
${subtitleSample}
    `;
  }

  private serializeSubtitles(subtitles: SubtitleEntry[]): string {
    return subtitles
      .map((subtitle) => `${subtitle.startTime} | ${subtitle.text}`)
      .join('\n');
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}