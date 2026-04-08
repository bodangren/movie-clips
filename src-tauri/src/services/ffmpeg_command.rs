use crate::services::video_service::{
    ProgressCallback, ProgressUpdate, VideoDimensions, VideoError, VideoService,
};
use async_trait::async_trait;
use std::path::Path;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

pub struct FFmpegCommandService {
    ffmpeg_path: String,
    progress_callback: Option<ProgressCallback>,
}

impl FFmpegCommandService {
    #[allow(dead_code)]
    pub fn new(ffmpeg_path: Option<String>) -> Self {
        Self {
            ffmpeg_path: ffmpeg_path.unwrap_or_else(|| "ffmpeg".to_string()),
            progress_callback: None,
        }
    }

    #[allow(dead_code)]
    pub fn with_progress_callback(mut self, callback: ProgressCallback) -> Self {
        self.progress_callback = Some(callback);
        self
    }

    async fn validate_input_file(&self, path: &str) -> Result<(), VideoError> {
        if !Path::new(path).exists() {
            return Err(VideoError::FileNotFound(path.to_string()));
        }
        Ok(())
    }

    async fn validate_output_dir(&self, output: &str) -> Result<(), VideoError> {
        if let Some(parent) = Path::new(output).parent() {
            if !parent.exists() {
                return Err(VideoError::InvalidInput(format!(
                    "Output directory does not exist: {}",
                    parent.display()
                )));
            }
        }
        Ok(())
    }

    fn dimensions_args(&self, dimensions: &Option<VideoDimensions>) -> Vec<String> {
        match dimensions {
            Some(d) => vec![
                "-vf".to_string(),
                format!("scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2", d.width, d.height, d.width, d.height),
            ],
            None => vec![],
        }
    }

    async fn run_ffmpeg(
        &self,
        args: &[String],
        operation_name: &str,
    ) -> Result<(), VideoError> {
        let mut child = Command::new(&self.ffmpeg_path)
            .args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| VideoError::FFmpegError(format!("Failed to start FFmpeg: {}", e)))?;

        let stderr = child.stderr.take().ok_or_else(|| {
            VideoError::FFmpegError("Failed to capture FFmpeg stderr".to_string())
        })?;

        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        let mut last_progress = 0.0f32;

        while reader.read_line(&mut line).await.map_err(|e| {
            VideoError::FFmpegError(format!("Failed to read FFmpeg output: {}", e))
        })? > 0
        {
            if let Some(progress) = parse_ffmpeg_progress(&line) {
                if progress - last_progress > 0.05 || progress >= 1.0 {
                    if let Some(ref callback) = self.progress_callback {
                        callback(ProgressUpdate {
                            operation: operation_name.to_string(),
                            progress,
                            message: Some(format!("{:.0}%", progress * 100.0)),
                        });
                    }
                    last_progress = progress;
                }
            }
            line.clear();
        }

        let status = child
            .wait()
            .await
            .map_err(|e| VideoError::FFmpegError(format!("FFmpeg process error: {}", e)))?;

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

#[async_trait]
impl VideoService for FFmpegCommandService {
    async fn extract_clip(
        &self,
        input: &str,
        start: &str,
        end: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_input_file(input).await?;
        self.validate_output_dir(output).await?;

        let mut args = vec![
            "-y".to_string(),
            "-ss".to_string(),
            start.to_string(),
            "-i".to_string(),
            input.to_string(),
            "-to".to_string(),
            end.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string(),
        ];

        let dim_args = self.dimensions_args(&dimensions);
        if !dim_args.is_empty() {
            args.extend(dim_args);
        }

        args.push(output.to_string());

        self.run_ffmpeg(&args, "extract_clip").await
    }

    async fn create_title_segment(
        &self,
        image: &str,
        audio: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_input_file(image).await?;
        self.validate_input_file(audio).await?;
        self.validate_output_dir(output).await?;

        let mut args = vec![
            "-y".to_string(),
            "-loop".to_string(),
            "1".to_string(),
            "-i".to_string(),
            image.to_string(),
            "-i".to_string(),
            audio.to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            "-shortest".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string(),
        ];

        let dim_args = self.dimensions_args(&dimensions);
        if !dim_args.is_empty() {
            args.extend(dim_args);
        }

        args.push(output.to_string());

        self.run_ffmpeg(&args, "create_title_segment").await
    }

    async fn assemble_video(
        &self,
        segments: &[String],
        output: &str,
    ) -> Result<(), VideoError> {
        if segments.is_empty() {
            return Err(VideoError::InvalidInput(
                "No segments provided".to_string(),
            ));
        }

        for segment in segments {
            self.validate_input_file(segment).await?;
        }
        self.validate_output_dir(output).await?;

        let concat_file = format!(
            "{}.concat.txt",
            output.rsplit_once('.').map_or(output, |(base, _)| base)
        );

        let mut concat_content = String::new();
        for segment in segments {
            let escaped = segment.replace('\'', "'\\''");
            concat_content.push_str(&format!("file '{}'\n", escaped));
        }

        tokio::fs::write(&concat_file, concat_content).await?;

        let args = vec![
            "-y".to_string(),
            "-f".to_string(),
            "concat".to_string(),
            "-safe".to_string(),
            "0".to_string(),
            "-i".to_string(),
            concat_file.clone(),
            "-c".to_string(),
            "copy".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string(),
            output.to_string(),
        ];

        let result = self.run_ffmpeg(&args, "assemble_video").await;

        let _ = tokio::fs::remove_file(&concat_file).await;

        result
    }

    async fn create_image_segment(
        &self,
        image: &str,
        duration: f32,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_input_file(image).await?;
        self.validate_output_dir(output).await?;

        let mut args = vec![
            "-y".to_string(),
            "-loop".to_string(),
            "1".to_string(),
            "-i".to_string(),
            image.to_string(),
            "-f".to_string(),
            "lavfi".to_string(),
            "-i".to_string(),
            "anullsrc=channel_layout=stereo:sample_rate=44100".to_string(),
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            "-t".to_string(),
            duration.to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            "-shortest".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string(),
        ];

        let dim_args = self.dimensions_args(&dimensions);
        if !dim_args.is_empty() {
            args.extend(dim_args);
        }

        args.push(output.to_string());

        self.run_ffmpeg(&args, "create_image_segment").await
    }
}

fn parse_ffmpeg_progress(line: &str) -> Option<f32> {
    if let Some(time_pos) = line.find("time=") {
        let time_str = &line[time_pos + 5..];
        let time_value = time_str.split_whitespace().next()?;

        let parts: Vec<&str> = time_value.split(':').collect();
        if parts.len() == 3 {
            let hours: f32 = parts[0].parse().ok()?;
            let minutes: f32 = parts[1].parse().ok()?;
            let seconds: f32 = parts[2].parse().ok()?;
            let total_seconds = hours * 3600.0 + minutes * 60.0 + seconds;

            if let Some(duration_pos) = line.find("Duration:") {
                let after_duration = &line[duration_pos + 9..];
                let duration_value = after_duration.split(',').next()?.trim();
                let duration_parts: Vec<&str> = duration_value.split(':').collect();
                if duration_parts.len() == 3 {
                    let d_hours: f32 = duration_parts[0].parse().ok()?;
                    let d_minutes: f32 = duration_parts[1].parse().ok()?;
                    let d_seconds_str = duration_parts[2].split_whitespace().next()?;
                    let d_seconds: f32 = d_seconds_str.parse().ok()?;
                    let total_duration =
                        d_hours * 3600.0 + d_minutes * 60.0 + d_seconds;

                    if total_duration > 0.0 {
                        return Some((total_seconds / total_duration).min(1.0));
                    }
                }
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ffmpeg_progress_valid() {
        let line = "frame=  100 fps= 30 time=00:00:10.00 bitrate=1000kbits/s speed=1x Duration: 00:01:00.00";
        let progress = parse_ffmpeg_progress(line);
        assert!(progress.is_some());
        let p = progress.unwrap();
        assert!((p - 0.1667).abs() < 0.01);
    }

    #[test]
    fn test_parse_ffmpeg_progress_invalid() {
        let line = "some random output";
        let progress = parse_ffmpeg_progress(line);
        assert!(progress.is_none());
    }

    #[test]
    fn test_validate_input_file_exists() {
        let service = FFmpegCommandService::new(None);
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(service.validate_input_file("src/lib.rs"));
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_input_file_not_exists() {
        let service = FFmpegCommandService::new(None);
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(service.validate_input_file("/nonexistent/file.mp4"));
        assert!(result.is_err());
        match result.unwrap_err() {
            VideoError::FileNotFound(path) => assert_eq!(path, "/nonexistent/file.mp4"),
            _ => panic!("Expected FileNotFound error"),
        }
    }

    #[test]
    fn test_dimensions_args_with_dimensions() {
        let service = FFmpegCommandService::new(None);
        let dims = Some(VideoDimensions {
            width: 1080,
            height: 1920,
        });
        let args = service.dimensions_args(&dims);
        assert!(!args.is_empty());
        assert_eq!(args[0], "-vf");
        assert!(args[1].contains("1080"));
        assert!(args[1].contains("1920"));
    }

    #[test]
    fn test_dimensions_args_without_dimensions() {
        let service = FFmpegCommandService::new(None);
        let args = service.dimensions_args(&None);
        assert!(args.is_empty());
    }
}
