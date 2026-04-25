# Track Specification: GPU-Accelerated Video Encoding

## Overview

Integrate GPU-accelerated video encoding into the FFmpeg service layer. Detects available hardware encoders (NVENC, VAAPI, VideoToolbox), selects the optimal encoder, and provides a graceful fallback chain to software encoding when no GPU is available. Dramatically reduces render time for video assembly.

## Goals

1. GPU hardware detection for NVENC (NVIDIA), VAAPI (Linux/AMD/Intel), VideoToolbox (macOS)
2. FFmpeg encoder selection based on detected hardware
3. Quality presets balancing speed vs. output quality
4. Graceful fallback chain: GPU encoder → software (libx264/libx265)
5. Benchmarking module to compare GPU vs. CPU encoding speed and quality
6. Configuration UI for encoder preference and quality preset selection

## Acceptance Criteria

- [ ] GPU detection module identifies NVENC, VAAPI, and VideoToolbox availability
- [ ] FFmpeg command builder selects correct `-c:v` and encoder-specific flags
- [ ] NVENC encoding works with `h264_nvenc` / `hevc_nvenc` presets (fast, medium, slow)
- [ ] VAAPI encoding works with `h264_vaapi` on supported hardware
- [ ] VideoToolbox encoding works with `h264_videotoolbox` on macOS
- [ ] Software fallback triggers automatically when no GPU encoder detected
- [ ] Software fallback triggers on GPU encoder error (runtime failure)
- [ ] Quality preset configurable in app settings (default: balanced)
- [ ] Benchmark module compares encode time and output file size across encoders
- [ ] Benchmark results displayed in settings/debug panel
- [ ] GPU encoding produces visually equivalent output (no artifacts, correct resolution)
- [ ] Encoding respects Shorts aspect ratio (9:16, 1080x1920) regardless of encoder

## Technical Details

- **Detection:** Shell out to `ffmpeg -encoders` and parse output for hardware encoders
- **NVENC:** Requires NVIDIA driver + CUDA toolkit; flags: `-c:v h264_nvenc -preset medium -cq 23`
- **VAAPI:** Requires `/dev/dri/renderD128`; flags: `-vaapi_device /dev/dri/renderD128 -c:v h264_vaapi -qp 23`
- **VideoToolbox:** macOS only; flags: `-c:v h264_videotoolbox -q:v 65`
- **Fallback:** If init or first frame encode fails, restart with `libx264 -crf 23 -preset medium`
- **Benchmark:** Encode a 10-second test clip with each available encoder; measure wall time + PSNR

## Dependencies

FFmpeg Service (command execution layer), Pipeline Orchestration (render integration)
