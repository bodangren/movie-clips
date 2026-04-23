# Architecture Documentation

## Overview

Movie Clips is a desktop application for automatically generating video clips from movies and TV shows. It uses a Tauri 2.x architecture with a Rust backend and React 19 frontend.

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Backend**: Tauri 2.x (Rust) for native operations
- **Runtime**: Bun (with npm fallback)
- **Video Processing**: Revideo (FFmpeg-based composition)
- **AI/LLM**: Google Vertex AI (Gemini models) for content analysis and TTS
- **State Management**: Zustand
- **Testing**: Vitest (unit), Playwright (E2E)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Library   │  │   Pipeline   │  │   Settings/UI    │   │
│  │   Browser   │  │   Monitor    │  │                  │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼─────────┐   │
│  │              Zustand Store (State)                    │   │
│  └────────────────────────┬─────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────┘
                            │ Tauri Commands
┌───────────────────────────▼─────────────────────────────────┐
│                     Rust Backend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  FFmpeg     │  │   File       │  │   Config         │   │
│  │  Service    │  │   System     │  │   Management     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Library Scanning Flow

1. **Scanner** walks the configured media directories (movies/TV)
2. **NFO Parser** extracts metadata from `.nfo` files
3. **Subtitle Parser** extracts dialogue from `.srt`/`.vtt` files
4. Results are stored in the **Library Store** as `MediaItem[]`

### Video Generation Pipeline

1. **Select Stage**: Choose a media item from the library
2. **Analyze Stage**: Use Gemini AI to analyze content and select interesting facts
3. **Generate Stage**: Generate narration script and TTS audio
4. **Process Stage**: Extract video segments using FFmpeg
5. **Render Stage**: Compose final video with Revideo (intro, facts, outro)

### Error Recovery

The pipeline uses a checkpoint system:

- Each stage saves progress to a checkpoint file
- On failure, the pipeline can resume from the last checkpoint
- Stages define optional `rollback()` methods for cleanup

## Key Components

### Frontend Components

- **MediaCard**: Displays movie/TV show with poster and metadata
- **MediaGrid**: Responsive grid layout for browsing library
- **PipelineMonitor**: Real-time progress display with logs
- **SettingsPanel**: Configuration form with validation
- **ErrorBoundary**: Catches React rendering errors

### Services (Frontend)

- **LibraryService**: Scans directories, parses metadata
- **PipelineService**: Orchestrates video generation stages
- **AIService**: Communicates with Vertex AI for analysis/TTS
- **ConfigService**: Loads/saves application configuration

### Rust Backend

- **FFmpeg Commands**: Executes video processing via shell commands
- **File Operations**: Secure file system access through Tauri APIs

## Configuration

Configuration is managed via `config.ts` with Zod schema validation:

```typescript
interface AppConfig {
  version: number;
  paths: {
    movies: string;
    tv: string;
    output: string;
    temp: string;
  };
  google: {
    location: string;
    ttsVoices: string[];
    apiKey?: string;
    projectId?: string;
  };
  video: {
    outputFormat: string;
    resolution: string;
    fps: number;
  };
  pipeline: {
    maxRetries: number;
    timeoutMs: number;
    concurrentJobs: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
  };
}
```

## State Management

Zustand stores:

- **configStore**: Application configuration
- **libraryStore**: Media library items and scan status
- **pipelineStore**: Pipeline execution state and progress
- **uiStore**: UI state (theme, sidebar, modals)

## Testing Strategy

- **Unit Tests**: Vitest for utilities, parsers, services
- **Component Tests**: React Testing Library for UI components
- **E2E Tests**: Playwright for critical user flows
- **Target Coverage**: >80% for new code

## Security Considerations

- Tauri CSP configured for frontend security
- File system access restricted to configured directories
- API keys stored in config (not committed to repo)
- No unsafe Rust code

## Performance Considerations

- Revideo bundle is ~793KB (228KB gzipped) - inherent to library
- Video processing is CPU-intensive; runs in background
- Library scanning is batched to avoid UI blocking
- Images are lazy-loaded in MediaGrid

## Future Enhancements

- GPU-accelerated video encoding (NVENC/VAAPI)
- YouTube auto-publish integration
- Batch processing multiple videos
- Scheduled pipeline execution
