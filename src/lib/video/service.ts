import { invoke } from "@tauri-apps/api/core";

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

export interface TitleSegmentRequest {
  image: string;
  audio: string;
  output: string;
  dimensions?: VideoDimensions;
}

export interface AssembleVideoRequest {
  segments: string[];
  output: string;
}

export interface ImageSegmentRequest {
  image: string;
  duration: number;
  output: string;
  dimensions?: VideoDimensions;
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
  await invoke("extract_clip", { request });
}

export async function createTitleSegment(
  request: TitleSegmentRequest,
): Promise<void> {
  await invoke("create_title_segment", { request });
}

export async function assembleVideo(
  request: AssembleVideoRequest,
): Promise<void> {
  await invoke("assemble_video", { request });
}

export async function createImageSegment(
  request: ImageSegmentRequest,
): Promise<void> {
  await invoke("create_image_segment", { request });
}

export async function getVideoStatus(): Promise<VideoServiceStatus> {
  return invoke("get_video_status");
}
