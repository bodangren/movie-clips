import type { YouTubeAuth } from './auth';

interface UploadError extends Error {
  statusCode?: number;
}

export interface UploadVideoOptions {
  videoFile: File;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  categoryId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface YouTubeUploader {
  uploadVideo(
    options: UploadVideoOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string>;
  cancelUpload(): void;
}

const UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';
const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

export function createYouTubeUploader(auth: YouTubeAuth): YouTubeUploader {
  let abortController: AbortController | null = null;

  return {
    async uploadVideo(
      options: UploadVideoOptions,
      onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
      const accessToken = await auth.getValidAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      abortController = new AbortController();
      const { signal } = abortController;

      try {
        // Step 1: Initiate resumable upload session
        const sessionUri = await initiateUpload(accessToken, options, signal);

        // Step 2: Upload video chunks
        const videoId = await uploadChunks(
          sessionUri,
          options.videoFile,
          accessToken,
          signal,
          onProgress
        );

        return videoId;
      } catch (error) {
        if (error instanceof Error && error.message === 'Upload cancelled') {
          throw error;
        }
        throw error;
      } finally {
        abortController = null;
      }
    },

    cancelUpload(): void {
      if (abortController) {
        abortController.abort();
      }
    },
  };
}

async function initiateUpload(
  accessToken: string,
  options: UploadVideoOptions,
  signal: AbortSignal
): Promise<string> {
  const metadata = {
    snippet: {
      title: options.title,
      description: options.description,
      tags: options.tags,
      categoryId: options.categoryId || '1', // Default to Film & Animation
    },
    status: {
      privacyStatus: options.privacyStatus,
    },
  };

  const response = await fetch(`${UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
    signal,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: `HTTP ${response.status}` } }));
    throw new Error(
      `Upload initiation failed: ${response.status} - ${error.error?.message || 'Unknown error'}`
    );
  }

  const sessionUri = response.headers.get('Location');
  if (!sessionUri) {
    throw new Error('No upload session URL returned');
  }

  return sessionUri;
}

async function uploadChunks(
  sessionUri: string,
  videoFile: File,
  accessToken: string,
  signal: AbortSignal,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const totalSize = videoFile.size;
  let uploadedBytes = 0;

  // For small files (<= CHUNK_SIZE), upload in one chunk
  if (totalSize <= CHUNK_SIZE) {
    return uploadChunkWithRetry(
      sessionUri,
      videoFile,
      0,
      totalSize - 1,
      totalSize,
      accessToken,
      signal,
      loaded => onProgress?.({ loaded: uploadedBytes + loaded, total: totalSize })
    );
  }

  // For large files, upload in chunks
  while (uploadedBytes < totalSize) {
    const endByte = Math.min(uploadedBytes + CHUNK_SIZE - 1, totalSize - 1);

    const videoId = await uploadChunkWithRetry(
      sessionUri,
      videoFile,
      uploadedBytes,
      endByte,
      totalSize,
      accessToken,
      signal,
      loaded => onProgress?.({ loaded: uploadedBytes + loaded, total: totalSize })
    );

    // If we got a video ID, upload is complete
    if (videoId) {
      onProgress?.({ loaded: totalSize, total: totalSize });
      return videoId;
    }

    uploadedBytes = endByte + 1;
  }

  throw new Error('Upload completed but no video ID received');
}

async function uploadChunkWithRetry(
  sessionUri: string,
  videoFile: File,
  startByte: number,
  endByte: number,
  totalSize: number,
  accessToken: string,
  signal: AbortSignal,
  onChunkProgress?: (loaded: number) => void
): Promise<string | null> {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const chunk = videoFile.slice(startByte, endByte + 1);
      const result = await uploadChunk(
        sessionUri,
        chunk,
        startByte,
        endByte,
        totalSize,
        accessToken,
        signal,
        onChunkProgress
      );

      // If result is a video ID, upload is complete
      if (result !== null) {
        return result;
      }

      // Chunk uploaded successfully but not final, return null
      return null;
    } catch (error) {
      if (error instanceof Error && error.message === 'Upload cancelled') {
        throw error;
      }

      const statusCode = (error as UploadError).statusCode;

      // 4xx errors are client errors, don't retry
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        throw new Error(
          `Upload failed: ${statusCode} - ${error instanceof Error ? error.message : 'Unknown error'}`,
          { cause: error }
        );
      }

      retries++;
      if (retries > MAX_RETRIES) {
        throw new Error(
          `Upload failed after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { cause: error }
        );
      }

      // Exponential backoff
      const delay = RETRY_DELAY_BASE * Math.pow(2, retries - 1);
      await sleep(delay);
    }
  }

  throw new Error('Upload failed after max retries');
}

async function uploadChunk(
  sessionUri: string,
  chunk: Blob,
  startByte: number,
  endByte: number,
  totalSize: number,
  accessToken: string,
  signal: AbortSignal,
  _onProgress?: (loaded: number) => void
): Promise<string | null> {
  const response = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Content-Range': `bytes ${startByte}-${endByte}/${totalSize}`,
    },
    body: chunk,
    signal,
  });

  if (response.ok) {
    // Final response contains video data
    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return data.id || null;
    }
    // 308 Resume Incomplete - chunk accepted, more to come
    return null;
  }

  if (response.status >= 400 && response.status < 500) {
    const error: UploadError = new Error(response.statusText || `HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  const error: UploadError = new Error(response.statusText || `HTTP ${response.status}`);
  error.statusCode = response.status;
  throw error;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
