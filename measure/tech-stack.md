# Technology Stack

> Updated 2025-04-03: Refactored from Node.js CLI to Bun+Tauri desktop application.

## Core Technologies
- **Desktop Framework:** Tauri 2.x (Rust backend + web frontend)
- **Frontend Language:** JavaScript/JSX (React 19) — will migrate to TypeScript in Track 2
- **Frontend Framework:** React 19 with Vite 8
- **Backend Language:** Rust (Tauri) + TypeScript/JS (Bun runtime for AI/LLM logic)
- **Runtime:** Bun (package manager & script runner), Rust (native backend)
- **Build Tool:** Vite 8 + Tauri CLI

## AI & Cloud Services
- **LLM Analysis:** Google Gemini 2.5 Flash (via `@ai-sdk/google-vertex` with Vercel AI SDK `generateObject`)
- **Text-to-Speech:** Gemini TTS (`gemini-2.5-flash-lite-preview-tts` via `@google/genai`, random voice per video)
- **Video Platform:** YouTube Data API v3 (via `googleapis`) — future track

## Media Processing
- **Video Engine:** FFmpeg
  - **Track 3:** Rust FFmpeg bindings (`ffmpeg-next` crate) or `std::process::Command` fallback
  - Previous: `fluent-ffmpeg` (Node.js, archived in `backup-old/`)
- **Image Processing:** `puppeteer` or `sharp` (to be evaluated in Track 3)

## Data & Metadata
- **Metadata Parsing:** NFO parser (to be implemented in Rust for Track 5)
- **Subtitle Parsing:** SRT parser (to be implemented in Track 5)
- **Previous:** `xml2js`, `srt-parser-2` (archived in `backup-old/`)

## State Management
- **Configuration:** Zod schema validation (planned for Track 2)
- **State:** Zustand (planned for Track 2)
- **Forms:** React Hook Form with Zod integration (planned for Track 2)
- **Persistence:** Tauri store API (planned for Track 2)

## Infrastructure
- **Package Manager:** Bun
- **Scheduling:** TBD (Track 10 - Advanced Features)
- **Logging:** TBD (Track 2 - Configuration & State)

## Testing
- **Frontend:** Vitest (planned for Track 8)
- **Backend:** Rust built-in testing (planned for Track 8)
- **E2E:** Playwright (planned for Track 8)

## Styling
- **CSS Framework:** Tailwind CSS (planned for Track 2)
- **Previous:** None (Node.js CLI)
