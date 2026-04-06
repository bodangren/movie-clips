use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VideoDimensions {
    pub width: u32,
    pub height: u32,
}

impl Default for VideoDimensions {
    fn default() -> Self {
        Self {
            width: 1080,
            height: 1920,
        }
    }
}

#[async_trait]
pub trait VideoService: Send + Sync {
    async fn extract_clip(
        &self,
        input: &str,
        start: &str,
        end: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError>;

    async fn create_title_segment(
        &self,
        image: &str,
        audio: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError>;

    async fn assemble_video(
        &self,
        segments: &[String],
        output: &str,
    ) -> Result<(), VideoError>;

    async fn create_image_segment(
        &self,
        image: &str,
        duration: f32,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError>;
}

#[derive(Debug, thiserror::Error)]
pub enum VideoError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("FFmpeg error: {0}")]
    FFmpegError(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Operation timeout")]
    Timeout,
    #[error("Internal error: {0}")]
    Internal(String),
}

impl serde::Serialize for VideoError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub operation: String,
    pub progress: f32,
    pub message: Option<String>,
}

pub type ProgressCallback = Box<dyn Fn(ProgressUpdate) + Send + Sync>;
