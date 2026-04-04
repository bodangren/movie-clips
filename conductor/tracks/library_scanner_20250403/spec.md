# Track Specification: Media Library Scanner

## Overview
Implement movie/TV show detection, NFO parsing, subtitle parsing, and library indexing with caching. Create UI for browsing available content.

## Goals
1. Scan configured paths for movies/TV shows with NFO metadata
2. Parse .nfo files for title, year, poster information
3. Parse .srt subtitle files for content analysis
4. Index library with caching for performance
5. Create UI for browsing and selecting content

## Acceptance Criteria
- [ ] Detect movies (movie.nfo + video + .srt) and TV shows (tvshow.nfo + episodes)
- [ ] Parse NFO XML to extract metadata (title, year, plot, poster)
- [ ] Parse SRT subtitles with timestamps and text
- [ ] Cache library index for fast subsequent scans
- [ ] File system watcher for library changes
- [ ] UI shows available content with metadata and posters
- [ ] Filtering and search capabilities

## Dependencies
Track 2 (Configuration), Track 4 (AI for future analysis integration)