import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from './index';
import { TvSelector } from './modules/tv-selector';
import { TvNfoParser } from './modules/tv-nfo-parser';
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
vi.mock('./modules/tv-selector');
vi.mock('./modules/tv-nfo-parser');
vi.mock('./modules/subtitle-parser');
vi.mock('./modules/llm-analyzer');
vi.mock('./modules/tts-generator');
vi.mock('./modules/title-card');
vi.mock('./modules/clip-extractor');
vi.mock('./modules/video-assembler');
vi.mock('./config', () => ({
    config: {
        paths: {
            tv: '/mock/tv',
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
        const mockEpisode = {
            showTitle: 'Test Show',
            tvshowNfoPath: 'path/to/tvshow.nfo',
            seasonNfoPath: 'path/to/season.nfo',
            episodeNfoPath: 'path/to/episode.nfo',
            subtitlePath: 'path/to/srt',
            episodeVideoPath: 'path/to/video',
            seasonNumber: 1
        };
        vi.mocked(TvSelector.prototype.scan).mockResolvedValue([mockEpisode as any]);
        vi.mocked(TvNfoParser.prototype.parseShow).mockResolvedValue({ title: 'Test Show', year: 2023, plot: 'Plot' });
        vi.mocked(TvNfoParser.prototype.parseSeason).mockResolvedValue({ title: 'Season 1', seasonNumber: 1, year: 2023, plot: 'Plot' });
        vi.mocked(TvNfoParser.prototype.parseEpisode).mockResolvedValue({
            title: 'Pilot',
            showTitle: 'Test Show',
            season: 1,
            episode: 1,
            year: 2023,
            plot: 'Plot'
        });
        vi.mocked(SubtitleParser.prototype.parse).mockResolvedValue([{ id: '1', startTime: '00:00:01', endTime: '00:00:05', text: 'Dialog' }]);
        vi.mocked(LlmAnalyzer.prototype.analyze).mockResolvedValue({
            show_title: 'Test Show',
            episode_title: 'Pilot',
            video_title: 'Test Title',
            video_description: 'Test Description',
            comment_prompt: 'Do you remember what happens next?',
            facts: [{ number: 1, trivia_text: 'Fact 1', clip_start: '00:00:10', clip_end: '00:00:15' }]
        });
        vi.mocked(ClipExtractor.prototype.extract).mockResolvedValue('out.mp4');
        vi.mocked(TtsGenerator.prototype.generate).mockResolvedValue('voiceover_1.wav');
        vi.mocked(TitleCardGenerator.prototype.generate).mockResolvedValue('title_1.png');
        vi.mocked(VideoAssembler.prototype.createTitleSegment).mockResolvedValue('title_seg_1.mp4');
        
        await runPipeline();

        expect(TvSelector.prototype.scan).toHaveBeenCalled();
        expect(TvNfoParser.prototype.parseShow).toHaveBeenCalled();
        expect(TvNfoParser.prototype.parseEpisode).toHaveBeenCalled();
        expect(SubtitleParser.prototype.parse).toHaveBeenCalled();
        expect(LlmAnalyzer.prototype.analyze).toHaveBeenCalled();
        expect(TtsGenerator.prototype.generate).toHaveBeenCalled();
        expect(TitleCardGenerator.prototype.generate).toHaveBeenCalled();
        expect(VideoAssembler.prototype.createTitleSegment).toHaveBeenCalled();
        expect(ClipExtractor.prototype.extract).toHaveBeenCalled();
        expect(VideoAssembler.prototype.assemble).toHaveBeenCalled();
    });

    it('should handle no episodes found', async () => {
        vi.mocked(TvSelector.prototype.scan).mockResolvedValue([]);
        
        await runPipeline();
        
        expect(TvNfoParser.prototype.parseShow).not.toHaveBeenCalled();
    });
});
