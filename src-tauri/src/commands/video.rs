use crate::services::unified_service::UnifiedVideoService;
use crate::services::video_service::{VideoDimensions, VideoError, VideoService};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtractClipRequest {
    pub input: String,
    pub start: String,
    pub end: String,
    pub output: String,
    pub dimensions: Option<VideoDimensions>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TitleSegmentRequest {
    pub image: String,
    pub audio: String,
    pub output: String,
    pub dimensions: Option<VideoDimensions>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssembleVideoRequest {
    pub segments: Vec<String>,
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageSegmentRequest {
    pub image: String,
    pub duration: f32,
    pub output: String,
    pub dimensions: Option<VideoDimensions>,
}

#[tauri::command]
pub async fn extract_clip(
    request: ExtractClipRequest,
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<(), VideoError> {
    state
        .extract_clip(
            &request.input,
            &request.start,
            &request.end,
            &request.output,
            request.dimensions,
        )
        .await
}

#[tauri::command]
pub async fn create_title_segment(
    request: TitleSegmentRequest,
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<(), VideoError> {
    state
        .create_title_segment(
            &request.image,
            &request.audio,
            &request.output,
            request.dimensions,
        )
        .await
}

#[tauri::command]
pub async fn assemble_video(
    request: AssembleVideoRequest,
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<(), VideoError> {
    state
        .assemble_video(&request.segments, &request.output)
        .await
}

#[tauri::command]
pub async fn create_image_segment(
    request: ImageSegmentRequest,
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<(), VideoError> {
    state
        .create_image_segment(
            &request.image,
            request.duration,
            &request.output,
            request.dimensions,
        )
        .await
}

#[tauri::command]
pub async fn get_video_status(
    state: tauri::State<'_, UnifiedVideoService>,
) -> Result<crate::services::unified_service::VideoServiceStatus, VideoError> {
    Ok(state.get_status().await)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_clip_request_serialization() {
        let request = ExtractClipRequest {
            input: "input.mp4".to_string(),
            start: "00:00:10".to_string(),
            end: "00:01:00".to_string(),
            output: "output.mp4".to_string(),
            dimensions: Some(VideoDimensions {
                width: 1080,
                height: 1920,
            }),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("input.mp4"));
        assert!(json.contains("1080"));
    }

    #[test]
    fn test_assemble_video_request_empty_segments() {
        let request = AssembleVideoRequest {
            segments: vec![],
            output: "output.mp4".to_string(),
        };

        assert!(request.segments.is_empty());
    }
}
