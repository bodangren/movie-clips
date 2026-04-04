# Track Plan: Core Video Generation Pipeline (MVP)

## Status Notes (2025-12-29)
- Code for phases 1–6 exists and unit tests pass locally.
- Manual verification tasks for each phase have **not** been completed.
- Workflow-required commits and git notes have **not** been created yet.
- LLM analyzer rewritten to use Vercel AI SDK `generateObject` + `@ai-sdk/google-vertex`.
- Vertex auth now relies on project/location (API key not supported for Vertex).
- Pipeline proceeds to TTS/title card but fails on FFmpeg title segment creation (code 69).

## Phase 1: Project Scaffolding & Configuration
- [x] Task: Initialize project structure (package.json, tsconfig.json, dir structure)
    - [x] Sub-task: Create `package.json` with dependencies (`@google/generative-ai`, `fluent-ffmpeg`, `xml2js`, etc.)
    - [x] Sub-task: Create `tsconfig.json`
    - [x] Sub-task: Create directory structure (`src/`, `data/`, `output/`, `temp/`, `logs/`)
- [x] Task: Implement Configuration Module
    - [x] Sub-task: Create `src/config.ts` to manage env vars (API keys, paths)
    - [x] Sub-task: Create `src/utils/logger.ts` for structured logging
- [~] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding & Configuration' (Protocol in workflow.md)

## Phase 2: Movie Selection & Metadata
- [x] Task: Implement Movie Scanner
    - [x] Sub-task: Write tests for `MovieSelector` (mocking filesystem)
    - [x] Sub-task: Implement `src/modules/movie-selector.ts` to scan `Movies/` (or configured path)
- [x] Task: Implement NFO Parser
    - [x] Sub-task: Write tests for `NfoParser` (using sample XML)
    - [x] Sub-task: Implement `src/modules/nfo-parser.ts` to read `movie.nfo`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Movie Selection & Metadata' (Protocol in workflow.md)

## Phase 3: Content Analysis (Gemini)
- [x] Task: Implement Subtitle Parser
    - [x] Sub-task: Write tests for `.srt` parsing logic
    - [x] Sub-task: Implement `src/modules/subtitle-parser.ts` (SRT -> JSON)
- [x] Task: Implement Gemini Client
    - [x] Sub-task: Create `src/modules/llm-analyzer.ts` with prompt engineering for 5 facts (18-24 words per fact)
    - [x] Sub-task: Integration test with a dummy subtitle file
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Content Analysis (Gemini)' (Protocol in workflow.md)

## Phase 4: Asset Generation (TTS & Images)
- [x] Task: Implement TTS Generator
    - [x] Sub-task: Implement `src/modules/tts-generator.ts` using Gemini TTS (`gemini-2.5-flash-lite-preview-tts`)
    - [x] Sub-task: Randomly choose one of the available Gemini TTS voices per video
    - [x] Sub-task: Unit test to verify audio file creation
- [x] Task: Implement Title Card Generator
    - [x] Sub-task: Implement `src/modules/title-card.ts` (start with simple FFmpeg text overlay or HTML->Image)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Asset Generation (TTS & Images)' (Protocol in workflow.md)

## Phase 5: Video Assembly (FFmpeg)
- [x] Task: Implement Clip Extractor
    - [x] Sub-task: Implement `src/modules/clip-extractor.ts` to cut segments based on timestamps
- [x] Task: Implement Video Assembler
    - [x] Sub-task: Implement `src/modules/video-assembler.ts` to concat parts
    - [x] Sub-task: Add logic to resize/crop to 9:16 vertical format
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Video Assembly (FFmpeg)' (Protocol in workflow.md)

## Phase 6: Orchestration & CLI
- [x] Task: Create Main Entry Point
    - [x] Sub-task: Implement `src/index.ts` to tie all modules together
- [ ] Task: Manual Run Verification
    - [ ] Sub-task: Run the full pipeline on a sample movie from `Movies/`
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Orchestration & CLI' (Protocol in workflow.md)
