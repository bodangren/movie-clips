# Track Plan: Revideo Migration

## Status Notes
- **Created:** 2026-04-12
- **Priority:** High
- **Estimated Duration:** 4 days
- **Dependencies:** foundation_20250403, config_state_20250403, ai_integration_20250403
- **Supersedes:** ffmpeg_service_20250403 (partial), pipeline_orchestration_20250403 (architecture)

## Phase 1: Revideo Setup & Integration
- [x] Task: Install Revideo dependencies in the frontend project.
    - [x] Sub-task: Install `@revideo/core`, `@revideo/2d`, `@revideo/ui`, `@revideo/player-react`, `@revideo/renderer`, `@revideo/ffmpeg`, and `@revideo/vite-plugin`.
    - [x] Sub-task: Configure Vite to support Revideo in `vite.config.ts`.
- [x] Task: Scaffold the base Revideo project structure.
    - [x] Sub-task: Create `src/lib/video/revideo` directory.
    - [x] Sub-task: Define the base `makeProject` configuration in `project.ts`.
    ## Phase 2: Template Development ("5 Things")
    - [x] Task: Implement the Intro Sequence.
        - [x] Sub-task: Create `src/lib/video/revideo/scenes/intro.tsx` that loads poster and title.
        - [x] Sub-task: Animate the "5 Things You Didn't Know About [Movie]" title text.
    - [x] Task: Implement the Fact Sequence (Loop).
        - [x] Sub-task: Create `src/lib/video/revideo/scenes/fact.tsx` that loops through facts.
        - [x] Sub-task: Sync the TTS audio duration to the scene length.
        - [x] Sub-task: Play the source video during the fact.
        - [x] Sub-task: Animate the fact text overlay on top of the video.
    - [x] Task: Implement the Outro Sequence.
        - [x] Sub-task: Create `src/lib/video/revideo/scenes/outro.tsx` for call-to-action.

    ## Phase 3: Frontend Preview Integration
    - [x] Task: Integrate the Revideo `<Player />`.
        - [x] Sub-task: Create a new React component `VideoPreview.tsx` in `src/components/pipeline`.
        - [x] Sub-task: Wire the Revideo project to the Player using the `project` prop.
        - [x] Sub-task: Map the Zustand pipeline state (facts, audio paths) to the Player's `variables` prop.

    ## Phase 4: Headless Rendering & Export
    - [x] Task: Implement the final MP4 export mechanism.
        - [x] Sub-task: Create `src/lib/video/render.ts` as a Bun script to handle headless rendering.
        - [x] Sub-task: Create a `render_video` Tauri command in Rust that executes the Bun script and captures progress via stdout.
        - [x] Sub-task: Handle progress callbacks (emitted as Tauri events) to update the frontend.

    ## Phase 5: Cleanup & Deprecation
    - [x] Task: Deprecate legacy Rust FFmpeg commands.
        - [x] Sub-task: Remove `create_title_segment`, `create_image_segment`, and `assemble_video` from `src-tauri/src/commands/video.rs` and `src-tauri/src/lib.rs`.
        - [x] Sub-task: Resolved the FFmpeg `code 69` bug by shifting title generation to Revideo Canvas.
        - [x] Sub-task: Kept `extract_clip` for potential performance optimizations.

## Success Checklist
- [x] Revideo project initialized and configured with Vite.
- [x] Dynamic "5 Things" template implemented with intro, facts loop, and outro.
- [x] Real-time preview available in frontend via `<VideoPreview />`.
- [x] Headless rendering working via Bun script and Tauri command.
- [x] Legacy FFmpeg composition commands removed from Rust backend.
- [x] All Rust compiler warnings resolved.

