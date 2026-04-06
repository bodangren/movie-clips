use serde::Serialize;
use std::path::Path;
use tokio::process::Command;

#[derive(Debug, Clone, Serialize)]
pub struct FFmpegHealth {
    pub available: bool,
    pub version: Option<String>,
    pub path: String,
    pub error: Option<String>,
}

pub async fn check_ffmpeg_health(ffmpeg_path: &str) -> FFmpegHealth {
    tracing::info!(ffmpeg_path, "Checking FFmpeg health");

    if !is_ffmpeg_in_path(ffmpeg_path).await {
        return FFmpegHealth {
            available: false,
            version: None,
            path: ffmpeg_path.to_string(),
            error: Some(format!("FFmpeg not found at: {}", ffmpeg_path)),
        };
    }

    let version = get_ffmpeg_version(ffmpeg_path).await;

    tracing::info!(
        ffmpeg_path,
        version = version.as_deref().unwrap_or("unknown"),
        "FFmpeg health check passed"
    );

    FFmpegHealth {
        available: true,
        version,
        path: ffmpeg_path.to_string(),
        error: None,
    }
}

async fn is_ffmpeg_in_path(path: &str) -> bool {
    if path == "ffmpeg" {
        Command::new("which")
            .arg("ffmpeg")
            .output()
            .await
            .map(|o| o.status.success())
            .unwrap_or(false)
    } else {
        Path::new(path).exists()
    }
}

async fn get_ffmpeg_version(path: &str) -> Option<String> {
    Command::new(path)
        .arg("-version")
        .output()
        .await
        .ok()
        .and_then(|output| {
            String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()
                .map(|s| s.to_string())
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_check_ffmpeg_health_nonexistent_path() {
        let health = check_ffmpeg_health("/nonexistent/ffmpeg").await;
        assert!(!health.available);
        assert!(health.error.is_some());
        assert_eq!(health.path, "/nonexistent/ffmpeg");
    }

    #[tokio::test]
    async fn test_is_ffmpeg_in_path_nonexistent() {
        assert!(!is_ffmpeg_in_path("/nonexistent/ffmpeg").await);
    }

    #[tokio::test]
    async fn test_get_ffmpeg_version_nonexistent() {
        let version = get_ffmpeg_version("/nonexistent/ffmpeg").await;
        assert!(version.is_none());
    }
}
