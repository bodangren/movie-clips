import { config } from './config';
import { logger } from './utils/logger';
import { TvSelector, type TvEpisodeAssets } from './modules/tv-selector';
import { TvNfoParser } from './modules/tv-nfo-parser';
import { SubtitleParser } from './modules/subtitle-parser';
import { LlmAnalyzer } from './modules/llm-analyzer';
import { TtsGenerator } from './modules/tts-generator';
import { TitleCardGenerator } from './modules/title-card';
import { ClipExtractor } from './modules/clip-extractor';
import { VideoAssembler } from './modules/video-assembler';
import fs from 'fs-extra';
import path from 'path';

export async function runPipeline() {
  logger.info('--- Starting Automated TV Trivia Pipeline ---');

  const tvSelector = new TvSelector(config.paths.tv);
  const nfoParser = new TvNfoParser();
  const subtitleParser = new SubtitleParser();
  const llmAnalyzer = new LlmAnalyzer();
  const ttsGenerator = new TtsGenerator();
  const titleCardGenerator = new TitleCardGenerator();
  const clipExtractor = new ClipExtractor();
  const videoAssembler = new VideoAssembler();

  // 1. Select Episode
  const availableEpisodes = await tvSelector.scan();
  if (availableEpisodes.length === 0) {
    logger.error('No valid episodes found in TV library.');
    return;
  }

  const episodeOverridePath = resolveEpisodeOverridePath();
  const episodeAssets = episodeOverridePath
    ? pickEpisodeByPath(availableEpisodes, episodeOverridePath)
    : availableEpisodes[Math.floor(Math.random() * availableEpisodes.length)];

  if (!episodeAssets) {
    logger.error(`Requested episode not found: ${episodeOverridePath}`);
    return;
  }

  const selectionLabel = episodeOverridePath ? 'Selected episode (override)' : 'Selected episode';
  logger.info(`${selectionLabel}: ${episodeAssets.showTitle} Season ${episodeAssets.seasonNumber}`);

  // 2. Parse Metadata
  const showMetadata = await nfoParser.parseShow(episodeAssets.tvshowNfoPath);
  if (!showMetadata) return;
  const seasonMetadata = episodeAssets.seasonNfoPath
    ? await nfoParser.parseSeason(episodeAssets.seasonNfoPath)
    : null;
  const episodeMetadata = await nfoParser.parseEpisode(episodeAssets.episodeNfoPath);
  if (!episodeMetadata) return;

  // 3. Parse Subtitles
  const subtitles = await subtitleParser.parse(episodeAssets.subtitlePath);
  if (subtitles.length === 0) return;

  // 4. Analyze with Gemini
  const analysis = await llmAnalyzer.analyze(showMetadata, episodeMetadata, subtitles);
  if (!analysis || !analysis.facts || analysis.facts.length === 0) {
    logger.error('Failed to generate trivia analysis.');
    return;
  }

  // 5. Generate Assets
  const runTempDir = path.join(config.paths.temp, `${Date.now()}`);
  await fs.ensureDir(runTempDir);

  const videoSegments: string[] = [];

  const introImagePath = resolveTitleBackground(episodeAssets);
  if (introImagePath) {
    const posterSegPath = path.join(runTempDir, 'poster_intro.mp4');
    try {
      await videoAssembler.createImageSegment(introImagePath, posterSegPath, 3);
      videoSegments.push(posterSegPath);
    } catch (e) {
      logger.error('Skipping intro due to segment creation error.');
    }
  }

  for (const fact of analysis.facts) {
    logger.info(`Processing fact #${fact.number}`);

    const audioPath = path.join(runTempDir, `voiceover_${fact.number}.wav`);
    const imagePath = path.join(runTempDir, `title_${fact.number}.png`);
    const titleSegPath = path.join(runTempDir, `title_seg_${fact.number}.mp4`);
    const clipPath = path.join(runTempDir, `clip_${fact.number}.mp4`);

    // Extract Clip
    try {
        await clipExtractor.extract(episodeAssets.episodeVideoPath, fact.clip_start, fact.clip_end, clipPath);
    } catch (e) {
        logger.error(`Skipping fact ${fact.number} due to clip extraction error.`);
        continue;
    }

    // Generate TTS
    const ttsResult = await ttsGenerator.generate(fact.trivia_text, audioPath);
    if (!ttsResult) {
      logger.error(`Skipping fact ${fact.number} due to TTS generation error.`);
      continue;
    }

    // Generate Title Card
    const episodeCode = formatEpisodeCode(episodeMetadata.season, episodeMetadata.episode);
    const seasonLabel = seasonMetadata?.title || `Season ${episodeMetadata.season}`;
    const footer = `${showMetadata.title} • ${episodeCode} • ${episodeMetadata.title}`;
    await titleCardGenerator.generate(
      {
        header: `Thing #${fact.number}`,
        text: fact.trivia_text,
        footer: `${seasonLabel} • ${footer}`,
        backgroundImage: resolveTitleBackground(episodeAssets),
      },
      imagePath
    );

    // Combine Image + Audio into segment
    // Note: This requires ffmpeg to be installed on system
    try {
        await videoAssembler.createTitleSegment(imagePath, audioPath, titleSegPath);
    } catch (e) {
        logger.error(`Skipping fact ${fact.number} due to title segment error.`);
        continue;
    }

    videoSegments.push(clipPath, titleSegPath);
  }

  const episodeCode = formatEpisodeCode(episodeMetadata.season, episodeMetadata.episode);
  const outroText = analysis.comment_prompt;
  const outroAudioPath = path.join(runTempDir, 'voiceover_outro.wav');
  const outroImagePath = path.join(runTempDir, 'title_outro.png');
  const outroSegPath = path.join(runTempDir, 'title_seg_outro.mp4');
  const outroTts = await ttsGenerator.generate(outroText, outroAudioPath);
  if (!outroTts) {
    logger.error('Outro generation failed. Aborting pipeline.');
    throw new Error('TTS failed after retries.');
  }
  await titleCardGenerator.generate(
    {
      header: 'Comment',
      text: outroText,
      footer: `${showMetadata.title} • ${episodeCode} • ${episodeMetadata.title}`,
      backgroundImage: episodeAssets.fanartPath,
      topLogoImage: episodeAssets.clearlogoPath,
    },
    outroImagePath
  );
  await videoAssembler.createTitleSegment(outroImagePath, outroAudioPath, outroSegPath);
  videoSegments.push(outroSegPath);

  if (videoSegments.length === 0) {
      logger.error('No segments created. Aborting assembly.');
      return;
  }

  // 6. Assemble Final Video
  const finalOutputDir = path.join(config.paths.output, new Date().toISOString().split('T')[0]);
  await fs.ensureDir(finalOutputDir);
  const safeShowTitle = showMetadata.title.replace(/\s+/g, '_');
  const finalVideoPath = path.join(
    finalOutputDir,
    `${safeShowTitle}_${episodeCode}_final.mp4`
  );

  await videoAssembler.assemble(videoSegments, finalVideoPath);
  await fs.writeJson(
    path.join(finalOutputDir, `${safeShowTitle}_${episodeCode}_metadata.json`),
    {
      show_title: analysis.show_title,
      episode_title: analysis.episode_title,
      video_title: analysis.video_title,
      video_description: analysis.video_description,
      comment_prompt: analysis.comment_prompt
    },
    { spaces: 2 }
  );

  logger.info(`--- Pipeline Complete! Video saved to: ${finalVideoPath} ---`);
}

function formatEpisodeCode(season: number, episode: number): string {
  return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}

function resolveTitleBackground(assets: {
  seasonPosterPath?: string;
  seriesPosterPath?: string;
  episodeThumbPath?: string;
  seasonBannerPath?: string;
  seriesBannerPath?: string;
  fanartPath?: string;
  landscapePath?: string;
}): string | undefined {
  return (
    assets.seasonPosterPath ||
    assets.seriesPosterPath ||
    assets.episodeThumbPath ||
    assets.seasonBannerPath ||
    assets.seriesBannerPath ||
    assets.fanartPath ||
    assets.landscapePath
  );
}

function resolveEpisodeOverridePath(): string | null {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--episode') {
      const value = args[index + 1];
      if (!value) {
        logger.error('Missing value for --episode.');
        return null;
      }
      return path.resolve(value);
    }

    if (arg.startsWith('--episode=')) {
      const value = arg.slice('--episode='.length);
      if (!value) {
        logger.error('Missing value for --episode.');
        return null;
      }
      return path.resolve(value);
    }
  }

  return null;
}

function pickEpisodeByPath(
  episodes: TvEpisodeAssets[],
  overridePath: string
): TvEpisodeAssets | null {
  const normalizedOverride = path.resolve(overridePath);
  const exactMatch = episodes.find(
    (episode) => path.resolve(episode.episodeVideoPath) === normalizedOverride
  );
  if (exactMatch) {
    return exactMatch;
  }

  const overrideBase = path.basename(normalizedOverride);
  const baseMatches = episodes.filter(
    (episode) => path.basename(episode.episodeVideoPath) === overrideBase
  );

  if (baseMatches.length === 1) {
    return baseMatches[0];
  }

  if (baseMatches.length > 1) {
    logger.error(`Multiple episodes match the filename "${overrideBase}". Use a full path.`);
  }

  return null;
}

if (require.main === module) {
  runPipeline().catch((err) => {
    logger.error(`Fatal error in pipeline: ${err}`);
  });
}
