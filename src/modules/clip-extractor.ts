import ffmpeg from 'fluent-ffmpeg';
import { logger } from '../utils/logger';
import { config } from '../config';

export class ClipExtractor {
  async extract(inputPath: string, start: string, end: string, outputPath: string): Promise<string> {
    logger.info(`Extracting clip from ${start} to ${end}`);
    
    // Convert timestamps to seconds for calculation if needed, but ffmpeg handles HH:MM:SS,ms
    // We need duration.
    const startTime = this.parseTime(start);
    const endTime = this.parseTime(end);
    const duration = endTime - startTime;
    const ffmpegStart = this.formatForFfmpeg(start);
    const audioStreamIndex = await this.pickAudioStreamIndex(inputPath);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .setStartTime(ffmpegStart)
        .setDuration(duration)
        // Vertical Crop Logic: Center crop to 9:16 aspect ratio
        // Scale height to target (1920), then crop width to 1080
        .videoFilters([
            `scale=-1:${config.video.targetHeight}`, 
            `crop=${config.video.targetWidth}:${config.video.targetHeight}`
        ]);

      if (audioStreamIndex !== null) {
        command
          .audioCodec('aac')
          .audioFrequency(24000)
          .audioChannels(1);
      }

      const outputOptions = [
        '-map 0:v:0',
        '-c:v libx264',
        `-r ${config.video.fps}`,
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ];

      if (audioStreamIndex !== null) {
        outputOptions.push(`-map 0:a:${audioStreamIndex}?`);
      } else {
        logger.warn('No audio stream found for clip; exporting video-only.');
      }

      command
        .outputOptions(outputOptions)
        .on('end', () => {
          logger.info(`Clip saved to ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`Error extracting clip: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
  }

  private parseTime(timeStr: string): number {
    // HH:MM:SS,ms -> seconds
    const [hms, ms] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + (parseInt(ms, 10) / 1000);
  }

  private formatForFfmpeg(timeStr: string): string {
    return timeStr.replace(',', '.');
  }

  private async pickAudioStreamIndex(inputPath: string): Promise<number | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) {
          logger.warn(`ffprobe failed to read audio streams: ${err.message}`);
          resolve(null);
          return;
        }

        const streams = data.streams || [];
        const audioStreams = streams.filter((stream) => stream.codec_type === 'audio');
        if (audioStreams.length === 0) {
          resolve(null);
          return;
        }

        const english = audioStreams.find((stream) => {
          const language = (stream.tags?.language || '').toLowerCase();
          return language === 'eng' || language === 'en';
        });

        const selected = english ?? audioStreams[0];
        const audioIndex = audioStreams.indexOf(selected);
        resolve(audioIndex >= 0 ? audioIndex : null);
      });
    });
  }
}
