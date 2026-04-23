# Track Plan: GPU-Accelerated Video Encoding

## Status Notes

- **Created:** 2026-04-23
- **Priority:** Medium
- **Estimated Duration:** 4 days
- **Dependencies:** ffmpeg_service_20250403, pipeline_orchestration_20250403

## Phase 1: GPU Detection Module (Day 1)

- [ ] Write tests for NVENC, VAAPI, and VideoToolbox detection
- [ ] Implement `detectGpuEncoders()` function that runs `ffmpeg -encoders` and parses output
- [ ] Implement per-encoder availability check (NVENC: `h264_nvenc`, VAAPI: `h264_vaapi`, VideoToolbox: `h264_videotoolbox`)
- [ ] Implement runtime validation: verify encoder actually works by encoding a 1-frame test
- [ ] Return typed result: `{ nvenc: boolean, vaapi: boolean, videotoolbox: boolean, software: true }`
- [ ] Manual verification: run detection on machines with and without GPU

## Phase 2: FFmpeg Encoder Integration (Day 2)

- [ ] Write tests for encoder flag generation for each encoder type
- [ ] Implement `buildEncodeCommand(encoder, preset, outputPath)` that returns correct FFmpeg args
- [ ] Implement NVENC flag builder: `-c:v h264_nvenc -preset {fast|medium|slow} -cq 23 -pix_fmt yuv420p`
- [ ] Implement VAAPI flag builder: `-vaapi_device /dev/dri/renderD128 -c:v h264_vaapi -qp 23`
- [ ] Implement VideoToolbox flag builder: `-c:v h264_videotoolbox -q:v 65`
- [ ] Implement software fallback flag builder: `-c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p`
- [ ] Integrate encoder selection into pipeline render step (auto-select best available)
- [ ] Manual verification: encode a test video with each available encoder

## Phase 3: Quality & Benchmark Testing (Day 3)

- [ ] Write tests for benchmark runner and quality comparison
- [ ] Implement benchmark module: encode a 10-second reference clip with each available encoder
- [ ] Measure wall-clock time per encoder
- [ ] Measure output file size per encoder
- [ ] Calculate PSNR between reference and each output (quality metric)
- [ ] Store benchmark results in app config for comparison
- [ ] Implement benchmark UI panel in settings (table: encoder, time, size, PSNR)
- [ ] Manual verification: run benchmark and review results in UI

## Phase 4: Fallback Handling & Configuration (Day 4)

- [ ] Write tests for fallback chain: detection → primary → error → fallback → software
- [ ] Implement runtime error detection: catch FFmpeg exit code / stderr for encoder failures
- [ ] Implement automatic fallback: if GPU encoder fails mid-encode, restart with software encoder
- [ ] Implement configuration UI: encoder preference dropdown (auto, nvenc, vaapi, software)
- [ ] Implement configuration UI: quality preset selector (fast, balanced, slow)
- [ ] Persist encoder config in app settings
- [ ] Integrate fallback into pipeline orchestration (transparent to user)
- [ ] End-to-end test: force GPU failure → verify automatic software fallback
- [ ] Manual verification: full pipeline run with GPU, then without GPU

## Success Checklist

- All acceptance criteria from spec met
- Tests pass with >80% coverage for new code
- Code follows style guides (TypeScript, Rust)
- GPU detection works cross-platform (Linux, macOS, Windows)
- Encoder selection is automatic and optimal
- Fallback is transparent and recoverable
- Benchmark results show measurable GPU speedup on capable hardware
- No visual artifacts or resolution errors in GPU-encoded output

## Notes

- NVENC requires NVIDIA GPU with driver >= 470.x and CUDA toolkit
- VAAPI requires `/dev/dri/renderD128` (Intel/AMD on Linux)
- VideoToolbox is macOS-only; no GPU on most CI runners
- Software fallback must always work — it is the guaranteed baseline
- Consider caching detection results (GPU rarely changes mid-session)
- Revideo may output frames directly; ensure encoder integration handles both file and pipe input
