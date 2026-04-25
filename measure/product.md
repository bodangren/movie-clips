# Initial Concept
Automated system that generates and publishes "5 Things You Didn't Know About [Movie]" videos twice daily using Gemini and Google Cloud TTS.

# Product Guide

## Vision
To create a fully automated content pipeline that produces engaging, high-quality "5 Things You Didn't Know" movie trivia videos for YouTube Shorts. The system leverages the Gemini 3.0 Pro/Flash models to analyze subtitles and identify compelling moments, ensuring a steady stream of twice-daily content that appeals to general movie fans and trivia enthusiasts.

## Target Audience
-   **Primary:** General movie fans and trivia buffs browsing YouTube Shorts.
-   **Secondary:** Viewers looking for quick, entertaining educational content about their favorite films.

## Core Value Proposition
-   **Automation:** Zero-touch production from movie selection to video generation.
-   **Curated Quality:** AI-driven selection of the most interesting facts (production secrets, hidden meanings, or source comparisons) tailored to each specific movie.
-   **Consistency:** Reliable twice-daily publishing schedule using local media assets.

## Key Features
-   **Automated Movie Selection:** Intelligently picks movies from a local library using NFO metadata and tracks usage history.
-   **Smart Content Analysis:** Uses Google Gemini to find the best 5 trivia points per movie, flexibly choosing between production facts, deep analysis, or comparisons based on what is most engaging.
-   **YouTube Shorts Optimization:** Produces vertical or crop-optimized videos in the 1:45 to 2:00 minute range, ideal for Shorts retention.
-   **Google Ecosystem Power:** Utilizes Google Cloud TTS for high-quality voiceovers and Gemini for context-aware script generation.
-   **Asset Utilization:** Leverages existing `movie.nfo` metadata for context and research.
-   **Visual Enhancements:** Incorporates `folder.jpg` (movie poster) for the intro/title sequence and explores using `trickplay` images (10x10 grids) for additional visual variety or placeholders if video clips are unavailable or unsuitable.

## Success Metrics
-   Consistent 2x daily output without manual intervention.
-   Successful parsing and synchronization of clips from local `.srt` and video files.
-   Video duration consistently within the 1:45-2:00 target window.
