import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';

export interface TvEpisodeAssets {
  showFolder: string;
  showTitle: string;
  tvshowNfoPath: string;
  seasonFolder: string;
  seasonNumber: number;
  seasonNfoPath?: string;
  episodeNfoPath: string;
  episodeVideoPath: string;
  subtitlePath: string;
  episodeThumbPath?: string;
  seasonPosterPath?: string;
  seriesPosterPath?: string;
  seasonBannerPath?: string;
  seriesBannerPath?: string;
  fanartPath?: string;
  landscapePath?: string;
  clearlogoPath?: string;
  logoPath?: string;
}

const VIDEO_EXT_RE = /\.(mp4|mkv|avi|mov)$/i;
const SUBTITLE_EXT_RE = /\.srt$/i;

export class TvSelector {
  private libraryPath: string;

  constructor(libraryPath: string) {
    this.libraryPath = libraryPath;
  }

  async scan(): Promise<TvEpisodeAssets[]> {
    logger.info(`Scanning TV library: ${this.libraryPath}`);
    if (!(await fs.pathExists(this.libraryPath))) {
      logger.error(`TV library path does not exist: ${this.libraryPath}`);
      return [];
    }

    const showEntries = await fs.readdir(this.libraryPath);
    const episodes: TvEpisodeAssets[] = [];

    for (const showEntry of showEntries) {
      const showFolder = path.join(this.libraryPath, showEntry);
      const showStat = await fs.stat(showFolder);
      if (!showStat.isDirectory()) {
        continue;
      }

      const tvshowNfoPath = path.join(showFolder, 'tvshow.nfo');
      if (!(await fs.pathExists(tvshowNfoPath))) {
        logger.warn(`Skipping show without tvshow.nfo: ${showEntry}`);
        continue;
      }

      const showFiles = await fs.readdir(showFolder);
      const seriesPosterPath = this.findOptionalFile(showFolder, showFiles, /^poster\.(jpg|png|jpeg)$/i);
      const seriesBannerPath = this.findOptionalFile(showFolder, showFiles, /^banner\.(jpg|png|jpeg)$/i);
      const fanartPath = this.findOptionalFile(showFolder, showFiles, /^fanart\.(jpg|png|jpeg)$/i);
      const landscapePath = this.findOptionalFile(showFolder, showFiles, /^landscape\.(jpg|png|jpeg)$/i);
      const clearlogoPath = this.findOptionalFile(showFolder, showFiles, /^clearlogo\.(png)$/i);
      const logoPath = this.findOptionalFile(showFolder, showFiles, /^logo\.(png)$/i);

      const seasonFolders = showFiles
        .filter((entry) => /^Season\s+\d+/i.test(entry))
        .map((entry) => path.join(showFolder, entry));

      for (const seasonFolder of seasonFolders) {
        const seasonName = path.basename(seasonFolder);
        const seasonNumber = this.parseSeasonNumber(seasonName);
        if (seasonNumber === null) {
          continue;
        }

        const seasonNfoPath = path.join(seasonFolder, 'season.nfo');
        const seasonFiles = await fs.readdir(seasonFolder);

        const seasonPosterPath = this.findSeasonAsset(
          showFolder,
          showFiles,
          seasonNumber,
          'poster'
        );
        const seasonBannerPath = this.findSeasonAsset(
          showFolder,
          showFiles,
          seasonNumber,
          'banner'
        );

        const episodeNfos = seasonFiles.filter((file) => file.endsWith('.nfo'));
        for (const episodeNfo of episodeNfos) {
          if (episodeNfo === 'season.nfo') {
            continue;
          }

          const baseName = episodeNfo.replace(/\.nfo$/i, '');
          const episodeVideo = seasonFiles.find((file) => VIDEO_EXT_RE.test(file) && file.startsWith(baseName));
          if (!episodeVideo) {
            continue;
          }

          const subtitleFile = this.pickSubtitle(seasonFiles, baseName);
          if (!subtitleFile) {
            continue;
          }

          const episodeThumbPath = this.findEpisodeThumb(seasonFolder, seasonFiles, baseName);

          episodes.push({
            showFolder,
            showTitle: showEntry,
            tvshowNfoPath,
            seasonFolder,
            seasonNumber,
            seasonNfoPath: (await fs.pathExists(seasonNfoPath)) ? seasonNfoPath : undefined,
            episodeNfoPath: path.join(seasonFolder, episodeNfo),
            episodeVideoPath: path.join(seasonFolder, episodeVideo),
            subtitlePath: path.join(seasonFolder, subtitleFile),
            episodeThumbPath,
            seasonPosterPath,
            seriesPosterPath,
            seasonBannerPath,
            seriesBannerPath,
            fanartPath,
            landscapePath,
            clearlogoPath,
            logoPath,
          });
        }
      }
    }

    logger.info(`Found ${episodes.length} valid episodes with subtitles.`);
    return episodes;
  }

  private parseSeasonNumber(name: string): number | null {
    const match = name.match(/Season\s+(\d+)/i);
    if (!match) {
      return null;
    }
    return parseInt(match[1], 10);
  }

  private findOptionalFile(folder: string, files: string[], pattern: RegExp): string | undefined {
    const match = files.find((file) => pattern.test(file));
    return match ? path.join(folder, match) : undefined;
  }

  private findSeasonAsset(
    showFolder: string,
    showFiles: string[],
    seasonNumber: number,
    type: 'poster' | 'banner'
  ): string | undefined {
    const seasonLabel = seasonNumber.toString().padStart(2, '0');
    const patterns = [
      new RegExp(`^season${seasonLabel}-${type}\\.(jpg|png|jpeg)$`, 'i'),
      new RegExp(`^season${seasonNumber}-${type}\\.(jpg|png|jpeg)$`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = showFiles.find((file) => pattern.test(file));
      if (match) {
        return path.join(showFolder, match);
      }
    }

    return undefined;
  }

  private pickSubtitle(files: string[], baseName: string): string | null {
    const subtitleFiles = files.filter((file) => SUBTITLE_EXT_RE.test(file) && file.startsWith(baseName));
    if (subtitleFiles.length === 0) {
      return null;
    }

    const preferred = subtitleFiles.find((file) => /\.en(\.|$)/i.test(file) || /\.eng(\.|$)/i.test(file));
    return preferred || subtitleFiles[0];
  }

  private findEpisodeThumb(folder: string, files: string[], baseName: string): string | undefined {
    const thumb = files.find(
      (file) => file.startsWith(baseName) && /thumb\.(jpg|png|jpeg)$/i.test(file)
    );
    return thumb ? path.join(folder, thumb) : undefined;
  }
}
