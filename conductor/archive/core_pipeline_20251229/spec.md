# Track Specification: Core Video Generation Pipeline (MVP)

## Objective
To build the end-to-end automated pipeline that processes a selected movie from the local `Movies/` directory, extracts 5 interesting facts using Gemini, generates voiceovers via Google Cloud TTS, and assembles a vertical YouTube Short using FFmpeg.

## Core Features
1.  **Movie Selection:** Scan the `Movies/` directory for `movie.nfo`, video files, and `.srt` subtitles.
2.  **Metadata Parsing:** Extract title, year, and plot from `movie.nfo`.
3.  **Content Analysis:** Use Gemini 3.0 Flash to analyze the subtitle file and identify 5 trivia points with precise timestamps.
4.  **Voiceover Generation:** Use Google Cloud TTS (Neural2) to generate audio for each fact.
5.  **Asset Generation:** Create simple title cards (using `puppeteer` or `ffmpeg` text filters) and extract video clips.
6.  **Video Assembly:** Stitch the intro, title cards, clips, and voiceovers into a single vertical (9:16) MP4 file.

## Technical Requirements
-   **Input Source:** `Movies/` directory (bind mounted).
-   **Output:** `output/` directory organized by date/movie.
-   **Configuration:** `config.ts` must allow easy switching between test data and the real `Movies/` directory.
-   **Error Handling:** Graceful failure if a movie is missing subtitles or if the Gemini API errors out.

## MVP Constraints
-   No YouTube upload for this track (file generation only).
-   Simple "static image" title cards are acceptable for the first pass.
-   Use `movie.nfo` and `folder.jpg` if available; otherwise fail gracefully.
