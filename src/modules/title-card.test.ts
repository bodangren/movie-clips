import { describe, it, expect, vi } from 'vitest';
import { TitleCardGenerator } from './title-card';
import { config } from '../config';

const puppeteerMock = vi.hoisted(() => {
  const screenshot = vi.fn().mockResolvedValue(undefined);
  const setContent = vi.fn().mockResolvedValue(undefined);
  const setViewport = vi.fn().mockResolvedValue(undefined);
  const newPage = vi.fn().mockResolvedValue({
    setViewport,
    setContent,
    screenshot,
  });
  const close = vi.fn().mockResolvedValue(undefined);
  const launch = vi.fn().mockResolvedValue({
    newPage,
    close,
  });

  return {
    screenshot,
    setContent,
    setViewport,
    newPage,
    close,
    launch,
  };
});

vi.mock('puppeteer', () => ({
  default: { launch: puppeteerMock.launch },
}));

describe('TitleCardGenerator', () => {
  it('should generate a title card image', async () => {
    const generator = new TitleCardGenerator();
    const outputPath = 'temp/test_title.png';

    const result = await generator.generate({
      number: 1,
      text: 'Test Trivia',
      movie: 'Test Movie',
      year: 2023
    }, outputPath);

    expect(result).toBe(outputPath);
    expect(puppeteerMock.launch).toHaveBeenCalled();
    expect(puppeteerMock.newPage).toHaveBeenCalled();
    expect(puppeteerMock.setViewport).toHaveBeenCalledWith({
      width: config.video.targetWidth,
      height: config.video.targetHeight
    });
    expect(puppeteerMock.setContent).toHaveBeenCalled();
    expect(puppeteerMock.screenshot).toHaveBeenCalledWith({ path: outputPath });
    expect(puppeteerMock.close).toHaveBeenCalled();
  }, 20000); // Higher timeout for puppeteer
});
