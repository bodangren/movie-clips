import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from './index';
import { MovieSelector } from './modules/movie-selector';
import { NfoParser } from './modules/nfo-parser';
import { SubtitleParser } from './modules/subtitle-parser';
import { LlmAnalyzer } from './modules/llm-analyzer';
import { TtsGenerator } from './modules/tts-generator';
import { TitleCardGenerator } from './modules/title-card';
import { ClipExtractor } from './modules/clip-extractor';
import { VideoAssembler } from './modules/video-assembler';
import { config } from './config';

// Mock all modules
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    remove: vi.fn(),
    writeJson: vi.fn()
  }
}));
vi.mock('./modules/movie-selector');
vi.mock('./modules/nfo-parser');
vi.mock('./modules/subtitle-parser');
vi.mock('./modules/llm-analyzer');
vi.mock('./modules/tts-generator');
vi.mock('./modules/title-card');
vi.mock('./modules/clip-extractor');
vi.mock('./modules/video-assembler');
vi.mock('./config', () => ({
    config: {
        paths: {
            movies: '/mock/movies',
            temp: '/mock/temp',
            output: '/mock/output'
        }
    }
}));
vi.mock('./utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('Pipeline Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should run the full pipeline successfully', async () => {
        // Mock Module Responses
        const mockMovie = { title: 'Test Movie', nfoPath: 'path/to/nfo', subtitlePath: 'path/to/srt', videoPath: 'path/to/video' };
        vi.mocked(MovieSelector.prototype.scan).mockResolvedValue([mockMovie]);
        vi.mocked(NfoParser.prototype.parse).mockResolvedValue({ title: 'Test Movie', year: '2023', plot: 'Plot' });
        vi.mocked(SubtitleParser.prototype.parse).mockResolvedValue([{ id: '1', startTime: '00:00:01', endTime: '00:00:05', text: 'Dialog' }]);
        vi.mocked(LlmAnalyzer.prototype.analyze).mockResolvedValue({
            facts: [{ number: 1, trivia_text: 'Fact 1', clip_start: '00:00:10', clip_end: '00:00:15' }]
        });
        vi.mocked(ClipExtractor.prototype.extract).mockResolvedValue('out.mp4');
        vi.mocked(TtsGenerator.prototype.generate).mockResolvedValue('voiceover_1.wav');
        vi.mocked(TitleCardGenerator.prototype.generate).mockResolvedValue('title_1.png');
        vi.mocked(VideoAssembler.prototype.createTitleSegment).mockResolvedValue('title_seg_1.mp4');
        
        await runPipeline();

        expect(MovieSelector.prototype.scan).toHaveBeenCalled();
        expect(NfoParser.prototype.parse).toHaveBeenCalled();
        expect(SubtitleParser.prototype.parse).toHaveBeenCalled();
        expect(LlmAnalyzer.prototype.analyze).toHaveBeenCalled();
        expect(TtsGenerator.prototype.generate).toHaveBeenCalled();
        expect(TitleCardGenerator.prototype.generate).toHaveBeenCalled();
        expect(VideoAssembler.prototype.createTitleSegment).toHaveBeenCalled();
        expect(ClipExtractor.prototype.extract).toHaveBeenCalled();
        expect(VideoAssembler.prototype.assemble).toHaveBeenCalled();
    });

    it('should handle no movies found', async () => {
        vi.mocked(MovieSelector.prototype.scan).mockResolvedValue([]);
        
        await runPipeline();
        
        expect(NfoParser.prototype.parse).not.toHaveBeenCalled();
    });
});
