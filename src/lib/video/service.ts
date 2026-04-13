import { invoke } from '@tauri-apps/api/core';

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface ExtractClipRequest {
  input: string;
  start: string;
  end: string;
  output: string;
  dimensions?: VideoDimensions;
}

export interface RenderVideoRequest {
  metadata_json: string;
  output: string;
}

export interface VideoServiceStatus {
  service_type: string;
  ffmpeg_health: FFmpegHealth | null;
  metrics: VideoServiceMetrics;
  config: VideoConfigSummary;
}

export interface FFmpegHealth {
  available: boolean;
  version: string | null;
  path: string;
  error: string | null;
}

export interface VideoServiceMetrics {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  last_operations: OperationMetrics[];
  total_duration_ms: number;
}

export interface OperationMetrics {
  operation: string;
  duration_ms: number;
  success: boolean;
  error: string | null;
}

export interface VideoConfigSummary {
  ffmpeg_path: string;
  temp_dir: string | null;
  dimensions: VideoDimensions;
}

export async function extractClip(request: ExtractClipRequest): Promise<void> {
  await invoke('extract_clip', { request });
}

export async function renderVideo(request: RenderVideoRequest): Promise<void> {
  await invoke('render_video', { request });
}

export async function getVideoStatus(): Promise<VideoServiceStatus> {
  return invoke('get_video_status');
}
