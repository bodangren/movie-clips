use crate::services::video_service::{VideoDimensions, VideoError, VideoService};
use async_trait::async_trait;
use std::path::Path;
use tokio::fs;
use tokio::time::{sleep, Duration};

pub struct MockVideoService {
    pub simulate_delay: bool,
    pub simulate_errors: bool,
    pub error_message: Option<String>,
}

impl Default for MockVideoService {
    fn default() -> Self {
        Self {
            simulate_delay: false,
            simulate_errors: false,
            error_message: None,
        }
    }
}

impl MockVideoService {
    pub fn with_delay(mut self) -> Self {
        self.simulate_delay = true;
        self
    }

    pub fn with_errors(mut self, message: Option<String>) -> Self {
        self.simulate_errors = true;
        self.error_message = message;
        self
    }

    async fn simulate_progress(&self) {
        if self.simulate_delay {
            sleep(Duration::from_millis(100)).await;
        }
    }

    fn check_error(&self) -> Result<(), VideoError> {
        if self.simulate_errors {
            Err(VideoError::FFmpegError(
                self.error_message
                    .clone()
                    .unwrap_or_else(|| "Simulated error".to_string()),
            ))
        } else {
            Ok(())
        }
    }

    async fn validate_inputs(&self, inputs: &[&str]) -> Result<(), VideoError> {
        for input in inputs {
            if !Path::new(input).exists() && !self.simulate_errors {
                return Err(VideoError::FileNotFound(input.to_string()));
            }
        }
        Ok(())
    }
}

#[async_trait]
impl VideoService for MockVideoService {
    async fn extract_clip(
        &self,
        input: &str,
        _start: &str,
        _end: &str,
        output: &str,
        _dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_inputs(&[input]).await?;
        self.check_error()?;
        self.simulate_progress().await;

        if !self.simulate_errors {
            fs::write(output, b"mock video clip").await?;
        }
        Ok(())
    }

    async fn create_title_segment(
        &self,
        image: &str,
        audio: &str,
        output: &str,
        _dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_inputs(&[image, audio]).await?;
        self.check_error()?;
        self.simulate_progress().await;

        if !self.simulate_errors {
            fs::write(output, b"mock title segment").await?;
        }
        Ok(())
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

        let paths: Vec<&str> = segments.iter().map(|s| s.as_str()).collect();
        self.validate_inputs(&paths).await?;
        self.check_error()?;
        self.simulate_progress().await;

        if !self.simulate_errors {
            fs::write(output, b"mock assembled video").await?;
        }
        Ok(())
    }

    async fn create_image_segment(
        &self,
        image: &str,
        _duration: f32,
        output: &str,
        _dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        self.validate_inputs(&[image]).await?;
        self.check_error()?;
        self.simulate_progress().await;

        if !self.simulate_errors {
            fs::write(output, b"mock image segment").await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn mock_extract_clip_creates_output() {
        let service = MockVideoService::default();
        let temp_dir = tempfile::tempdir().unwrap();
        let input = temp_dir.path().join("input.mp4");
        let output = temp_dir.path().join("output.mp4");

        fs::write(&input, b"test").await.unwrap();

        let result = service
            .extract_clip(
                input.to_str().unwrap(),
                "00:00:00",
                "00:01:00",
                output.to_str().unwrap(),
                None,
            )
            .await;

        assert!(result.is_ok());
        assert!(output.exists());
    }

    #[tokio::test]
    async fn mock_extract_clip_simulates_error() {
        let service = MockVideoService::default().with_errors(None);
        let temp_dir = tempfile::tempdir().unwrap();
        let input = temp_dir.path().join("input.mp4");
        let output = temp_dir.path().join("output.mp4");

        fs::write(&input, b"test").await.unwrap();

        let result = service
            .extract_clip(
                input.to_str().unwrap(),
                "00:00:00",
                "00:01:00",
                output.to_str().unwrap(),
                None,
            )
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            VideoError::FFmpegError(msg) => assert_eq!(msg, "Simulated error"),
            _ => panic!("Expected FFmpegError"),
        }
    }

    #[tokio::test]
    async fn mock_assemble_video_empty_segments() {
        let service = MockVideoService::default();
        let result = service.assemble_video(&[], "output.mp4").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            VideoError::InvalidInput(msg) => assert!(msg.contains("No segments")),
            _ => panic!("Expected InvalidInput"),
        }
    }

    #[tokio::test]
    async fn mock_create_title_segment_valid() {
        let service = MockVideoService::default();
        let temp_dir = tempfile::tempdir().unwrap();
        let image = temp_dir.path().join("image.png");
        let audio = temp_dir.path().join("audio.mp3");
        let output = temp_dir.path().join("output.mp4");

        fs::write(&image, b"image").await.unwrap();
        fs::write(&audio, b"audio").await.unwrap();

        let result = service
            .create_title_segment(
                image.to_str().unwrap(),
                audio.to_str().unwrap(),
                output.to_str().unwrap(),
                None,
            )
            .await;

        assert!(result.is_ok());
        assert!(output.exists());
    }

    #[tokio::test]
    async fn mock_create_image_segment_valid() {
        let service = MockVideoService::default();
        let temp_dir = tempfile::tempdir().unwrap();
        let image = temp_dir.path().join("image.png");
        let output = temp_dir.path().join("output.mp4");

        fs::write(&image, b"image").await.unwrap();

        let result = service
            .create_image_segment(image.to_str().unwrap(), 5.0, output.to_str().unwrap(), None)
            .await;

        assert!(result.is_ok());
        assert!(output.exists());
    }
}
