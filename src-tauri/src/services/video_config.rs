use crate::services::encoder_builder::{EncoderType, QualityPreset};
use crate::services::video_service::VideoDimensions;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VideoConfig {
    pub ffmpeg_path: String,
    pub temp_dir: Option<String>,
    pub dimensions: VideoDimensions,
    pub service_type: VideoServiceType,
    pub encoder: EncoderType,
    pub preset: QualityPreset,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VideoServiceType {
    Command,
    Bindings,
    Mock,
}

impl Default for VideoConfig {
    fn default() -> Self {
        Self {
            ffmpeg_path: "ffmpeg".to_string(),
            temp_dir: None,
            dimensions: VideoDimensions::default(),
            service_type: VideoServiceType::Command,
            encoder: EncoderType::Software,
            preset: QualityPreset::Balanced,
        }
    }
}

pub fn parse_video_config(config: &serde_json::Value) -> VideoConfig {
    let mut result = VideoConfig::default();

    if let Some(video) = config.get("video") {
        if let Some(path) = video.get("ffmpeg_path").and_then(|v| v.as_str()) {
            result.ffmpeg_path = path.to_string();
        }

        if let Some(temp) = video.get("temp_dir").and_then(|v| v.as_str()) {
            result.temp_dir = Some(temp.to_string());
        }

        if let Some(dims) = video.get("dimensions") {
            if let Some(w) = dims.get("width").and_then(|v| v.as_u64()) {
                result.dimensions.width = w as u32;
            }
            if let Some(h) = dims.get("height").and_then(|v| v.as_u64()) {
                result.dimensions.height = h as u32;
            }
        }

        if let Some(svc) = video.get("service_type").and_then(|v| v.as_str()) {
            result.service_type = match svc {
                "bindings" => VideoServiceType::Bindings,
                "mock" => VideoServiceType::Mock,
                _ => VideoServiceType::Command,
            };
        }

        if let Some(enc) = video.get("encoder").and_then(|v| v.as_str()) {
            if let Some(encoder_type) = EncoderType::from_str(enc) {
                result.encoder = encoder_type;
            }
        }

        if let Some(preset_str) = video.get("preset").and_then(|v| v.as_str()) {
            result.preset = match preset_str {
                "fast" => QualityPreset::Fast,
                "slow" => QualityPreset::Slow,
                _ => QualityPreset::Balanced,
            };
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_video_config() {
        let config = VideoConfig::default();
        assert_eq!(config.ffmpeg_path, "ffmpeg");
        assert!(config.temp_dir.is_none());
        assert_eq!(config.dimensions.width, 1080);
        assert_eq!(config.dimensions.height, 1920);
        assert_eq!(config.service_type, VideoServiceType::Command);
        assert_eq!(config.encoder, EncoderType::Software);
        assert_eq!(config.preset, QualityPreset::Balanced);
    }

    #[test]
    fn test_parse_video_config_full() {
        let json = serde_json::json!({
            "video": {
                "ffmpeg_path": "/usr/local/bin/ffmpeg",
                "temp_dir": "/tmp/movie-clips",
                "dimensions": {
                    "width": 720,
                    "height": 1280
                },
                "service_type": "bindings",
                "encoder": "nvenc",
                "preset": "fast"
            }
        });

        let config = parse_video_config(&json);
        assert_eq!(config.ffmpeg_path, "/usr/local/bin/ffmpeg");
        assert_eq!(config.temp_dir, Some("/tmp/movie-clips".to_string()));
        assert_eq!(config.dimensions.width, 720);
        assert_eq!(config.dimensions.height, 1280);
        assert_eq!(config.service_type, VideoServiceType::Bindings);
        assert_eq!(config.encoder, EncoderType::Nvenc);
        assert_eq!(config.preset, QualityPreset::Fast);
    }

    #[test]
    fn test_parse_video_config_partial() {
        let json = serde_json::json!({
            "video": {
                "ffmpeg_path": "/custom/ffmpeg"
            }
        });

        let config = parse_video_config(&json);
        assert_eq!(config.ffmpeg_path, "/custom/ffmpeg");
        assert_eq!(config.dimensions.width, 1080);
        assert_eq!(config.service_type, VideoServiceType::Command);
    }

    #[test]
    fn test_parse_video_config_empty() {
        let json = serde_json::json!({});
        let config = parse_video_config(&json);
        assert_eq!(config, VideoConfig::default());
    }

    #[test]
    fn test_parse_video_config_invalid_service_type() {
        let json = serde_json::json!({
            "video": {
                "service_type": "invalid"
            }
        });

        let config = parse_video_config(&json);
        assert_eq!(config.service_type, VideoServiceType::Command);
    }
}
