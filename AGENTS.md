# Project Agent Notes

## TTS Migration
- Use Gemini TTS with model `gemini-2.5-flash-lite-preview-tts`.
- Pick a random voice per video from `GEMINI_TTS_VOICES` (comma-separated).
- TTS is handled via `@google/genai` (not `@google-cloud/text-to-speech`).
- Default voice list lives in `src/config.ts` if `GEMINI_TTS_VOICES` is unset.

## Current Status (handoff)
- LLM analyzer was rewritten to use Vercel AI SDK `generateObject` with `@ai-sdk/google-vertex`.
- Vertex API key auth is NOT supported; uses project/location + ADC (OAuth/service account).
- `npm start` now reaches TTS + title card, but fails at FFmpeg title segment creation (`ffmpeg exited with code 69: Conversion failed`).
- Next task: inspect and fix title segment FFmpeg command (likely in title card/video assembly flow).
