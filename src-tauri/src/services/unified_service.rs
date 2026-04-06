use crate::services::ffmpeg_command::FFmpegCommandService;
use crate::services::health_check::FFmpegHealth;
use crate::services::metrics::MetricsCollector;
use crate::services::mock_video::MockVideoService;
use crate::services::video_config::{parse_video_config, VideoConfig, VideoServiceType};
use crate::services::video_service::{VideoDimensions, VideoError, VideoService};
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Serialize)]
pub struct VideoServiceStatus {
    pub service_type: String,
    pub ffmpeg_health: Option<FFmpegHealth>,
    pub metrics: crate::services::metrics::VideoServiceMetrics,
    pub config: VideoConfigSummary,
}

#[derive(Debug, Serialize)]
pub struct VideoConfigSummary {
    pub ffmpeg_path: String,
    pub temp_dir: Option<String>,
    pub dimensions: VideoDimensions,
}

pub enum VideoServiceImpl {
    FFmpeg(FFmpegCommandService),
    Mock(MockVideoService),
}

#[derive(Clone)]
pub struct UnifiedVideoService {
    inner: Arc<RwLock<VideoServiceImpl>>,
    config: Arc<VideoConfig>,
    metrics: Arc<MetricsCollector>,
}

impl UnifiedVideoService {
    pub fn new(config: &serde_json::Value) -> Self {
        let video_config = Arc::new(parse_video_config(config));
        let metrics = Arc::new(MetricsCollector::new());
        let inner = Self::create_service(&video_config);

        tracing::info!(
            service_type = ?video_config.service_type,
            "Unified video service initialized"
        );

        Self {
            inner: Arc::new(RwLock::new(inner)),
            config: video_config,
            metrics,
        }
    }

    fn create_service(config: &VideoConfig) -> VideoServiceImpl {
        match config.service_type {
            VideoServiceType::Command => {
                tracing::info!(
                    ffmpeg_path = config.ffmpeg_path,
                    "Creating FFmpeg command service"
                );
                VideoServiceImpl::FFmpeg(FFmpegCommandService::new(Some(
                    config.ffmpeg_path.clone(),
                )))
            }
            VideoServiceType::Mock => {
                tracing::info!("Creating mock video service");
                VideoServiceImpl::Mock(MockVideoService::default())
            }
            VideoServiceType::Bindings => {
                tracing::warn!("FFmpeg bindings not yet implemented, falling back to command mode");
                VideoServiceImpl::FFmpeg(FFmpegCommandService::new(Some(
                    config.ffmpeg_path.clone(),
                )))
            }
        }
    }

    pub async fn reload_config(&self, config: &serde_json::Value) {
        let new_config = parse_video_config(config);
        let new_inner = Self::create_service(&new_config);

        let mut inner = self.inner.write().await;
        *inner = new_inner;

        tracing::info!(
            service_type = ?new_config.service_type,
            "Video service configuration reloaded"
        );
    }

    pub async fn get_status(&self) -> VideoServiceStatus {
        let config = &*self.config;
        let ffmpeg_health = match config.service_type {
            VideoServiceType::Command | VideoServiceType::Bindings => {
                Some(
                    crate::services::health_check::check_ffmpeg_health(
                        &config.ffmpeg_path,
                    )
                    .await,
                )
            }
            VideoServiceType::Mock => None,
        };

        VideoServiceStatus {
            service_type: format!("{:?}", config.service_type),
            ffmpeg_health,
            metrics: self.metrics.get_metrics(),
            config: VideoConfigSummary {
                ffmpeg_path: config.ffmpeg_path.clone(),
                temp_dir: config.temp_dir.clone(),
                dimensions: config.dimensions.clone(),
            },
        }
    }

    pub fn metrics(&self) -> &MetricsCollector {
        &self.metrics
    }

    pub fn config(&self) -> &VideoConfig {
        &self.config
    }

    pub fn inner(&self) -> &UnifiedVideoService {
        self
    }
}

#[async_trait::async_trait]
impl VideoService for UnifiedVideoService {
    async fn extract_clip(
        &self,
        input: &str,
        start: &str,
        end: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        let timer = crate::services::metrics::OperationTimer::new("extract_clip");
        let dims = dimensions.unwrap_or_else(|| self.config.dimensions.clone());
        let result = match &*self.inner.read().await {
            VideoServiceImpl::FFmpeg(svc) => {
                svc.extract_clip(input, start, end, output, Some(dims)).await
            }
            VideoServiceImpl::Mock(svc) => {
                svc.extract_clip(input, start, end, output, Some(dims)).await
            }
        };

        match &result {
            Ok(()) => timer.success(&self.metrics),
            Err(e) => timer.failure(&self.metrics, &e.to_string()),
        }

        result
    }

    async fn create_title_segment(
        &self,
        image: &str,
        audio: &str,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        let timer = crate::services::metrics::OperationTimer::new("create_title_segment");
        let dims = dimensions.unwrap_or_else(|| self.config.dimensions.clone());
        let result = match &*self.inner.read().await {
            VideoServiceImpl::FFmpeg(svc) => {
                svc.create_title_segment(image, audio, output, Some(dims)).await
            }
            VideoServiceImpl::Mock(svc) => {
                svc.create_title_segment(image, audio, output, Some(dims)).await
            }
        };

        match &result {
            Ok(()) => timer.success(&self.metrics),
            Err(e) => timer.failure(&self.metrics, &e.to_string()),
        }

        result
    }

    async fn assemble_video(
        &self,
        segments: &[String],
        output: &str,
    ) -> Result<(), VideoError> {
        let timer = crate::services::metrics::OperationTimer::new("assemble_video");
        let result = match &*self.inner.read().await {
            VideoServiceImpl::FFmpeg(svc) => svc.assemble_video(segments, output).await,
            VideoServiceImpl::Mock(svc) => svc.assemble_video(segments, output).await,
        };

        match &result {
            Ok(()) => timer.success(&self.metrics),
            Err(e) => timer.failure(&self.metrics, &e.to_string()),
        }

        result
    }

    async fn create_image_segment(
        &self,
        image: &str,
        duration: f32,
        output: &str,
        dimensions: Option<VideoDimensions>,
    ) -> Result<(), VideoError> {
        let timer = crate::services::metrics::OperationTimer::new("create_image_segment");
        let dims = dimensions.unwrap_or_else(|| self.config.dimensions.clone());
        let result = match &*self.inner.read().await {
            VideoServiceImpl::FFmpeg(svc) => {
                svc.create_image_segment(image, duration, output, Some(dims)).await
            }
            VideoServiceImpl::Mock(svc) => {
                svc.create_image_segment(image, duration, output, Some(dims)).await
            }
        };

        match &result {
            Ok(()) => timer.success(&self.metrics),
            Err(e) => timer.failure(&self.metrics, &e.to_string()),
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_config() -> serde_json::Value {
        serde_json::json!({
            "video": {
                "service_type": "mock"
            }
        })
    }

    #[tokio::test]
    async fn test_unified_service_mock_mode() {
        let service = UnifiedVideoService::new(&mock_config());
        assert_eq!(service.config().service_type, VideoServiceType::Mock);
    }

    #[tokio::test]
    async fn test_unified_service_get_status_mock() {
        let service = UnifiedVideoService::new(&mock_config());
        let status = service.get_status().await;
        assert_eq!(status.service_type, "Mock");
        assert!(status.ffmpeg_health.is_none());
    }

    #[tokio::test]
    async fn test_unified_service_extract_clip_mock() {
        let service = UnifiedVideoService::new(&mock_config());
        let temp_dir = tempfile::tempdir().unwrap();
        let input = temp_dir.path().join("input.mp4");
        let output = temp_dir.path().join("output.mp4");

        tokio::fs::write(&input, b"test").await.unwrap();

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
    async fn test_unified_service_uses_config_dimensions() {
        let config = serde_json::json!({
            "video": {
                "service_type": "mock",
                "dimensions": {
                    "width": 720,
                    "height": 1280
                }
            }
        });
        let service = UnifiedVideoService::new(&config);
        assert_eq!(service.config().dimensions.width, 720);
        assert_eq!(service.config().dimensions.height, 1280);
    }
}
