# Track Plan: YouTube Auto-Publish Integration

## Status Notes

- **Created:** 2026-04-23
- **Priority:** High
- **Estimated Duration:** 5 days
- **Dependencies:** pipeline_orchestration_20250403, ai_integration_20250403

## Phase 1: YouTube API Authentication (Day 1)

- [x] Write tests for OAuth2 token storage, retrieval, and refresh
- [x] Implement OAuth2 client module with client ID/secret configuration
- [x] Implement token storage via Tauri `fs` plugin (JSON file in app data dir)
- [x] Implement token refresh flow with automatic retry on 401
- [x] Implement OAuth2 consent redirect using Tauri shell open (system browser)
- [x] Add `youtube.upload` and `youtube.force-ssl` scopes
- [ ] Manual verification: authenticate with a test Google account

## Phase 2: Video Upload Pipeline (Day 2)

- [x] Write tests for resumable upload initiation, chunk upload, and completion (8d53ff3)
- [x] Implement resumable upload client (init → upload → confirm) (8d53ff3)
- [x] Handle upload error responses (4xx abort, 5xx retry) (8d53ff3)
- [x] Implement retry logic with exponential backoff (max 3 retries) (8d53ff3)
- [x] Add upload progress reporting (bytes sent / total) (8d53ff3)
- [x] Integrate with pipeline output to pick up rendered video files
- [ ] Manual verification: upload a test Short to YouTube

## Phase 3: Metadata & Thumbnail Generation (Day 3)

- [ ] Write tests for title, description, tag, and thumbnail generation
- [ ] Implement title template: "5 Things You Didn't Know About [Movie Title]"
- [ ] Implement description generator using AI-sourced facts + hashtags
- [ ] Implement tag generator from movie metadata (genre, year, cast, director)
- [ ] Implement thumbnail extractor: capture frame from Revideo output (t=0 or configurable)
- [ ] Implement thumbnail resize/format conversion (1280x720 JPEG) via FFmpeg
- [ ] Attach metadata and thumbnail to upload request
- [ ] Manual verification: inspect uploaded video metadata on YouTube

## Phase 4: Scheduling System (Day 4)

- [ ] Write tests for scheduler trigger, queue persistence, and window validation
- [ ] Implement upload queue with persistent state (JSON file in app data dir)
- [ ] Implement cron-like scheduler with configurable daily windows (e.g., "0 12 \* \* _", "0 18 _ \* \*")
- [ ] Implement queue item states: pending → uploading → published / failed
- [ ] Implement window validation: respect YouTube quota limits (max 6/day)
- [ ] Implement failed item retry scheduling (next available window)
- [ ] Manual verification: schedule a video and confirm auto-publish

## Phase 5: Integration & Dashboard (Day 5)

- [ ] Write tests for dashboard data queries and status display
- [ ] Implement upload history query (list all items with status/timestamps)
- [ ] Implement queue status view (pending, in-progress, failed)
- [ ] Build dashboard UI component showing queue, history, and next scheduled
- [ ] Integrate scheduler with pipeline orchestration (auto-queue new videos)
- [ ] End-to-end test: movie in library → pipeline → upload → published on YouTube
- [ ] Manual verification: full zero-touch flow from movie scan to YouTube publish

## Success Checklist

- All acceptance criteria from spec met
- Tests pass with >80% coverage for new code
- Code follows style guides (TypeScript, Rust)
- OAuth2 token refresh works transparently
- Upload survives network interruptions via retry
- Scheduling triggers correctly at configured windows
- Dashboard accurately reflects queue and history state
- End-to-end zero-touch publishing verified manually

## Notes

- YouTube API quota is 10,000 units/day by default; each upload costs ~1,600 units
- Resumable uploads are required for files >5 MB (all Shorts will exceed this)
- Privacy status defaults to `public`; user can override per-video or globally
- Consider adding a "review before publish" mode for initial rollout safety
