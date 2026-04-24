use crate::services::encoder_builder::{EncoderConfig, EncoderType, QualityPreset};
use crate::services::encoder_selector::{EncoderSelection, EncoderSelector};
use crate::services::gpu_detection::GpuDetector;
use crate::services::unified_service::UnifiedVideoService;
use crate::services::video_service::VideoError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct EncoderPreferenceRequest {
    pub encoder: Option<String>,
    pub preset: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EncoderConfigResponse {
    pub encoder: String,
    pub preset: String,
    pub available_encoders: Vec<String>,
    pub primary_encoder: String,
}

#[tauri::command]
pub async fn get_encoder_config(
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<EncoderConfigResponse, VideoError> {
    let config = state.config();
    let detector = GpuDetector::new(Some(config.ffmpeg_path.clone()));
    let gpu_result = detector.detect().await;

    let available = vec![
        if gpu_result.availability.nvenc {
            Some("nvenc".to_string())
        } else {
            None
        },
        if gpu_result.availability.vaapi {
            Some("vaapi".to_string())
        } else {
            None
        },
        if gpu_result.availability.videotoolbox {
            Some("videotoolbox".to_string())
        } else {
            None
        },
        Some("software".to_string()),
    ]
    .into_iter()
    .flatten()
    .collect();

    Ok(EncoderConfigResponse {
        encoder: match config.encoder {
            EncoderType::Nvenc => "nvenc".to_string(),
            EncoderType::Vaapi => "vaapi".to_string(),
            EncoderType::VideoToolbox => "videotoolbox".to_string(),
            EncoderType::Software => "software".to_string(),
        },
        preset: match config.preset {
            QualityPreset::Fast => "fast".to_string(),
            QualityPreset::Balanced => "balanced".to_string(),
            QualityPreset::Slow => "slow".to_string(),
        },
        available_encoders: available,
        primary_encoder: gpu_result.primary_encoder,
    })
}

#[tauri::command]
pub async fn set_encoder_preference(
    request: EncoderPreferenceRequest,
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<EncoderSelection, VideoError> {
    let config = state.config();
    let detector = GpuDetector::new(Some(config.ffmpeg_path.clone()));
    let gpu_result = detector.detect().await;

    let user_preference = request.encoder.and_then(|e| EncoderType::from_str(&e));
    let preset = request
        .preset
        .and_then(|p| match p.as_str() {
            "fast" => Some(QualityPreset::Fast),
            "slow" => Some(QualityPreset::Slow),
            _ => Some(QualityPreset::Balanced),
        })
        .unwrap_or(config.preset.clone());

    let selector = EncoderSelector::new(user_preference, preset);
    let selection = selector.select(&gpu_result);

    Ok(selection)
}

#[tauri::command]
pub async fn select_best_encoder(
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<EncoderSelection, VideoError> {
    let config = state.config();
    let detector = GpuDetector::new(Some(config.ffmpeg_path.clone()));
    let gpu_result = detector.detect().await;

    let selector = EncoderSelector::new(None, config.preset.clone());
    let selection = selector.select(&gpu_result);

    Ok(selection)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encoder_preference_request_serialization() {
        let request = EncoderPreferenceRequest {
            encoder: Some("nvenc".to_string()),
            preset: Some("fast".to_string()),
        };
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("nvenc"));
        assert!(json.contains("fast"));

        let deserialized: EncoderPreferenceRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request.encoder, deserialized.encoder);
        assert_eq!(request.preset, deserialized.preset);
    }

    #[test]
    fn test_encoder_config_response_serialization() {
        let response = EncoderConfigResponse {
            encoder: "nvenc".to_string(),
            preset: "fast".to_string(),
            available_encoders: vec!["nvenc".to_string(), "software".to_string()],
            primary_encoder: "h264_nvenc".to_string(),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("nvenc"));
        assert!(json.contains("h264_nvenc"));
    }
}
