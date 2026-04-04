# Track Plan: Rust FFmpeg Service

## Status Notes
- **Created:** 2025-04-03
- **Priority:** High
- **Estimated Duration:** 4 days
- **Dependencies:** foundation_20250403

## Phase 1: Research & Setup
- [ ] Task: Research FFmpeg integration options
    - [ ] Sub-task: Evaluate `ffmpeg-next` crate vs `ffmpeg` crate
    - [ ] Sub-task: Research command-line execution approach
    - [ ] Sub-task: Check cross-platform compatibility
    - [ ] Sub-task: Decide on primary approach (bindings) and fallback (command)
- [ ] Task: Set up FFmpeg development environment
    - [ ] Sub-task: Install FFmpeg on development machine
    - [ ] Sub-task: Verify FFmpeg version and capabilities
    - [ ] Sub-task: Add FFmpeg crate dependencies to Cargo.toml
    - [ ] Sub-task: Create basic FFmpeg test to verify linking works
- [ ] Task: Design service architecture
    - [ ] Sub-task: Define VideoService trait with core operations
    - [ ] Sub-task: Design error types for video processing
    - [ ] Sub-task: Plan progress reporting mechanism
    - [ ] Sub-task: Design mock service for testing

## Phase 2: Command Execution Fallback (Day 1)
- [ ] Task: Implement command-based video service
    - [ ] Sub-task: Create `src-tauri/src/services/ffmpeg_command.rs`
    - [ ] Sub-task: Implement `extract_clip` using `ffmpeg` command
    - [ ] Sub-task: Implement `create_title_segment` using `ffmpeg` command
    - [ ] Sub-task: Implement `assemble_video` using `ffmpeg` concat
    - [ ] Sub-task: Implement `create_image_segment` using `ffmpeg` command
- [ ] Task: Add error handling and validation
    - [ ] Sub-task: Validate input file existence and permissions
    - [ ] Sub-task: Parse FFmpeg command output for errors
    - [ ] Sub-task: Implement timeout for long-running operations
    - [ ] Sub-task: Clean up temporary files on error
- [ ] Task: Add progress reporting
    - [ ] Sub-task: Parse FFmpeg progress output (if available)
    - [ ] Sub-task: Implement callback-based progress reporting
    - [ ] Sub-task: Add estimated time remaining calculation
- [ ] Task: Test command-based implementation
    - [ ] Sub-task: Create test video files for validation
    - [ ] Sub-task: Test each operation with sample data
    - [ ] Sub-task: Benchmark performance vs Node.js implementation
    - [ ] Sub-task: Verify output quality meets requirements

## Phase 3: FFmpeg Bindings Implementation (Day 2-3)
- [ ] Task: Implement bindings-based video service
    - [ ] Sub-task: Create `src-tauri/src/services/ffmpeg_bindings.rs`
    - [ ] Sub-task: Set up FFmpeg context and codec initialization
    - [ ] Sub-task: Implement `extract_clip` using FFmpeg API
    - [ ] Sub-task: Implement `create_title_segment` using FFmpeg API
    - [ ] Sub-task: Implement `assemble_video` using FFmpeg API
    - [ ] Sub-task: Implement `create_image_segment` using FFmpeg API
- [ ] Task: Optimize bindings implementation
    - [ ] Sub-task: Implement parallel processing where possible
    - [ ] Sub-task: Optimize memory usage and buffer management
    - [ ] Sub-task: Add hardware acceleration support if available
    - [ ] Sub-task: Implement proper resource cleanup
- [ ] Task: Add advanced features
    - [ ] Sub-task: Implement resize/crop to target dimensions
    - [ ] Sub-task: Add audio normalization/volume adjustment
    - [ ] Sub-task: Implement format detection and conversion
    - [ ] Sub-task: Add metadata preservation

## Phase 4: Service Integration & Tauri Commands (Day 3)
- [ ] Task: Create unified video service interface
    - [ ] Sub-task: Create `src-tauri/src/services/video_service.rs` with enum
    - [ ] Sub-task: Implement factory to choose between bindings/command
    - [ ] Sub-task: Add configuration option for service type
    - [ ] Sub-task: Create service initialization function
- [ ] Task: Expose video service via Tauri commands
    - [ ] Sub-task: Create `src-tauri/src/commands/video.rs`
    - [ ] Sub-task: Implement `extract_clip_command` with progress events
    - [ ] Sub-task: Implement `create_title_segment_command`
    - [ ] Sub-task: Implement `assemble_video_command`
    - [ ] Sub-task: Implement `create_image_segment_command`
- [ ] Task: Add frontend service layer
    - [ ] Sub-task: Create `src/lib/video/service.ts` TypeScript interface
    - [ ] Sub-task: Implement client for Tauri video commands
    - [ ] Sub-task: Add progress event handling in frontend
    - [ ] Sub-task: Create React hooks for video operations

## Phase 5: Mock Service & Testing (Day 4)
- [ ] Task: Create mock video service for testing
    - [ ] Sub-task: Create `src-tauri/src/services/mock_video.rs`
    - [ ] Sub-task: Implement mock versions of all video operations
    - [ ] Sub-task: Simulate progress reporting with configurable delays
    - [ ] Sub-task: Simulate errors for testing error handling
- [ ] Task: Write comprehensive tests
    - [ ] Sub-task: Unit tests for each video operation
    - [ ] Sub-task: Integration tests with actual video files
    - [ ] Sub-task: Error scenario tests (missing files, invalid timestamps)
    - [ ] Sub-task: Performance benchmarks vs Node.js implementation
- [ ] Task: Create test utilities
    - [ ] Sub-task: Create test video generation utilities
    - [ ] Sub-task: Implement golden tests for output validation
    - [ ] Sub-task: Create performance test suite
    - [ ] Sub-task: Add memory leak detection tests

## Phase 6: Configuration Integration & Polish (Day 4)
- [ ] Task: Integrate with configuration system
    - [ ] Sub-task: Read video dimensions from config (Track 2)
    - [ ] Sub-task: Configure temporary directory usage
    - [ ] Sub-task: Add FFmpeg binary path configuration (command mode)
    - [ ] Sub-task: Add service type configuration (bindings vs command)
- [ ] Task: Add monitoring and logging
    - [ ] Sub-task: Add detailed logging for video operations
    - [ ] Sub-task: Implement performance metrics collection
    - [ ] Sub-task: Add health checks for FFmpeg availability
    - [ ] Sub-task: Create video service status reporting
- [ ] Task: Conductor - User Manual Verification 'Rust FFmpeg Service'
    - [ ] Sub-task: Test clip extraction with sample video
    - [ ] Sub-task: Test title segment creation with image+audio
    - [ ] Sub-task: Test video assembly with multiple segments
    - [ ] Sub-task: Verify progress reporting works
    - [ ] Sub-task: Test error handling with invalid inputs
    - [ ] Sub-task: Benchmark performance vs current Node.js implementation

## Success Checklist
- [ ] All four core video operations implemented (extract, title, assemble, image)
- [ ] Progress reporting works with updates at least every second
- [ ] Error handling provides descriptive messages
- [ ] Mock service available for testing without FFmpeg
- [ ] Performance: 50% faster than Node.js implementation
- [ ] Memory usage: < 500MB during processing
- [ ] Output quality matches or exceeds current implementation
- [ ] Cross-platform compatibility verified
- [ ] All tests pass (unit, integration, performance)
- [ ] Configuration integration complete

## Notes
- Start with command execution as it's more reliable, then optimize with bindings
- Focus on error handling and cleanup - video processing can fail in many ways
- Consider memory usage carefully - video processing is memory intensive
- Document FFmpeg installation requirements for end users
- Plan for future GPU acceleration (can be added in Track 8)