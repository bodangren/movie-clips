use crate::services::encoder_builder::{EncoderConfig, EncoderType, QualityPreset};
use crate::services::encoder_selector::EncoderSelector;
use crate::services::gpu_detection::{GpuDetectionResult, GpuDetector};
use crate::services::video_service::VideoError;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tokio::fs;
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BenchmarkResult {
    pub encoder: String,
    pub encoder_type: EncoderType,
    pub preset: QualityPreset,
    pub duration_ms: u64,
    pub file_size_bytes: u64,
    pub psnr_score: Option<f64>,
    pub success: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BenchmarkSummary {
    pub results: Vec<BenchmarkResult>,
    pub reference_path: String,
    pub fastest_encoder: Option<String>,
    pub smallest_encoder: Option<String>,
    pub best_quality_encoder: Option<String>,
}

pub struct BenchmarkRunner {
    ffmpeg_path: String,
    temp_dir: PathBuf,
    reference_duration_secs: u32,
    reference_width: u32,
    reference_height: u32,
    reference_fps: u32,
}

impl BenchmarkRunner {
    pub fn new(
        ffmpeg_path: Option<String>,
        temp_dir: Option<PathBuf>,
    ) -> Self {
        Self {
            ffmpeg_path: ffmpeg_path.unwrap_or_else(|| "ffmpeg".to_string()),
            temp_dir: temp_dir.unwrap_or_else(|| std::env::temp_dir().join("movie_clips_benchmark")),
            reference_duration_secs: 10,
            reference_width: 640,
            reference_height: 480,
            reference_fps: 30,
        }
    }

    pub async fn run_full_benchmark(
        &self,
        gpu_result: &GpuDetectionResult,
        preset: QualityPreset,
    ) -> Result<BenchmarkSummary, VideoError> {
        fs::create_dir_all(&self.temp_dir)
            .await
            .map_err(|e| VideoError::FFmpegError(format!("Failed to create temp dir: {}", e)))?;

        let reference_path = self.temp_dir.join("reference.mp4");
        self.generate_reference_video(&reference_path).await?;

        let selector = EncoderSelector::new(None, preset.clone());
        let selection = selector.select(gpu_result);
        
        let mut results = Vec::new();
        let mut encoders_to_test = Vec::new();

        // Always test software
        encoders_to_test.push(EncoderType::Software);

        // Test available hardware encoders
        if gpu_result.availability.nvenc {
            encoders_to_test.push(EncoderType::Nvenc);
        }
        if gpu_result.availability.vaapi {
            encoders_to_test.push(EncoderType::Vaapi);
        }
        if gpu_result.availability.videotoolbox {
            encoders_to_test.push(EncoderType::VideoToolbox);
        }

        for encoder in encoders_to_test {
            let result = self.benchmark_encoder(
                encoder,
                preset.clone(),
                &reference_path,
            ).await;
            results.push(result);
        }

        let fastest = results
            .iter()
            .filter(|r| r.success)
            .min_by_key(|r| r.duration_ms)
            .map(|r| r.encoder.clone());

        let smallest = results
            .iter()
            .filter(|r| r.success)
            .min_by_key(|r| r.file_size_bytes)
            .map(|r| r.encoder.clone());

        let best_quality = results
            .iter()
            .filter(|r| r.success && r.psnr_score.is_some())
            .max_by(|a, b| {
                a.psnr_score
                    .partial_cmp(&b.psnr_score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|r| r.encoder.clone());

        Ok(BenchmarkSummary {
            results,
            reference_path: reference_path.to_string_lossy().to_string(),
            fastest_encoder: fastest,
            smallest_encoder: smallest,
            best_quality_encoder: best_quality,
        })
    }

    async fn generate_reference_video(
        &self,
        output: &PathBuf,
    ) -> Result<(), VideoError> {
        let args = vec![
            "-y".to_string(),
            "-f".to_string(),
            "lavfi".to_string(),
            "-i".to_string(),
            format!(
                "testsrc=duration={}:size={}x{}:rate={}",
                self.reference_duration_secs,
                self.reference_width,
                self.reference_height,
                self.reference_fps
            ),
            "-f".to_string(),
            "lavfi".to_string(),
            "-i".to_string(),
            format!("sine=frequency=1000:duration={}", self.reference_duration_secs),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            output.to_string_lossy().to_string(),
        ];

        self.run_ffmpeg(&args).await
    }

    async fn benchmark_encoder(
        &self,
        encoder: EncoderType,
        preset: QualityPreset,
        reference_path: &PathBuf,
    ) -> BenchmarkResult {
        let output_path = self
            .temp_dir
            .join(format!("benchmark_{}.mp4", encoder.as_str()));

        let config = EncoderConfig {
            encoder: encoder.clone(),
            preset: preset.clone(),
            width: self.reference_width,
            height: self.reference_height,
            fps: self.reference_fps,
        };

        let start = Instant::now();
        let encode_result = self.encode_with_config(&config, reference_path, &output_path).await;
        let duration = start.elapsed();

        match encode_result {
            Ok(_) => {
                let file_size = fs::metadata(&output_path)
                    .await
                    .map(|m| m.len())
                    .unwrap_or(0);

                let psnr = self.calculate_psnr(reference_path, &output_path).await.ok();

                BenchmarkResult {
                    encoder: encoder.as_str().to_string(),
                    encoder_type: encoder,
                    preset: preset.clone(),
                    duration_ms: duration.as_millis() as u64,
                    file_size_bytes: file_size,
                    psnr_score: psnr,
                    success: true,
                    error_message: None,
                }
            }
            Err(e) => BenchmarkResult {
                encoder: encoder.as_str().to_string(),
                encoder_type: encoder,
                preset: preset.clone(),
                duration_ms: duration.as_millis() as u64,
                file_size_bytes: 0,
                psnr_score: None,
                success: false,
                error_message: Some(e.to_string()),
            },
        }
    }

    async fn encode_with_config(
        &self,
        config: &EncoderConfig,
        input: &PathBuf,
        output: &PathBuf,
    ) -> Result<(), VideoError> {
        use crate::services::encoder_builder::EncodeCommandBuilder;
        let builder = EncodeCommandBuilder::new(config.clone());
        let args = builder.build_args(
            &input.to_string_lossy().to_string(),
            &output.to_string_lossy().to_string(),
        );
        self.run_ffmpeg(&args).await
    }

    async fn calculate_psnr(
        &self,
        reference: &PathBuf,
        encoded: &PathBuf,
    ) -> Result<f64, VideoError> {
        let args = vec![
            "-i".to_string(),
            reference.to_string_lossy().to_string(),
            "-i".to_string(),
            encoded.to_string_lossy().to_string(),
            "-lavfi".to_string(),
            "psnr".to_string(),
            "-f".to_string(),
            "null".to_string(),
            "-".to_string(),
        ];

        let output = Command::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .await
            .map_err(|e| VideoError::FFmpegError(format!("PSNR calculation failed: {}", e)))?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // Parse PSNR output: "PSNR y:42.34 u:45.67 v:44.21 average:43.12 min:38.90 max:47.23"
        let psnr_line = stderr
            .lines()
            .find(|line| line.contains("average:"));

        match psnr_line {
            Some(line) => {
                let avg_part = line.split("average:").nth(1).ok_or_else(|| {
                    VideoError::FFmpegError("Failed to parse PSNR average".to_string())
                })?;
                let avg_str = avg_part.split_whitespace().next().ok_or_else(|| {
                    VideoError::FFmpegError("Failed to parse PSNR value".to_string())
                })?;
                avg_str
                    .parse::<f64>()
                    .map_err(|e| VideoError::FFmpegError(format!("Invalid PSNR value: {}", e)))
            }
            None => Err(VideoError::FFmpegError(
                "PSNR output not found in FFmpeg stderr".to_string(),
            )),
        }
    }

    async fn run_ffmpeg(&self, args: &[String]) -> Result<(), VideoError> {
        let status = Command::new(&self.ffmpeg_path)
            .args(args)
            .status()
            .await
            .map_err(|e| VideoError::FFmpegError(format!("Failed to run FFmpeg: {}", e)))?;

        if status.success() {
            Ok(())
        } else {
            Err(VideoError::FFmpegError(format!(
                "FFmpeg exited with code {:?}",
                status.code()
            )))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_benchmark_result_serialization() {
        let result = BenchmarkResult {
            encoder: "h264_nvenc".to_string(),
            encoder_type: EncoderType::Nvenc,
            preset: QualityPreset::Fast,
            duration_ms: 1500,
            file_size_bytes: 1024000,
            psnr_score: Some(42.5),
            success: true,
            error_message: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("h264_nvenc"));
        assert!(json.contains("1500"));

        let deserialized: BenchmarkResult = serde_json::from_str(&json).unwrap();
        assert_eq!(result, deserialized);
    }

    #[test]
    fn test_benchmark_summary_serialization() {
        let summary = BenchmarkSummary {
            results: vec![BenchmarkResult {
                encoder: "libx264".to_string(),
                encoder_type: EncoderType::Software,
                preset: QualityPreset::Balanced,
                duration_ms: 3000,
                file_size_bytes: 2048000,
                psnr_score: Some(45.0),
                success: true,
                error_message: None,
            }],
            reference_path: "/tmp/reference.mp4".to_string(),
            fastest_encoder: Some("libx264".to_string()),
            smallest_encoder: Some("libx264".to_string()),
            best_quality_encoder: Some("libx264".to_string()),
        };

        let json = serde_json::to_string(&summary).unwrap();
        assert!(json.contains("libx264"));
        assert!(json.contains("fastest_encoder"));

        let deserialized: BenchmarkSummary = serde_json::from_str(&json).unwrap();
        assert_eq!(summary, deserialized);
    }

    #[test]
    fn test_benchmark_runner_new_defaults() {
        let runner = BenchmarkRunner::new(None, None);
        assert_eq!(runner.ffmpeg_path, "ffmpeg");
        assert!(runner.temp_dir.to_string_lossy().contains("movie_clips_benchmark"));
        assert_eq!(runner.reference_duration_secs, 10);
        assert_eq!(runner.reference_width, 640);
    }

    #[test]
    fn test_benchmark_runner_custom_paths() {
        let temp = PathBuf::from("/custom/temp");
        let runner = BenchmarkRunner::new(Some("/usr/bin/ffmpeg".to_string()), Some(temp.clone()));
        assert_eq!(runner.ffmpeg_path, "/usr/bin/ffmpeg");
        assert_eq!(runner.temp_dir, temp);
    }

    #[test]
    fn test_benchmark_summary_best_calculations() {
        let results = vec![
            BenchmarkResult {
                encoder: "h264_nvenc".to_string(),
                encoder_type: EncoderType::Nvenc,
                preset: QualityPreset::Fast,
                duration_ms: 1000,
                file_size_bytes: 1500000,
                psnr_score: Some(40.0),
                success: true,
                error_message: None,
            },
            BenchmarkResult {
                encoder: "libx264".to_string(),
                encoder_type: EncoderType::Software,
                preset: QualityPreset::Balanced,
                duration_ms: 3000,
                file_size_bytes: 1200000,
                psnr_score: Some(45.0),
                success: true,
                error_message: None,
            },
        ];

        let fastest = results
            .iter()
            .filter(|r| r.success)
            .min_by_key(|r| r.duration_ms)
            .map(|r| r.encoder.clone());

        let smallest = results
            .iter()
            .filter(|r| r.success)
            .min_by_key(|r| r.file_size_bytes)
            .map(|r| r.encoder.clone());

        let best_quality = results
            .iter()
            .filter(|r| r.success && r.psnr_score.is_some())
            .max_by(|a, b| {
                a.psnr_score
                    .partial_cmp(&b.psnr_score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|r| r.encoder.clone());

        assert_eq!(fastest, Some("h264_nvenc".to_string()));
        assert_eq!(smallest, Some("libx264".to_string()));
        assert_eq!(best_quality, Some("libx264".to_string()));
    }

    #[test]
    fn test_benchmark_result_failure_state() {
        let result = BenchmarkResult {
            encoder: "h264_nvenc".to_string(),
            encoder_type: EncoderType::Nvenc,
            preset: QualityPreset::Fast,
            duration_ms: 500,
            file_size_bytes: 0,
            psnr_score: None,
            success: false,
            error_message: Some("Encoder not available".to_string()),
        };

        assert!(!result.success);
        assert_eq!(result.error_message, Some("Encoder not available".to_string()));
        assert_eq!(result.file_size_bytes, 0);
        assert!(result.psnr_score.is_none());
    }

    #[test]
    fn test_psnr_parsing_logic() {
        let psnr_line = "PSNR y:42.34 u:45.67 v:44.21 average:43.12 min:38.90 max:47.23";
        let avg_part = psnr_line.split("average:").nth(1).unwrap();
        let avg_str = avg_part.split_whitespace().next().unwrap();
        let psnr: f64 = avg_str.parse().unwrap();
        assert!((psnr - 43.12).abs() < 0.01);
    }

    #[test]
    fn test_psnr_parsing_missing_average() {
        let bad_line = "PSNR y:42.34 u:45.67 v:44.21";
        assert!(bad_line.split("average:").nth(1).is_none());
    }
}
