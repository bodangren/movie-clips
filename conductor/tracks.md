# Project Tracks

This file tracks all major tracks for the project. Each track has its own detailed plan in its respective folder.

---

## Bun + Tauri Refactor Tracks (2025-04-03)

### Phase 1: Foundation

- **[x] Track: Foundation & Setup**  
  _Link: [./conductor/tracks/foundation_20250403/](./conductor/tracks/foundation_20250403/)_  
  Initialize Bun+Tauri project with development environment. Critical path. **COMPLETED 2026-04-05**

- **[x] Track: Configuration & State Management**  
  _Link: [./conductor/tracks/config_state_20250403/](./conductor/tracks/config_state_20250403/)_  
  Implement config schema, persistence, and React state management. Depends on Foundation. **COMPLETED 2026-04-05**

- **[x] Track: Rust FFmpeg Service**  
  _Link: [./conductor/tracks/ffmpeg_service_20250403/](./conductor/tracks/ffmpeg_service_20250403/)_  
  Native video processing with FFmpeg command execution. Depends on Foundation. **SUBSTANTIALLY COMPLETE 2026-04-09**  
  Note: Command-based implementation complete. Bindings deferred. Frontend layer pending.

- **[x] Track: AI/LLM Integration**  
  _Link: [./conductor/tracks/ai_integration_20250403/](./conductor/tracks/ai_integration_20250403/)_  
  Gemini analyzer and TTS generator in Bun. Depends on Configuration. **COMPLETED 2026-04-10**

### Phase 2: Core Features

- **[x] Track: Revideo Migration**  
  _Link: [./conductor/archive/revideo_migration_20260412/](./conductor/archive/revideo_migration_20260412/)_  
  Replace complex FFmpeg commands with Revideo composition. Supersedes FFmpeg track. **COMPLETED 2026-04-12** (ARCHIVED)
- **[x] Track: Media Library Scanner**  
  _Link: [./conductor/tracks/library_scanner_20250403/](./conductor/tracks/library_scanner_20250403/)_  
  Movie/TV detection, NFO parsing, subtitle parsing. Depends on Configuration & AI. **COMPLETED 2026-04-10**

- **[x] Track: Pipeline Orchestration**  
  _Link: [./conductor/tracks/pipeline_orchestration_20250403/](./conductor/tracks/pipeline_orchestration_20250403/)_  
  End-to-end video generation with error recovery. Depends on FFmpeg, AI, Library. **COMPLETED 2026-04-11**

- **[x] Track: Core UI Components**  
  _Link: [./conductor/tracks/ui_components_20250403/](./conductor/tracks/ui_components_20250403/)_  
  React UI with dashboard, library browser, pipeline monitor. Depends on Configuration & Pipeline.

### Phase 3: Polish & Release

- **[x] Track: Testing & Quality**
  _Link: [./conductor/tracks/testing_quality_20250403/](./conductor/tracks/testing_quality_20250403/)_
  Comprehensive testing suite and CI/CD. Depends on all previous tracks. **COMPLETED 2026-04-15**

- **[x] Track: Polish & Deployment**
  _Link: [./conductor/tracks/polish_deployment_20250403/](./conductor/tracks/polish_deployment_20250403/)_
  Final polish, documentation, and deployment. Depends on all previous tracks. **COMPLETED 2026-04-23** (automated tasks; manual verification pending)

### Phase 4: Advanced (Optional)

- **[ ] Track: Advanced Features**  
  _Link: [./conductor/tracks/advanced_features_20250403/](./conductor/tracks/advanced_features_20250403/)_  
  Batch processing, GPU acceleration, scheduling. Depends on Pipeline & UI.

### Phase 5: Automation & Performance (2026-04-23)

- **[~] Track: YouTube Auto-Publish Integration**  
  _Link: [./conductor/tracks/youtube_auto_publish_20260423/](./conductor/tracks/youtube_auto_publish_20260423/)_  
  YouTube Data API v3 OAuth2, resumable upload, metadata/thumbnail generation, scheduled publishing, upload queue with retry. Enables twice-daily zero-touch publishing. Depends on Pipeline & AI. **IN PROGRESS**

- **[ ] Track: GPU-Accelerated Video Encoding**  
  _Link: [./conductor/tracks/gpu_video_encoding_20260423/](./conductor/tracks/gpu_video_encoding_20260423/)_  
  GPU detection (NVENC, VAAPI, VideoToolbox), FFmpeg hardware encoder selection, quality presets, benchmarking, automatic software fallback. Depends on FFmpeg Service & Pipeline.

---

## Previous Tracks

### Archived Tracks

#### Core Video Generation Pipeline (2025-12-29) - ARCHIVED

- **[x] Track: Core Video Generation Pipeline (MVP)**  
  _Link: [./conductor/archive/core_pipeline_20251229/](./conductor/archive/core_pipeline_20251229/)_  
  Original Node.js implementation. Archived - replaced by Bun+Tauri refactor.

---

## Track Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[-]` - Blocked
- `[!]` - Needs attention

## Dependency Graph

```
Foundation → Config → AI
    ↓           ↓
  FFmpeg    → Library
      ↘       ↙
      Pipeline → UI
          ↓
      Testing → Polish
          ↙
    Advanced (optional)
```

## Implementation Order

1. **Foundation & Setup** (critical path start)
2. **Configuration & State Management** (after Foundation)
3. **Rust FFmpeg Service** & **AI/LLM Integration** (parallel after Config)
4. **Media Library Scanner** (after AI)
5. **Pipeline Orchestration** (after FFmpeg, AI, Library)
6. **Core UI Components** (after Pipeline)
7. **Testing & Quality** (after all core tracks)
8. **Polish & Deployment** (final)
9. **Advanced Features** (optional, after core completion)

## Timeline Estimate

- **Phase 1 (Foundation):** 10 days (Tracks 1-4)
- **Phase 2 (Core Features):** 8 days (Tracks 5-7)
- **Phase 3 (Polish & Release):** 5 days (Tracks 8-9)
- **Phase 4 (Advanced):** 4 days (Track 10 - optional)
- **Total:** ~27 developer days

## Notes

- Tracks marked with `[~]` are currently active
- Dependencies must be respected for successful implementation
- Each track has detailed spec and plan in its directory
- Regular status updates should be added to track plan files
