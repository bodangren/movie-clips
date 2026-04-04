# Project Agent Notes

## Project Type
- Tauri 2.x desktop app with React 19 frontend, Bun runtime, Vite 8 build tool
- Old Node.js CLI implementation archived in `backup-old/`
- Refactored 2025-04-03: see `conductor/tech-stack.md` for full stack details

## TTS Migration
- Use Gemini TTS with model `gemini-2.5-flash-lite-preview-tts`.
- Pick a random voice per video from `GEMINI_TTS_VOICES` (comma-separated).
- TTS is handled via `@google/genai` (not `@google-cloud/text-to-speech`).
- Default voice list lives in `src/config.ts` if `GEMINI_TTS_VOICES` is unset.

## AI/LLM Integration
- LLM analyzer uses Vercel AI SDK `generateObject` with `@ai-sdk/google-vertex`.
- Vertex API key auth is NOT supported; uses project/location + ADC (OAuth/service account).

## Current Status
- Foundation track (Phase 1) is in progress — env setup, project init, Bun config complete.
- Next: Phase 2 (TypeScript config, Tailwind, hot reload) in `conductor/tracks/foundation_20250403/plan.md`.
- Known issue from old codebase: FFmpeg title segment creation (`ffmpeg exited with code 69`) — to be addressed in FFmpeg Service track.

## Conductor
- Track status: see `conductor/tracks.md`
- Current active track: Foundation & Setup (`foundation_20250403`)
- All 10 tracks defined with specs, plans, and metadata

## Key Commands
- `bun run dev` — Vite dev server
- `bun run tauri dev` — Full Tauri app with hot reload
- `bun run build` — Frontend production build
- `bun run tauri build` — Full Tauri production build
