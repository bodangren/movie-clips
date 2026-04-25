# Project Agent Notes

## Measure Workflow

All development runs through the **Measure** spec-driven development framework exclusively. At the start of every session:

1. Load the `measure` skill
2. Read `measure/index.md` to understand the project context
3. Follow the workflow defined in `measure/workflow.md`

Key reference files:
- `measure/tracks.md` — Active work registry
- `measure/tracks/<track_id>/plan.md` — Task checklist
- `measure/product.md` — Product vision
- `measure/tech-stack.md` — Technology choices
- `measure/lessons-learned.md` — Project memory
- `measure/tech-debt.md` — Known shortcuts

Never start significant work without an active track. Always update `measure/tracks.md` and the current track's `plan.md` before and after work.


## Project Type
- Tauri 2.x desktop app with React 19 frontend, Bun runtime, Vite 8 build tool
- Old Node.js CLI implementation archived in `backup-old/`
- Refactored 2025-04-03: see `measure/tech-stack.md` for full stack details

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
- Next: Phase 2 (TypeScript config, Tailwind, hot reload) in `measure/tracks/foundation_20250403/plan.md`.
- Known issue from old codebase: FFmpeg title segment creation (`ffmpeg exited with code 69`) — to be addressed in FFmpeg Service track.


## Key Commands
- `bun run dev` — Vite dev server
- `bun run tauri dev` — Full Tauri app with hot reload
- `bun run build` — Frontend production build
- `bun run tauri build` — Full Tauri production build
