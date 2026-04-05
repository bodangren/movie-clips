use serde::{Deserialize, Serialize};
use std::path::PathBuf;

mod commands;
mod services;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
    pub arch: String,
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid path: {0}")]
    InvalidPath(String),
    #[error("Operation failed: {0}")]
    OperationFailed(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_info() -> Result<AppInfo, AppError> {
    Ok(AppInfo {
        name: env!("CARGO_PKG_NAME").to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    })
}

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<String>, AppError> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(AppError::InvalidPath(format!(
            "Path does not exist: {}",
            path
        )));
    }

    if !path_buf.is_dir() {
        return Err(AppError::InvalidPath(format!(
            "Path is not a directory: {}",
            path
        )));
    }

    let entries = std::fs::read_dir(&path_buf)?;
    let mut files = Vec::new();

    for entry in entries {
        let entry = entry?;
        if let Some(name) = entry.file_name().to_str() {
            files.push(name.to_string());
        }
    }

    files.sort();
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use std::sync::Arc;
    let video_service_state = commands::video::VideoServiceState {
        service: Arc::new(services::ffmpeg_command::FFmpegCommandService::new(None)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(video_service_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_info,
            scan_directory,
            commands::config::get_config,
            commands::config::save_config,
            commands::config::reset_config,
            commands::video::extract_clip,
            commands::video::create_title_segment,
            commands::video::assemble_video,
            commands::video::create_image_segment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet_returns_message_with_name() {
        let result = greet("World");
        assert_eq!(result, "Hello, World! You've been greeted from Rust!");
    }

    #[test]
    fn test_greet_returns_empty_name() {
        let result = greet("");
        assert_eq!(result, "Hello, ! You've been greeted from Rust!");
    }

    #[test]
    fn test_get_app_info_returns_valid_info() {
        let info = get_app_info().unwrap();
        assert_eq!(info.name, "movie-clips");
        assert_eq!(info.version, "0.1.0");
        assert!(!info.platform.is_empty());
        assert!(!info.arch.is_empty());
    }

    #[test]
    fn test_scan_directory_valid_path() {
        let result = scan_directory("src".to_string());
        assert!(result.is_ok());
        let files = result.unwrap();
        assert!(files.contains(&"lib.rs".to_string()));
        assert!(files.contains(&"main.rs".to_string()));
    }

    #[test]
    fn test_scan_directory_nonexistent_path() {
        let result = scan_directory("/nonexistent/path".to_string());
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidPath(msg) => assert!(msg.contains("does not exist")),
            _ => panic!("Expected InvalidPath error"),
        }
    }

    #[test]
    fn test_scan_directory_file_not_dir() {
        let result = scan_directory("src/lib.rs".to_string());
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidPath(msg) => assert!(msg.contains("not a directory")),
            _ => panic!("Expected InvalidPath error"),
        }
    }

    #[test]
    fn test_app_error_serialization() {
        let err = AppError::InvalidPath("test path".to_string());
        let serialized = serde_json::to_string(&err).unwrap();
        assert_eq!(serialized, "\"Invalid path: test path\"");
    }
}
