# Track Specification: Revideo Migration

## Overview
Migrate the video composition and rendering pipeline from the procedural Rust/FFmpeg command-line approach to a declarative, TypeScript-based approach using Revideo. This migration will enable real-time previews in the Tauri frontend, eliminate complex FFmpeg stitching commands (resolving the known `code 69` error during title segment creation), and provide a more maintainable, code-driven video generation workflow.

## Goals
1. Replace the procedural Rust FFmpeg orchestration with a Revideo TypeScript project.
2. Implement dynamic Revideo templates for the "5 Things You Didn't Know" format.
3. Integrate the Revideo `<Player />` component into the React frontend for real-time previews.
4. Implement server-side/headless rendering of the Revideo project to output the final MP4.
5. Deprecate the complex FFmpeg command services in the Rust backend, retaining only basic FFmpeg utilities if strictly necessary for preprocessing (e.g., extracting highly compressed clips if full movie playback in Canvas is non-performant).

## Acceptance Criteria
- [ ] A Revideo project is initialized within the `src/lib/video` or a dedicated directory.
- [ ] A Revideo template exists that accepts JSON parameters (movie title, facts, timestamps, TTS audio paths, poster image).
- [ ] The template successfully renders the intro sequence using `folder.jpg` and title text.
- [ ] The template successfully sequences the 5 video clips based on timestamps, overlaid with the TTS audio and fact text.
- [ ] The React frontend includes a preview UI using the Revideo `<Player />`.
- [ ] The application can successfully render the final 1:45-2:00 minute vertical video to disk without relying on the legacy `assemble_video` Rust command.
- [ ] The existing `ffmpeg exited with code 69` bug is fundamentally resolved by removing the need for FFmpeg title segment generation.

## Dependencies
- Phase 1 & 2 tracks (Foundation, Config, AI Integration, Library Scanner).
- This track explicitly supersedes and replaces the remaining implementation of Track 3 (Rust FFmpeg Service) and heavily informs the architecture of Track 6 (Pipeline Orchestration).
