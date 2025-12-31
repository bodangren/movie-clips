import path from 'path';
import { describe, expect, it, vi } from 'vitest';

const winstonMocks = vi.hoisted(() => {
  const createLogger = vi.fn((options) => ({ options }));
  const format = {
    combine: vi.fn((...args) => ({ type: 'combine', args })),
    timestamp: vi.fn((opts) => ({ type: 'timestamp', opts })),
    errors: vi.fn((opts) => ({ type: 'errors', opts })),
    splat: vi.fn(() => ({ type: 'splat' })),
    json: vi.fn(() => ({ type: 'json' })),
    colorize: vi.fn(() => ({ type: 'colorize' })),
    simple: vi.fn(() => ({ type: 'simple' })),
  };
  const File = vi.fn((opts) => ({ kind: 'file', opts }));
  const Console = vi.fn((opts) => ({ kind: 'console', opts }));

  return { createLogger, format, File, Console };
});

vi.mock('winston', () => ({
  default: {
    createLogger: winstonMocks.createLogger,
    format: winstonMocks.format,
    transports: { File: winstonMocks.File, Console: winstonMocks.Console },
  },
  createLogger: winstonMocks.createLogger,
  format: winstonMocks.format,
  transports: { File: winstonMocks.File, Console: winstonMocks.Console },
}));

import { logger } from './logger';

describe('logger', () => {
  it('configures the logger with expected metadata and transports', () => {
    expect(winstonMocks.createLogger).toHaveBeenCalledTimes(1);
    expect(winstonMocks.File).toHaveBeenCalledTimes(2);
    expect(winstonMocks.Console).toHaveBeenCalledTimes(1);

    const options = (logger as { options: any }).options;
    expect(options.level).toBe('info');
    expect(options.defaultMeta).toEqual({ service: 'movie-clips-auto' });
    expect(options.transports).toHaveLength(3);

    expect(winstonMocks.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: path.join('logs', 'error.log'),
        level: 'error',
      })
    );
    expect(winstonMocks.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: path.join('logs', 'combined.log'),
      })
    );
    expect(winstonMocks.Console).toHaveBeenCalledWith(
      expect.objectContaining({
        format: expect.any(Object),
      })
    );
  });
});
