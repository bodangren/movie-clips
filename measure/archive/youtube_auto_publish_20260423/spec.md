# Track Specification: YouTube Auto-Publish Integration

## Overview

Fully automated YouTube Shorts publishing via the YouTube Data API v3. Enables the core "twice-daily zero-touch publishing" vision by handling authentication, upload, metadata injection, thumbnail attachment, and scheduled publishing — all without human intervention.

## Goals

1. YouTube Data API v3 OAuth2 authentication with token refresh
2. Automated video upload with resumable upload support
3. Metadata generation from movie data (title, description, tags, category)
4. Thumbnail generation and attachment from video frames
5. Scheduled publishing windows (two daily slots)
6. Upload queue with retry logic and failure notifications
7. Upload status monitoring and dashboard reporting

## Acceptance Criteria

- [ ] OAuth2 flow with client ID/secret, token storage, and automatic refresh
- [ ] Resumable video upload supporting files up to 256 MB
- [ ] Title template: "5 Things You Didn't Know About [Movie Title]"
- [ ] Description auto-generated from AI-sourced facts with hashtags
- [ ] Tags auto-generated from movie metadata (genre, year, cast, director)
- [ ] Thumbnail extracted from video composition (first 5 seconds or best frame)
- [ ] Scheduled publishing with configurable daily windows (e.g., 12:00 UTC and 18:00 UTC)
- [ ] Upload queue persisted to disk; survives app restart
- [ ] Retry on transient failures (network, 5xx) with exponential backoff (max 3 retries)
- [ ] Permanent failure flagged in dashboard with error details
- [ ] Dashboard shows upload history, scheduled items, and queue status
- [ ] Privacy status configurable (public, unlisted, private) with default public
- [ ] Compliance with YouTube API quota limits (daily upload cap awareness)

## Technical Details

- **API:** YouTube Data API v3 (`googleapis.com/youtube/v3`)
- **Auth:** OAuth2 with `youtube.upload` and `youtube.force-ssl` scopes
- **Upload:** Resumable upload protocol via `POST /upload/youtube/v3/videos`
- **Storage:** OAuth tokens and queue state persisted via Tauri `fs` plugin
- **Scheduling:** Cron-like scheduler in Bun, triggers upload at configured windows
- **Quota:** Track daily quota usage; YouTube allows ~6 uploads/day for unverified apps

## Dependencies

Pipeline Orchestration (video output), AI Integration (fact generation for metadata)
