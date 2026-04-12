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
pub struct RenderVideoRequest {
    pub metadata_json: String,
    pub output: String,
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
pub async fn render_video(
    request: RenderVideoRequest,
    _app: tauri::AppHandle,
) -> Result<(), VideoError> {
    use tokio::io::{AsyncBufReadExt, BufReader};
    use tokio::process::Command;
    use tauri::Emitter;

    let mut child = Command::new("bun")
        .args([
            "run",
            "src/lib/video/render.ts",
            &request.metadata_json,
            &request.output,
        ])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| VideoError::Internal(e.to_string()))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    let app_handle = _app.clone();
    
    // Task to handle stdout (progress reporting)
    let _stdout_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stdout_reader.next_line().await {
            if line.starts_with("PROGRESS:") {
                if let Ok(progress) = line[9..].parse::<f32>() {
                    // Emit progress event to the frontend
                    let _ = app_handle.emit("video-render-progress", progress);
                }
            } else if line == "RENDER_COMPLETE" {
                let _ = app_handle.emit("video-render-status", "complete");
            }
            println!("render-stdout: {}", line);
        }
    });

    // Task to handle stderr
    let _stderr_task = tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_reader.next_line().await {
            eprintln!("render-stderr: {}", line);
        }
    });

    let status = child
        .wait()
        .await
        .map_err(|e| VideoError::Internal(e.to_string()))?;

    if status.success() {
        Ok(())
    } else {
        Err(VideoError::Internal(format!(
            "Bun render process failed with status: {}",
            status
        )))
    }
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
}
