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

export interface GpuEncoderAvailability {
  nvenc: boolean;
  vaapi: boolean;
  videotoolbox: boolean;
  software: boolean;
}

export interface GpuDetectionResult {
  availability: GpuEncoderAvailability;
  detected_encoders: string[];
  primary_encoder: string;
  validation_status: 'Validated' | 'ParseOnly' | { Failed: string };
}

export interface VideoServiceStatus {
  service_type: string;
  ffmpeg_health: FFmpegHealth | null;
  gpu_detection: GpuDetectionResult | null;
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

export interface EncoderSelection {
  selected_encoder: string;
  preset: string;
  is_hardware: boolean;
  fallback_available: boolean;
  selection_reason: string;
}

export interface EncoderConfigResponse {
  encoder: string;
  preset: string;
  available_encoders: string[];
  primary_encoder: string;
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

export async function detectGpuEncoders(): Promise<GpuDetectionResult> {
  return invoke('detect_gpu_encoders');
}

export async function getEncoderConfig(): Promise<EncoderConfigResponse> {
  return invoke('get_encoder_config');
}

export async function setEncoderPreference(
  encoder?: string,
  preset?: string
): Promise<EncoderSelection> {
  return invoke('set_encoder_preference', { request: { encoder, preset } });
}

export async function selectBestEncoder(): Promise<EncoderSelection> {
  return invoke('select_best_encoder');
}
