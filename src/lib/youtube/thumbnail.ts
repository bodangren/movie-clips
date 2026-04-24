export interface ThumbnailGenerator {
  /**
   * Extract a frame from a video at the specified timestamp
   * @param videoPath Path to the video file
   * @param timestamp Seconds from start (default: 0)
   * @returns Blob containing the extracted frame
   */
  extractFrame(videoPath: string, timestamp?: number): Promise<Blob>;

  /**
   * Resize an image to YouTube thumbnail dimensions (1280x720)
   * @param imageBlob Input image blob
   * @returns Resized JPEG blob
   */
  resizeThumbnail(imageBlob: Blob): Promise<Blob>;

  /**
   * Generate a thumbnail from a video (extract + resize)
   * @param videoPath Path to the video file
   * @param timestamp Seconds from start (default: 0)
   * @returns Resized JPEG thumbnail blob
   */
  generateFromVideo(videoPath: string, timestamp?: number): Promise<Blob>;
}

/**
 * Creates a thumbnail generator
 *
 * TODO: In Tauri, this would use Rust commands to run FFmpeg:
 * - Extract frame: ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 output.png
 * - Resize: ffmpeg -i input.png -vf scale=1280:720 output.jpg
 *
 * For now, returns mock blobs for testing
 */
export function createThumbnailGenerator(): ThumbnailGenerator {
  return {
    async extractFrame(videoPath: string, timestamp = 0): Promise<Blob> {
      if (!videoPath || videoPath.trim() === '') {
        throw new Error('Invalid video path');
      }

      if (timestamp < 0) {
        throw new Error('Invalid timestamp');
      }

      // TODO: In Tauri, invoke Rust command to run FFmpeg
      // const frameData = await invoke('extract_video_frame', { videoPath, timestamp });
      // return new Blob([frameData], { type: 'image/png' });

      // Mock implementation for testing
      return new Blob(['mock-frame-data'], { type: 'image/png' });
    },

    async resizeThumbnail(imageBlob: Blob): Promise<Blob> {
      if (!imageBlob || imageBlob.size === 0) {
        throw new Error('Invalid image data');
      }

      // TODO: In Tauri, invoke Rust command to resize with FFmpeg
      // const resizedData = await invoke('resize_image', {
      //   imageData: await imageBlob.arrayBuffer(),
      //   width: 1280,
      //   height: 720
      // });
      // return new Blob([resizedData], { type: 'image/jpeg' });

      // Mock implementation for testing
      return new Blob(['mock-resized-data'], { type: 'image/jpeg' });
    },

    async generateFromVideo(videoPath: string, timestamp = 0): Promise<Blob> {
      const frame = await this.extractFrame(videoPath, timestamp);
      return this.resizeThumbnail(frame);
    },
  };
}
