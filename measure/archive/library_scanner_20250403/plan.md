# Track Plan: Media Library Scanner

## Status Notes
- **Created:** 2025-04-03
- **Priority:** Medium
- **Estimated Duration:** 2 days
- **Dependencies:** config_state_20250403, ai_integration_20250403

## Phase 1: Library Structure & Types
- [ ] Task: Define library types and data structures
     - [ ] Sub-task: Create `src/lib/library/types.ts` with Movie, TVShow, Episode, Subtitle interfaces
     - [ ] Sub-task: Define NfoMetadata, MediaFile, LibraryScanResult types
     - [ ] Sub-task: Add type exports and index file
- [ ] Task: Write tests for library types
     - [ ] Sub-task: Create `src/lib/library/types.test.ts`
     - [ ] Sub-task: Test type definitions and type guards

## Phase 2: NFO Parser
- [ ] Task: Implement NFO XML parser
     - [ ] Sub-task: Review `backup-old/` for NFO parsing reference
     - [ ] Sub-task: Create `src/lib/library/nfo-parser.ts`
     - [ ] Sub-task: Parse movie.nfo structure (title, year, plot, poster)
     - [ ] Sub-task: Parse tvshow.nfo structure
     - [ ] Sub-task: Handle malformed NFO files gracefully
- [ ] Task: Write tests for NFO parser
     - [ ] Sub-task: Create `src/lib/library/nfo-parser.test.ts`
     - [ ] Sub-task: Test movie.nfo parsing
     - [ ] Sub-task: Test tvshow.nfo parsing
     - [ ] Sub-task: Test error handling for malformed XML

## Phase 3: Subtitle Parser (SRT)
- [ ] Task: Implement SRT subtitle parser
     - [ ] Sub-task: Create `src/lib/library/subtitle-parser.ts`
     - [ ] Sub-task: Parse SRT format with timestamps
     - [ ] Sub-task: Extract text content for analysis
     - [ ] Sub-task: Handle edge cases (empty subtitles, overlapping times)
- [ ] Task: Write tests for subtitle parser
     - [ ] Sub-task: Create `src/lib/library/subtitle-parser.test.ts`
     - [ ] Sub-task: Test standard SRT format
     - [ ] Sub-task: Test multi-line subtitles
     - [ ] Sub-task: Test edge cases

## Phase 4: Library Scanner
- [ ] Task: Implement library scanner service
     - [ ] Sub-task: Create `src/lib/library/scanner.ts`
     - [ ] Sub-task: Scan directory for media files
     - [ ] Sub-task: Detect media type (movie vs TV show)
     - [ ] Sub-task: Index discovered content with metadata
     - [ ] Sub-task: Build library cache for fast lookups
- [ ] Task: Write tests for library scanner
     - [ ] Sub-task: Create `src/lib/library/scanner.test.ts`
     - [ ] Sub-task: Test directory scanning
     - [ ] Sub-task: Test media type detection
     - [ ] Sub-task: Test cache operations

## Phase 5: Integration & Service Layer
- [x] Task: Create library service with progress reporting
     - [x] Sub-task: Create `src/lib/library/service.ts` combining scanner, NFO parser, subtitle parser
     - [x] Sub-task: Add progress callback for scanning operations
     - [x] Sub-task: Integrate with config for library paths
- [ ] Task: Measure - User Manual Verification
     - [ ] Sub-task: Test scanning a real media directory
     - [ ] Sub-task: Verify NFO parsing with real files
     - [ ] Sub-task: Verify subtitle extraction

## Success Checklist
- [x] Detect movies (movie.nfo + video + .srt) and TV shows (tvshow.nfo + episodes)
- [x] Parse NFO XML to extract metadata (title, year, plot, poster)
- [x] Parse SRT subtitles with timestamps and text
- [x] Cache library index for fast subsequent scans
- [x] All tests pass (96 tests)
- [x] Build succeeds
