# Track Plan: Core Video Generation Pipeline (MVP)

## Phase 1: Project Scaffolding & Configuration
- [x] Task: Initialize project structure (package.json, tsconfig.json, dir structure)
    - [x] Sub-task: Create `package.json` with dependencies (`@google/generative-ai`, `fluent-ffmpeg`, `xml2js`, etc.)
    - [x] Sub-task: Create `tsconfig.json`
    - [x] Sub-task: Create directory structure (`src/`, `data/`, `output/`, `temp/`, `logs/`)
- [x] Task: Implement Configuration Module
    - [x] Sub-task: Create `src/config.ts` to manage env vars (API keys, paths)
    - [x] Sub-task: Create `src/utils/logger.ts` for structured logging
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding & Configuration' (Protocol in workflow.md)

## Phase 2: Movie Selection & Metadata
- [ ] Task: Implement Movie Scanner
    - [ ] Sub-task: Write tests for `MovieSelector` (mocking filesystem)
    - [ ] Sub-task: Implement `src/modules/movie-selector.ts` to scan `Movies/` (or configured path)
- [ ] Task: Implement NFO Parser
    - [ ] Sub-task: Write tests for `NfoParser` (using sample XML)
    - [ ] Sub-task: Implement `src/modules/nfo-parser.ts` to read `movie.nfo`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Movie Selection & Metadata' (Protocol in workflow.md)

## Phase 3: Content Analysis (Gemini)
- [ ] Task: Implement Subtitle Parser
    - [ ] Sub-task: Write tests for `.srt` parsing logic
    - [ ] Sub-task: Implement `src/modules/subtitle-parser.ts` (SRT -> JSON)
- [ ] Task: Implement Gemini Client
    - [ ] Sub-task: Create `src/modules/llm-analyzer.ts` with prompt engineering for 5 facts
    - [ ] Sub-task: Integration test with a dummy subtitle file
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Content Analysis (Gemini)' (Protocol in workflow.md)

## Phase 4: Asset Generation (TTS & Images)
- [ ] Task: Implement TTS Generator
    - [ ] Sub-task: Implement `src/modules/tts-generator.ts` using Google Cloud TTS
    - [ ] Sub-task: Unit test to verify audio file creation
- [ ] Task: Implement Title Card Generator
    - [ ] Sub-task: Implement `src/modules/title-card.ts` (start with simple FFmpeg text overlay or HTML->Image)
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Asset Generation (TTS & Images)' (Protocol in workflow.md)

## Phase 5: Video Assembly (FFmpeg)
- [ ] Task: Implement Clip Extractor
    - [ ] Sub-task: Implement `src/modules/clip-extractor.ts` to cut segments based on timestamps
- [ ] Task: Implement Video Assembler
    - [ ] Sub-task: Implement `src/modules/video-assembler.ts` to concat parts
    - [ ] Sub-task: Add logic to resize/crop to 9:16 vertical format
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Video Assembly (FFmpeg)' (Protocol in workflow.md)

## Phase 6: Orchestration & CLI
- [ ] Task: Create Main Entry Point
    - [ ] Sub-task: Implement `src/index.ts` to tie all modules together
- [ ] Task: Manual Run Verification
    - [ ] Sub-task: Run the full pipeline on a sample movie from `Movies/`
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Orchestration & CLI' (Protocol in workflow.md)
