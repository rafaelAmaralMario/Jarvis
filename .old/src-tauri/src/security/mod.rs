use std::path::Path;
use std::fs;

use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub capabilities: Vec<String>,
    pub permissions: Vec<String>,
    pub source: String,
    pub valid: bool,
    pub errors: Vec<String>,
}

pub fn list_local_plugin_manifests(workspace_path: String) -> Result<Vec<PluginManifest>, String> {
    let workspace = crate::workspace::canonicalize_existing(&workspace_path)?;
    let mut manifest_paths = Vec::new();
    let single_manifest = workspace.join("jarvis.plugins.json");
    if single_manifest.exists() {
        manifest_paths.push(single_manifest);
    }

    let plugin_dir = workspace.join(".jarvis").join("plugins");
    if plugin_dir.exists() {
        for entry in fs::read_dir(plugin_dir).map_err(|error| error.to_string())? {
            let path = entry.map_err(|error| error.to_string())?.path();
            if path
                .extension()
                .is_some_and(|extension| extension == "json")
            {
                manifest_paths.push(path);
            }
        }
    }

    manifest_paths
        .into_iter()
        .map(|path| read_plugin_manifest(&path))
        .collect()
}

fn read_plugin_manifest(path: &Path) -> Result<PluginManifest, String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let value: Value = serde_json::from_str(&content).map_err(|error| error.to_string())?;
    let mut errors = Vec::new();

    let id = read_required_string(&value, "id", &mut errors);
    let name = read_required_string(&value, "name", &mut errors);
    let version = read_required_string(&value, "version", &mut errors);
    let capabilities = read_string_array(&value, "capabilities", &mut errors);
    let permissions = read_string_array(&value, "permissions", &mut errors);

    Ok(PluginManifest {
        id,
        name,
        version,
        capabilities,
        permissions,
        source: path.to_string_lossy().to_string(),
        valid: errors.is_empty(),
        errors,
    })
}

fn read_required_string(value: &Value, key: &str, errors: &mut Vec<String>) -> String {
    value
        .get(key)
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .unwrap_or_else(|| {
            errors.push(format!("Missing or invalid `{key}`"));
            String::new()
        })
}

fn read_string_array(value: &Value, key: &str, errors: &mut Vec<String>) -> Vec<String> {
    let Some(items) = value.get(key).and_then(Value::as_array) else {
        errors.push(format!("Missing or invalid `{key}`"));
        return Vec::new();
    };

    items
        .iter()
        .filter_map(|item| item.as_str().map(ToString::to_string))
        .collect()
}
