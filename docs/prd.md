# Product Requirements Document
## "5 Things You Didn't Know About..." Automated YouTube Channel

**Version:** 1.1 (Gemini + Google Cloud Adjusted)
**Author:** Daniel
**Date:** December 2024
**Status:** Draft

---

## 1. Executive Summary

An automated system that generates and publishes "5 Things You Didn't Know About [Movie]" videos twice daily. The system analyzes movie subtitle files to identify interesting moments, generates trivia voiceovers, extracts relevant clips, and stitches together polished short-form content for YouTube.

### 1.1 Goals

- Fully automated video generation requiring no manual intervention
- Consistent output quality suitable for YouTube publication
- Sustainable content pipeline leveraging a library of ~1000 movies
- Twice-daily publishing schedule via cron
- **Google Ecosystem Integration:** Utilization of Gemini 3.0 Pro/Flash and Google Cloud TTS.

### 1.2 Non-Goals

- Live streaming or real-time content
- Multi-language support (English only for v1)
- Monetization integration (deferred due to copyright considerations)
- Mobile app or web interface

---

## 2. Background & Motivation

Short-form movie trivia content performs well on YouTube. With access to a personal library of movies with standard media server assets (video, subtitles, NFO metadata), there's an opportunity to automate this.

The subtitle files provide raw material for LLM analysis. `movie.nfo` files provide accurate metadata.

---

## 3. User Stories

| As a... | I want to... | So that... |
|---------|--------------|------------|
| Channel operator | Run the system on a schedule | Videos publish without manual work |
| Channel operator | Have videos auto-uploaded to YouTube | I don't need to manually upload files |
| Channel operator | Utilize existing NFO metadata | I don't need to rely on external APIs for basic info |
| Viewer | Watch engaging movie trivia | I learn something new in under 2 minutes |

---

## 4. System Architecture

### 4.1 High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CRON TRIGGER (2x daily)                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         1. MOVIE SELECTION                            │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Movie Library  │───▶│  Read .nfo      │───▶│  Usage Tracker  │  │
│  │   (folder scan) │    │  (local meta)   │    │ (SQLite/JSON)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Selected movie + assets
┌──────────────────────────────────────────────────────────────────────┐
│                       2. CONTENT ANALYSIS (Gemini)                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Parse .srt to  │───▶│  Gemini 3.0 Pro/│───▶│  Structured     │  │
│  │  JSON w/ times  │    │  Flash API      │    │  Output (JSON)  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ 5x {trivia_text, clip_start, clip_end}
┌──────────────────────────────────────────────────────────────────────┐
│                       3. ASSET GENERATION                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Title Card     │    │  Google Cloud   │    │  Clip Extraction│  │
│  │  (local images) │    │  TTS (WaveNet)  │    │  (FFmpeg)       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ 5x title.mp4 + 5x clip.mp4
┌──────────────────────────────────────────────────────────────────────┐
│                       4. VIDEO ASSEMBLY                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Intro Card     │───▶│  Concat 5 pairs │───▶│  Add Outro/     │  │
│  │  (movie title)  │    │  (title→clip)   │    │  Subscribe CTA  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ final_video.mp4
┌──────────────────────────────────────────────────────────────────────┐
│                       5. OUTPUT & UPLOAD                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Save to output │───▶│  Generate meta  │───▶│  YouTube API    │  │
│  │  directory      │    │  (from Gemini)  │    │  (OAuth Token)  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Directory Structure

```
5-things-youtube/
├── src/
│   ├── index.ts                 # Main orchestrator
│   ├── config.ts                # Environment & settings
│   ├── modules/
│   │   ├── movie-selector.ts    # Picks next movie, parses NFO
│   │   ├── subtitle-parser.ts   # .srt → structured JSON
│   │   ├── llm-analyzer.ts      # Gemini API integration
│   │   ├── tts-generator.ts     # Google Cloud TTS
│   │   ├── title-card.ts        # Image generation using local assets
│   │   ├── clip-extractor.ts    # FFmpeg clip extraction
│   │   ├── video-assembler.ts   # Final video stitching
│   │   └── youtube-uploader.ts  # YouTube Data API upload
│   ├── utils/
│   │   ├── ffmpeg.ts            # FFmpeg wrapper utilities
│   │   ├── logger.ts            # Structured logging
│   │   └── timing.ts            # Time format conversions
├── data/
│   ├── movies.json              # Movie library index (optional cache)
│   ├── usage-history.json       # Tracks processed movies
├── output/
│   └── [date]/                  # Daily output folders
├── temp/                        # Working directory (cleared each run)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. Detailed Component Specifications

### 5.1 Movie Selection Module

**Purpose:** Scan library directories for `movie.nfo` files and select the next candidate.

**Logic:**
1. Recursively scan configured library path.
2. Identify folders containing `movie.nfo` + video file + `.srt`.
3. Parse `movie.nfo` to get title, year, IMDb ID.
4. Filter out movies in `usage-history.json`.
5. Select movie (Random or sequentially).

### 5.3 LLM Analyzer Module (Gemini)

**Provider:** Google Gen AI (Gemini 3.0 Pro or Flash)
**Prompting:** Same structure as before, but optimized for Gemini's context window.

### 5.4 TTS Generator Module (Google)

**Provider:** Google Cloud Text-to-Speech API
**Configuration:**
- Voice: standard-en-US-Neural2-J (or similar high-quality)
- Encoding: MP3

### 5.8 YouTube Uploader Module

**Purpose:** Authenticated upload.
**Auth:** OAuth 2.0 flow. (Requires initial manual token generation, then refresh tokens).
**Inputs:** Video file, Title, Description, Tags (generated by Gemini).

---

## 7. Configuration

### 7.1 Environment Variables

```bash
# Paths
MOVIE_LIBRARY_PATH=/media/movies
OUTPUT_PATH=./output
TEMP_PATH=./temp

# API Keys
GOOGLE_API_KEY=AIza...             # For Gemini
GOOGLE_APPLICATION_CREDENTIALS=... # For TTS / Cloud Auth

# YouTube Auth
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
```