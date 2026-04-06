use crate::services::video_service::VideoDimensions;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct VideoConfig {
    pub ffmpeg_path: String,
    pub temp_dir: Option<String>,
    pub dimensions: VideoDimensions,
    pub service_type: VideoServiceType,
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
                "service_type": "bindings"
            }
        });

        let config = parse_video_config(&json);
        assert_eq!(config.ffmpeg_path, "/usr/local/bin/ffmpeg");
        assert_eq!(config.temp_dir, Some("/tmp/movie-clips".to_string()));
        assert_eq!(config.dimensions.width, 720);
        assert_eq!(config.dimensions.height, 1280);
        assert_eq!(config.service_type, VideoServiceType::Bindings);
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
