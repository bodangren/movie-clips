# Movie Clips

Tauri 2.x desktop app with React 19 frontend for generating movie/TV clips with AI analysis and TTS.

## Features

- **Media Library Scanner** - Automatically detect and index movies/TV shows from your collection
- **AI-Powered Analysis** - Gemini-powered scene detection and clip selection
- **Text-to-Speech Generation** - Custom TTS voices for narration using Gemini TTS
- **Revideo Composition** - Professional video composition with smooth transitions
- **Pipeline Monitoring** - Real-time progress tracking through the generation pipeline
- **Configurable Settings** - Customize AI providers, TTS voices, and processing options

## Tech Stack

- **Runtime:** Bun (preferred) / npm (fallback)
- **Frontend:** React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Build:** Vite 8
- **Backend:** Rust (Tauri 2.x)
- **Testing:** Vitest (TypeScript) + cargo test (Rust)
- **AI:** Google Gemini via Vercel AI SDK + Vertex AI
- **Video:** Revideo (FFmpeg-based composition)

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- Rust toolchain (rustup)
- System dependencies: `librsvg2-dev` (Linux), Xcode CLI tools (macOS), WebView2 (Windows)

### Installation

```bash
# Install dependencies
npm install

# Or with Bun
bun install
```

### Development

```bash
# Frontend only (Vite dev server)
npm run dev

# Full Tauri app with hot reload
npm run tauri dev
```

### Testing

```bash
# Run all TypeScript tests
npm test

# Watch mode
npm run test:watch

# Run Rust tests
cd src-tauri && cargo test

# E2E tests (requires dev server)
npm run test:e2e
```

### Building

```bash
# Frontend production build
npm run build

# Full Tauri production build
npm run tauri build
```

## Project Structure

```
├── src/                    # React frontend (TypeScript)
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   ├── index.css           # Tailwind CSS import
│   ├── App.css             # Component styles
│   ├── components/         # UI components
│   │   ├── layout/         # Layout components (MainLayout, Sidebar)
│   │   ├── library/        # Media library components
│   │   ├── pipeline/       # Pipeline monitor components
│   │   └── config/         # Settings components
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Core libraries (pipeline, AI, scanner)
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands and app logic
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── conductor/              # Project management (Conductor)
│   └── tracks/             # Track plans and specs
├── e2e/                    # Playwright E2E tests
└── package.json            # Project configuration
```

## Application Pages

1. **Dashboard** - Overview of pipeline status and library stats
2. **Media Library** - Browse and filter indexed movies/TV shows
3. **Pipeline** - Monitor active video generation tasks
4. **Live Preview** - Real-time preview of video composition
5. **Settings** - Configure AI providers, TTS voices, and app preferences

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Library    │────▶│    AI       │────▶│  Pipeline   │
│  Scanner    │     │  Analyzer   │     │  Orchestrator│
└─────────────┘     │  + TTS Gen  │     └──────┬──────┘
                    └─────────────┘            │
                         │                     ▼
                         ▼              ┌─────────────┐
                   ┌─────────────┐      │   Revideo   │
                   │   Config    │      │  Renderer   │
                   └─────────────┘      └─────────────┘
```

## Troubleshooting

- **Tauri dev fails:** Install `librsvg2-dev` (Linux) or equivalent system dependency
- **Bun unavailable:** Use `npm install` as fallback (bun.sh may be unreachable)
- **Tailwind warnings:** LightningCSS `@theme` warnings are non-blocking upstream issues
- **Tests fail:** Ensure all dependencies are installed with `npm install`
- **E2E tests timeout:** Start dev server with `npm run dev` before running E2E tests
