# Track: Automated Subtitle & Caption Generation

## Overview
Generate synchronized subtitles and captions for videos to improve accessibility, SEO, and viewer engagement.

## Problem Statement
Videos currently rely on audio-only narration without text overlays. This limits accessibility for hearing-impaired viewers and reduces SEO discoverability. YouTube's auto-captions are often inaccurate for trivia content.

## Goals
1. Generate accurate subtitles synchronized with narration
2. Create burned-in captions for key trivia points
3. Support multiple subtitle formats (SRT, VTT, closed captions)
4. Improve video accessibility and SEO ranking

## Acceptance Criteria
- [ ] Speech-to-text transcription using Gemini or Whisper
- [ ] SRT file generation synchronized with TTS narration
- [ ] Burned-in caption overlay for emphasis points
- [ ] Subtitle timing adjustment for readability
- [ ] Multiple language subtitle support (future)

## Technical Notes
- Leverage existing Gemini TTS timing data for synchronization
- Use FFmpeg for subtitle burning (existing Rust FFmpeg service)
- Store subtitle files alongside video outputs
- Consider Gemini's native speech-to-text for transcription