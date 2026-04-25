import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderVideo, renderVideoWithFallback, type RenderVideoRequest } from './service';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe('renderVideoWithFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('succeeds on first attempt', async () => {
    mockedInvoke.mockResolvedValue(undefined);

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await renderVideoWithFallback(request);
    expect(mockedInvoke).toHaveBeenCalledTimes(1);
    expect(mockedInvoke).toHaveBeenCalledWith('render_video', { request });
  });

  it('retries with software encoder on nvenc failure', async () => {
    mockedInvoke
      .mockRejectedValueOnce(new Error('NVENC encoder failed'))
      .mockResolvedValueOnce(undefined);

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test', encoder: 'nvenc' }),
      output: '/tmp/output.mp4',
    };

    await renderVideoWithFallback(request);

    expect(mockedInvoke).toHaveBeenCalledTimes(2);
    // First call with original request
    expect(mockedInvoke).toHaveBeenNthCalledWith(1, 'render_video', { request });
    // Second call with software fallback
    const fallbackCall = mockedInvoke.mock.calls[1];
    expect(fallbackCall[0]).toBe('render_video');
    const fallbackRequest = (fallbackCall[1] as { request: RenderVideoRequest }).request;
    const fallbackMetadata = JSON.parse(fallbackRequest.metadata_json);
    expect(fallbackMetadata.encoder).toBe('software');
    expect(fallbackMetadata.preset).toBe('balanced');
  });

  it('retries with software encoder on vaapi failure', async () => {
    mockedInvoke
      .mockRejectedValueOnce(new Error('VAAPI initialization failed'))
      .mockResolvedValueOnce(undefined);

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await renderVideoWithFallback(request);
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it('retries with software encoder on generic encoder error', async () => {
    mockedInvoke
      .mockRejectedValueOnce(new Error('Hardware encoder not available'))
      .mockResolvedValueOnce(undefined);

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await renderVideoWithFallback(request);
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it('throws non-encoder errors without retry', async () => {
    mockedInvoke.mockRejectedValue(new Error('Out of disk space'));

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await expect(renderVideoWithFallback(request)).rejects.toThrow('Out of disk space');
    expect(mockedInvoke).toHaveBeenCalledTimes(1);
  });

  it('throws when software fallback also fails', async () => {
    mockedInvoke.mockRejectedValue(new Error('NVENC encoder failed'));

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await expect(renderVideoWithFallback(request)).rejects.toThrow('NVENC encoder failed');
    expect(mockedInvoke).toHaveBeenCalledTimes(2);
  });

  it('does not retry when retryWithSoftware is false', async () => {
    mockedInvoke.mockRejectedValue(new Error('NVENC encoder failed'));

    const request: RenderVideoRequest = {
      metadata_json: JSON.stringify({ title: 'Test' }),
      output: '/tmp/output.mp4',
    };

    await expect(renderVideoWithFallback(request, { retryWithSoftware: false })).rejects.toThrow(
      'NVENC encoder failed'
    );
    expect(mockedInvoke).toHaveBeenCalledTimes(1);
  });
});
