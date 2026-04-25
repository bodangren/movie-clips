# Implementation Plan: Automated Subtitle & Caption Generation

## Phase 1: Speech-to-Text Transcription
- [ ] 1.1 Create transcription service interface
- [ ] 1.2 Implement Gemini-based transcription using audio input
- [ ] 1.3 Add Whisper fallback for offline transcription
- [ ] 1.4 Write unit tests for transcription accuracy

## Phase 2: SRT Generation & Timing
- [ ] 2.1 Parse TTS timing data from narration output
- [ ] 2.2 Generate SRT files with word-level timestamps
- [ ] 2.3 Implement subtitle chunking for readability (max 42 chars/line)
- [ ] 2.4 Write tests for SRT format compliance

## Phase 3: FFmpeg Subtitle Integration
- [ ] 3.1 Add subtitle burning command to Rust FFmpeg service
- [ ] 3.2 Create caption overlay for emphasis points
- [ ] 3.3 Implement subtitle styling (font, size, position)
- [ ] 3.4 Write integration tests for video output with subtitles

## Phase 4: Pipeline Integration
- [ ] 4.1 Add subtitle generation stage to video pipeline
- [ ] 4.2 Update pipeline orchestrator to handle subtitle dependencies
- [ ] 4.3 Add subtitle quality validation step
- [ ] 4.4 Write end-to-end tests for full pipeline with subtitles

## Phase 5: Multi-Language Support (Future)
- [ ] 5.1 Add translation service interface
- [ ] 5.2 Implement language detection and translation
- [ ] 5.3 Create multi-language subtitle track support
- [ ] 5.4 Write tests for translation accuracy