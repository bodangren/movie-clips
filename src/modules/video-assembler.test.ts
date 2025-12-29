import { describe, it, expect, vi } from 'vitest';
import { VideoAssembler } from './video-assembler';
import fs from 'fs-extra';

// Mock fluent-ffmpeg
vi.mock('fluent-ffmpeg', () => {
  const m = {
    input: vi.fn().mockReturnThis(),
    inputOptions: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    videoCodec: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function(this: any, event: string, handler: any) {
      if (event === 'end') setTimeout(handler, 10);
      return this;
    }),
    save: vi.fn().mockReturnThis(),
  };
  return { default: vi.fn(() => m) };
});

describe('VideoAssembler', () => {
  it('should call ffmpeg concat', async () => {
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined as never);
    vi.spyOn(fs, 'remove').mockResolvedValue(undefined as never);

    const assembler = new VideoAssembler();
    const result = await assembler.assemble(['a.mp4', 'b.mp4'], 'temp/out.mp4');
    
    expect(result).toBe('temp/out.mp4');
    expect(fs.writeFile).toHaveBeenCalled();
  });
});
