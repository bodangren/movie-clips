import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runEncoderBenchmark } from './service';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe('runEncoderBenchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls run_encoder_benchmark with preset', async () => {
    const mockSummary = {
      results: [
        {
          encoder: 'h264_nvenc',
          encoder_type: 'nvenc',
          preset: 'fast',
          duration_ms: 1000,
          file_size_bytes: 1024000,
          psnr_score: 42.5,
          success: true,
          error_message: null,
        },
      ],
      reference_path: '/tmp/reference.mp4',
      fastest_encoder: 'h264_nvenc',
      smallest_encoder: 'h264_nvenc',
      best_quality_encoder: 'h264_nvenc',
    };

    mockedInvoke.mockResolvedValue(mockSummary);

    const result = await runEncoderBenchmark('fast');

    expect(mockedInvoke).toHaveBeenCalledWith('run_encoder_benchmark', {
      request: { preset: 'fast' },
    });
    expect(result).toEqual(mockSummary);
  });

  it('calls run_encoder_benchmark without preset', async () => {
    const mockSummary = {
      results: [],
      reference_path: '/tmp/reference.mp4',
      fastest_encoder: null,
      smallest_encoder: null,
      best_quality_encoder: null,
    };

    mockedInvoke.mockResolvedValue(mockSummary);

    const result = await runEncoderBenchmark();

    expect(mockedInvoke).toHaveBeenCalledWith('run_encoder_benchmark', {
      request: { preset: undefined },
    });
    expect(result).toEqual(mockSummary);
  });

  it('propagates errors from invoke', async () => {
    mockedInvoke.mockRejectedValue(new Error('Benchmark failed'));

    await expect(runEncoderBenchmark()).rejects.toThrow('Benchmark failed');
  });
});
