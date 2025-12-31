import { config } from './config';
import { logger } from './utils/logger';
import { MovieSelector, type MovieAssets } from './modules/movie-selector';
import { NfoParser } from './modules/nfo-parser';
import { SubtitleParser } from './modules/subtitle-parser';
import { LlmAnalyzer } from './modules/llm-analyzer';
import { TtsGenerator } from './modules/tts-generator';
import { TitleCardGenerator } from './modules/title-card';
import { ClipExtractor } from './modules/clip-extractor';
import { VideoAssembler } from './modules/video-assembler';
import fs from 'fs-extra';
import path from 'path';

export async function runPipeline() {
  logger.info('--- Starting Automated Movie Trivia Pipeline ---');

  const movieSelector = new MovieSelector(config.paths.movies);
  const nfoParser = new NfoParser();
  const subtitleParser = new SubtitleParser();
  const llmAnalyzer = new LlmAnalyzer();
  const ttsGenerator = new TtsGenerator();
  const titleCardGenerator = new TitleCardGenerator();
  const clipExtractor = new ClipExtractor();
  const videoAssembler = new VideoAssembler();

  // 1. Select Movie
  const availableMovies = await movieSelector.scan();
  if (availableMovies.length === 0) {
    logger.error('No valid movies found in library.');
    return;
  }

  // Pick a random movie for variety during testing
  const movieOverridePath = resolveMovieOverridePath();
  const movieAssets = movieOverridePath
    ? pickMovieByPath(availableMovies, movieOverridePath)
    : availableMovies[Math.floor(Math.random() * availableMovies.length)];

  if (!movieAssets) {
    logger.error(`Requested movie not found: ${movieOverridePath}`);
    return;
  }

  const selectionLabel = movieOverridePath ? 'Selected movie (override)' : 'Selected movie';
  logger.info(`${selectionLabel}: ${movieAssets.title}`);

  // 2. Parse Metadata
  const metadata = await nfoParser.parse(movieAssets.nfoPath);
  if (!metadata) return;

  // 3. Parse Subtitles
  const subtitles = await subtitleParser.parse(movieAssets.subtitlePath);
  if (subtitles.length === 0) return;

  // 4. Analyze with Gemini
  const analysis = await llmAnalyzer.analyze(metadata, subtitles);
  if (!analysis || !analysis.facts || analysis.facts.length === 0) {
    logger.error('Failed to generate trivia analysis.');
    return;
  }

  // 5. Generate Assets
  const runTempDir = path.join(config.paths.temp, `${Date.now()}`);
  await fs.ensureDir(runTempDir);

  const videoSegments: string[] = [];

  if (movieAssets.posterPath) {
    const posterSegPath = path.join(runTempDir, 'poster_intro.mp4');
    try {
      await videoAssembler.createImageSegment(movieAssets.posterPath, posterSegPath, 3);
      videoSegments.push(posterSegPath);
    } catch (e) {
      logger.error('Skipping poster intro due to segment creation error.');
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
        await clipExtractor.extract(movieAssets.videoPath, fact.clip_start, fact.clip_end, clipPath);
    } catch (e) {
        logger.error(`Skipping fact ${fact.number} due to clip extraction error.`);
        continue;
    }

    // Generate TTS
    const ttsResult = await ttsGenerator.generate(fact.trivia_text, audioPath);
    if (!ttsResult) {
      logger.error(`TTS failed for fact ${fact.number}. Aborting pipeline.`);
      throw new Error('TTS failed after retries.');
    }

    // Generate Title Card
    await titleCardGenerator.generate({
      number: fact.number,
      text: fact.trivia_text,
      movie: metadata.title,
      year: metadata.year
    }, imagePath);

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

  const outroText = 'Comment your favorite scene';
  const outroAudioPath = path.join(runTempDir, 'voiceover_outro.wav');
  const outroImagePath = path.join(runTempDir, 'title_outro.png');
  const outroSegPath = path.join(runTempDir, 'title_seg_outro.mp4');
  const outroNumber = analysis.facts.length + 1;
  const outroTts = await ttsGenerator.generate(outroText, outroAudioPath);
  if (!outroTts) {
    logger.error('Outro generation failed. Aborting pipeline.');
    throw new Error('TTS failed after retries.');
  }
  await titleCardGenerator.generate({
    number: outroNumber,
    text: outroText,
    movie: metadata.title,
    year: metadata.year
  }, outroImagePath);
  await videoAssembler.createTitleSegment(outroImagePath, outroAudioPath, outroSegPath);
  videoSegments.push(outroSegPath);

  if (videoSegments.length === 0) {
      logger.error('No segments created. Aborting assembly.');
      return;
  }

  // 6. Assemble Final Video
  const finalOutputDir = path.join(config.paths.output, new Date().toISOString().split('T')[0]);
  await fs.ensureDir(finalOutputDir);
  const finalVideoPath = path.join(finalOutputDir, `${metadata.title.replace(/\s+/g, '_')}_final.mp4`);

  await videoAssembler.assemble(videoSegments, finalVideoPath);
  await fs.writeJson(
    path.join(finalOutputDir, `${metadata.title.replace(/\s+/g, '_')}_metadata.json`),
    {
      movie_title: analysis.movie_title,
      video_title: analysis.video_title,
      video_description: analysis.video_description
    },
    { spaces: 2 }
  );

  logger.info(`--- Pipeline Complete! Video saved to: ${finalVideoPath} ---`);
}

if (require.main === module) {
  runPipeline().catch(err => {
    logger.error(`Fatal error in pipeline: ${err}`);
  });
}

function resolveMovieOverridePath(): string | null {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--movie') {
      const value = args[index + 1];
      if (!value) {
        logger.error('Missing value for --movie.');
        return null;
      }
      return value;
    }

    if (arg.startsWith('--movie=')) {
      const value = arg.slice('--movie='.length);
      if (!value) {
        logger.error('Missing value for --movie.');
        return null;
      }
      return value;
    }
  }

  return null;
}

function pickMovieByPath(
  movies: MovieAssets[],
  overridePath: string
): MovieAssets | null {
  const candidates = buildOverrideCandidates(overridePath);
  for (const candidate of candidates) {
    const exactMatch = movies.find(
      (movie) => path.resolve(movie.videoPath) === candidate
    );
    if (exactMatch) {
      return exactMatch;
    }

    const candidateLoose = normalizePathForMatch(candidate);
    const loosePathMatch = movies.find(
      (movie) => normalizePathForMatch(movie.videoPath) === candidateLoose
    );
    if (loosePathMatch) {
      return loosePathMatch;
    }
  }

  const overrideBase = path.basename(overridePath);
  const baseMatches = movies.filter(
    (movie) => path.basename(movie.videoPath) === overrideBase
  );

  if (baseMatches.length === 1) {
    return baseMatches[0];
  }

  if (baseMatches.length > 1) {
    logger.error(`Multiple movies match the filename "${overrideBase}". Use a full path.`);
  }

  const overrideBaseLoose = normalizeNameForMatch(overrideBase);
  const looseBaseMatches = movies.filter(
    (movie) => normalizeNameForMatch(path.basename(movie.videoPath)) === overrideBaseLoose
  );

  if (looseBaseMatches.length === 1) {
    return looseBaseMatches[0];
  }

  if (looseBaseMatches.length > 1) {
    logger.error(
      `Multiple movies loosely match the filename "${overrideBase}". Use a full path.`
    );
  }

  return null;
}

function buildOverrideCandidates(overridePath: string): string[] {
  if (path.isAbsolute(overridePath)) {
    return [path.resolve(overridePath)];
  }

  return [
    path.resolve(overridePath),
    path.resolve(config.paths.movies, overridePath),
  ];
}

function normalizeNameForMatch(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizePathForMatch(value: string): string {
  return normalizeNameForMatch(value.replace(/\\/g, '/'));
}
