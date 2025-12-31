import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra';
import { logger } from '../utils/logger';
import { config } from '../config';

export class VideoAssembler {
  async createImageSegment(
    imagePath: string,
    outputPath: string,
    durationSeconds: number
  ): Promise<string> {
    logger.info(`Creating image segment: ${imagePath} (${durationSeconds}s)`);

    const width = config.video.targetWidth;
    const height = config.video.targetHeight;
    const videoFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop()
        .input('anullsrc=channel_layout=mono:sample_rate=24000')
        .inputOptions(['-f lavfi'])
        .videoFilters([videoFilter])
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioFrequency(24000)
        .audioChannels(1)
        .outputOptions([
          `-t ${durationSeconds}`,
          `-r ${config.video.fps}`,
          '-pix_fmt yuv420p',
          `-s ${width}x${height}`,
          '-shortest'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          logger.error(`Error creating image segment: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async createTitleSegment(imagePath: string, audioPath: string, outputPath: string): Promise<string> {
    logger.info(`Creating title segment: ${imagePath} + ${audioPath}`);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop() // Loop the image
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioFrequency(24000)
        .audioChannels(1)
        .outputOptions([
          '-tune stillimage',
          '-shortest', // Stop when audio ends
          `-r ${config.video.fps}`,
          '-pix_fmt yuv420p',
          `-s ${config.video.targetWidth}x${config.video.targetHeight}`
        ])
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
            logger.error(`Error creating title segment: ${err.message}`);
            reject(err);
        })
        .save(outputPath);
    });
  }

  async assemble(videoSegments: string[], outputPath: string): Promise<string> {
    logger.info(`Assembling ${videoSegments.length} segments into ${outputPath}`);

    // Create a text file list for ffmpeg concat demuxer
    const listPath = `${outputPath}.txt`;
    const fileContent = videoSegments.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, fileContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy']) // Stream copy for speed if formats match
        .on('end', async () => {
          logger.info(`Final video saved to ${outputPath}`);
          await fs.remove(listPath); // Cleanup list
          resolve(outputPath);
        })
        .on('error', (err) => {
            logger.error(`Error assembling video: ${err.message}`);
            reject(err);
        })
        .save(outputPath);
    });
  }
}
