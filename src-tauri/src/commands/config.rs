use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;

const CONFIG_STORE_FILENAME: &str = "config.json";

#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigCommandResult {
    pub success: bool,
    pub message: String,
}

fn default_config() -> serde_json::Value {
    serde_json::json!({
        "version": 1,
        "paths": {},
        "google": {},
        "video": {},
        "pipeline": {},
        "youtube": {},
        "ui": {}
    })
}

#[tauri::command]
pub fn get_config(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app
        .store(CONFIG_STORE_FILENAME)
        .map_err(|e| format!("Failed to open config store: {}", e))?;

    match store.get("app_config") {
        Some(v) => Ok(v),
        None => Ok(default_config()),
    }
}

#[tauri::command]
pub fn save_config(
    app: tauri::AppHandle,
    config: serde_json::Value,
) -> Result<ConfigCommandResult, String> {
    let store = app
        .store(CONFIG_STORE_FILENAME)
        .map_err(|e| format!("Failed to open config store: {}", e))?;

    store.set("app_config", config);
    store
        .save()
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(ConfigCommandResult {
        success: true,
        message: "Configuration saved successfully".to_string(),
    })
}

#[tauri::command]
pub fn reset_config(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app
        .store(CONFIG_STORE_FILENAME)
        .map_err(|e| format!("Failed to open config store: {}", e))?;

    let defaults = default_config();
    store.set("app_config", defaults.clone());
    store
        .save()
        .map_err(|e| format!("Failed to reset config: {}", e))?;

    Ok(defaults)
}
