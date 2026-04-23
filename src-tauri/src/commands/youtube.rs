use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;

const YOUTUBE_STORE_FILENAME: &str = "youtube.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuth2Tokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
    pub token_type: String,
    pub scope: String,
}

#[tauri::command]
pub fn get_youtube_tokens(app: tauri::AppHandle) -> Result<Option<OAuth2Tokens>, String> {
    let store = app
        .store(YOUTUBE_STORE_FILENAME)
        .map_err(|e| format!("Failed to open youtube store: {}", e))?;

    match store.get("oauth_tokens") {
        Some(v) => {
            let tokens: OAuth2Tokens = serde_json::from_value(v)
                .map_err(|e| format!("Failed to parse tokens: {}", e))?;
            Ok(Some(tokens))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn save_youtube_tokens(
    app: tauri::AppHandle,
    tokens: OAuth2Tokens,
) -> Result<(), String> {
    let store = app
        .store(YOUTUBE_STORE_FILENAME)
        .map_err(|e| format!("Failed to open youtube store: {}", e))?;

    store.set("oauth_tokens", serde_json::to_value(&tokens).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save tokens: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn clear_youtube_tokens(app: tauri::AppHandle) -> Result<(), String> {
    let store = app
        .store(YOUTUBE_STORE_FILENAME)
        .map_err(|e| format!("Failed to open youtube store: {}", e))?;

    store.delete("oauth_tokens");
    store
        .save()
        .map_err(|e| format!("Failed to clear tokens: {}", e))?;

    Ok(())
}
