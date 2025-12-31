import { generateObject } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { z } from 'zod';
import { config } from '../config';
import { logger } from '../utils/logger';
import { SubtitleEntry } from './subtitle-parser';
import { EpisodeMetadata, TvShowMetadata } from './tv-nfo-parser';

const LLM_REQUEST_TIMEOUT_MS = 300000;
const LLM_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 4096;

const factSchema = z.object({
  number: z.number().int(),
  trivia_text: z
    .string()
    .describe('Voiceover text, 35-40 words preferred, never exceed 45 words.'),
  clip_start: z.string(),
  clip_end: z.string(),
  scene_context: z.string(),
});

const analysisSchema = z.object({
  show_title: z.string(),
  episode_title: z.string(),
  video_title: z.string(),
  video_description: z.string(),
  comment_prompt: z.string(),
  facts: z.array(factSchema).length(3),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

export class LlmAnalyzer {
  private vertexProvider: ReturnType<typeof createVertex>;

  constructor() {
    this.vertexProvider = createVertex({
      project: config.google.projectId || undefined,
      location: config.google.location || undefined,
    });
  }

  async analyze(
    show: TvShowMetadata,
    episode: EpisodeMetadata,
    subtitles: SubtitleEntry[]
  ): Promise<AnalysisResult | null> {
    logger.info(`Analyzing episode: ${episode.title} via Gemini 2.5 Flash`);

    const prompt = this.buildPrompt(show, episode, subtitles);

    try {
      const result = await this.withTimeout(
        generateObject({
          model: this.vertexProvider(LLM_MODEL) as any,
          schema: analysisSchema,
          prompt,
          temperature: 0.4,
          topP: 0.9,
          maxTokens: MAX_OUTPUT_TOKENS,
        } as any),
        LLM_REQUEST_TIMEOUT_MS
      );

      const object = result.object as AnalysisResult;
      if (object.show_title !== show.title) {
        logger.error(
          `Gemini returned unexpected show_title: "${object.show_title}" (expected "${show.title}")`
        );
        return null;
      }
      if (object.episode_title !== episode.title) {
        logger.error(
          `Gemini returned unexpected episode_title: "${object.episode_title}" (expected "${episode.title}")`
        );
        return null;
      }

      return object;
    } catch (error: any) {
      logger.error(`Error during Gemini analysis: ${error.message}`);
      return null;
    }
  }

  private buildPrompt(
    show: TvShowMetadata,
    episode: EpisodeMetadata,
    subtitles: SubtitleEntry[]
  ): string {
    const subtitleSample = this.serializeSubtitles(subtitles);

    return `
You are a TV expert creating content for a "3 Things You Didn't Know" YouTube channel.
Return ONLY valid JSON that matches the response schema. No markdown or extra keys.
The show_title must be exactly "${show.title}".
The episode_title must be exactly "${episode.title}".

Analyze the following subtitles from "${show.title}" - "${episode.title}" (Season ${episode.season}, Episode ${episode.episode}) and identify 3 fascinating trivia moments.

REQUIREMENTS:
1. Each fact must be genuinely surprising or little-known.
2. Connect facts to specific scenes identifiable in the subtitles.
3. Spread selections across the episode (beginning, middle, end).
4. Clip timestamps should capture 8-12 seconds of dialogue/action that highlights the trivia.
5. Voiceover text (trivia_text) should be conversational and enthusiastic.
6. Keep each trivia_text to 35-40 words, never exceed 45 words.
7. Provide a video_title that is engaging but DOES NOT mention the show or episode title.
8. Provide a video_description that is engaging, includes a brief call to action, and stays vague about the show (do not mention it).
9. Provide a comment_prompt that is a single sentence question tied to a specific moment in the episode.

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
