use std::{env, fs, path::PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize, Serialize)]
pub struct SecureSettings {
    pub openai_compatible_api_key: String,
}

pub fn initialize() {}

pub fn load_secure_settings() -> Result<SecureSettings, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(SecureSettings::default());
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&content).map_err(|error| error.to_string())
}

pub fn save_secure_settings(settings: SecureSettings) -> Result<(), String> {
    let path = settings_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn settings_path() -> Result<PathBuf, String> {
    let base = env::var_os("APPDATA")
        .map(PathBuf::from)
        .or_else(|| env::var_os("HOME").map(PathBuf::from))
        .ok_or_else(|| "Cannot resolve app configuration directory".to_string())?;

    Ok(base.join("JARVIS").join("secure-settings.json"))
}
