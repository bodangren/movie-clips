# Track Specification: Rust FFmpeg Service

## Overview
Implement native video processing capabilities using Rust FFmpeg bindings or command execution. This service will handle video clip extraction, title segment creation, and video assembly - the core video processing operations for the movie clips application.

## Goals
1. High-performance video clip extraction based on timestamps
2. Title segment generation (combining images with audio)
3. Video concatenation/assembly from multiple segments
4. Progress reporting and error handling for long-running operations
5. Mock service for testing without FFmpeg dependency

## Acceptance Criteria
### Functional Requirements
- [ ] Extract video clip from source file given start/end timestamps
- [ ] Create title segment from image + audio with specified duration
- [ ] Concatenate multiple video segments into final output
- [ ] Resize/crop videos to target dimensions (9:16 vertical format)
- [ ] Report progress during long operations (percentage complete)
- [ ] Handle FFmpeg errors gracefully with descriptive messages
- [ ] Validate input files exist and are accessible
- [ ] Clean up temporary files on error or completion

### Non-Functional Requirements
- [ ] Clip extraction performance: < 2x realtime on average hardware
- [ ] Memory usage: < 500MB during processing
- [ ] CPU utilization: Efficient use of available cores
- [ ] Progress updates: At least every 1 second during processing
- [ ] Error recovery: Partial cleanup on failure

### Quality Requirements
- [ ] Output video quality matches or exceeds current Node.js implementation
- [ ] Audio/video sync maintained in all operations
- [ ] Support common video formats (mp4, mkv, mov)
- [ ] Handle variable frame rates and codecs
- [ ] Comprehensive error handling for file I/O, FFmpeg failures, memory issues

## Technical Decisions
### FFmpeg Integration Approach
**Primary:** Revideo Migration (Phase 2 & 4) for composition and rendering.
**Secondary:** Rust FFmpeg command execution for basic clip extraction (`extract_clip`).
**Deprecated:** Rust-based title card generation, image segments, and assembly (superseded by Revideo).

### Service Architecture
```rust
// Core service interface
trait VideoService {
    async fn extract_clip(&self, input: &str, start: &str, end: &str, output: &str) -> Result<()>;
    // DEPRECATED: create_title_segment, assemble_video, create_image_segment
}
```
// With progress reporting
trait VideoServiceWithProgress: VideoService {
    fn on_progress(&self, callback: Box<dyn Fn(f32) + Send + Sync>);
}
```

### Configuration Integration
- Video dimensions from configuration (Track 2)
- Temporary directory management
- FFmpeg binary path configuration (if using command execution)

## Operations Specification
### 1. Clip Extraction
**Input:** Source video path, start timestamp (HH:MM:SS), end timestamp, output path
**Process:** Extract segment, resize to target dimensions, maintain audio
**Output:** MP4 file with H.264 video, AAC audio, target dimensions

### 2. Title Segment Creation  
**Input:** Image path (PNG/JPG), audio path (WAV/MP3), output path
**Process:** Create video with static image, audio track, match audio duration
**Output:** MP4 file with image frame, audio, target dimensions

### 3. Video Assembly
**Input:** List of video segment paths, output path
**Process:** Concatenate segments, ensure consistent format
**Output:** Single MP4 file with all segments

### 4. Image Segment Creation
**Input:** Image path, duration in seconds, output path
**Process:** Create video with static image, silent audio, specified duration
**Output:** MP4 file with image, silent audio, target dimensions

## Dependencies
- **External:** FFmpeg library (system-installed or bundled), Rust FFmpeg crates
- **Internal:** Track 1 (Foundation), Track 2 (Configuration for video settings)

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| FFmpeg bindings unstable/complex | High | High | Implement command execution fallback first |
| Cross-platform FFmpeg issues | Medium | Medium | Test on all target platforms, document requirements |
| Memory leaks in Rust FFmpeg bindings | Medium | High | Extensive testing, memory profiling, use safe abstractions |
| Performance not better than Node.js | Low | Medium | Benchmark early, optimize critical paths |

## Success Metrics
- Clip extraction: 50% faster than current Node.js implementation
- Memory usage: < 50% of Node.js implementation
- Reliability: 99% success rate for valid inputs
- Progress reporting: Updates at least every second
- Error messages: Actionable and descriptive

## Out of Scope
- Video transcoding (beyond required formats)
- Advanced video effects/filters
- Real-time video processing
- GPU acceleration (may be added in Track 8)
- Audio processing beyond basic mixing

## References
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [ffmpeg-next crate](https://crates.io/crates/ffmpeg-next)
- [Rust async/await patterns](https://rust-lang.github.io/async-book/)
- [Cross-platform file handling in Rust](https://doc.rust-lang.org/std/path/struct.Path.html)