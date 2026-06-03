use std::path::{Path, PathBuf};
use std::fs;
use std::process::Command;

use serde::Serialize;

#[derive(Serialize)]
pub struct MarkdownNote {
    pub path: String,
    pub title: String,
    pub content: String,
}

pub fn default_ollama_models_path() -> String {
    if let Ok(path) = std::env::var("OLLAMA_MODELS") {
        return path;
    }

    if let Ok(path) = std::env::var("USERPROFILE") {
        return PathBuf::from(path)
            .join(".ollama")
            .join("models")
            .to_string_lossy()
            .to_string();
    }

    if let Ok(path) = std::env::var("HOME") {
        return PathBuf::from(path)
            .join(".ollama")
            .join("models")
            .to_string_lossy()
            .to_string();
    }

    String::new()
}

pub fn list_ollama_models(models_path: String) -> Result<Vec<String>, String> {
    let root = crate::workspace::canonicalize_existing(&models_path)?;
    let manifests = root.join("manifests");
    if !manifests.exists() {
        return Err("Ollama models folder must contain a manifests directory".to_string());
    }

    let mut models = Vec::new();
    collect_ollama_models(&root, &manifests, &mut models)?;
    models.sort();
    models.dedup();
    Ok(models)
}

pub fn start_ollama_model(model: String) -> Result<(), String> {
    let model = validate_ollama_model_name(&model)?;

    Command::new("ollama")
        .args(["run", &model])
        .spawn()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

pub fn test_ollama_model(model: String) -> Result<String, String> {
    let model = validate_ollama_model_name(&model)?;
    let output = Command::new("ollama")
        .args(["run", &model, "Responda apenas OK para confirmar que voce esta funcional."])
        .output()
        .map_err(|error| format!("Nao foi possivel executar Ollama: {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "Ollama retornou erro sem detalhes.".to_string()
        } else {
            stderr
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn list_markdown_notes(vault_path: String) -> Result<Vec<MarkdownNote>, String> {
    let root = PathBuf::from(vault_path);
    if !root.exists() {
        return Err("Vault path does not exist".to_string());
    }

    let mut notes = Vec::new();
    collect_markdown_notes(&root, &mut notes)?;
    Ok(notes)
}

pub fn write_markdown_note(
    vault_path: String,
    title: String,
    content: String,
) -> Result<String, String> {
    let root = crate::workspace::canonicalize_existing(&vault_path)?;
    let file_name = sanitize_note_title(&title)?;
    let target = root.join(format!("{file_name}.md"));
    crate::workspace::ensure_inside_workspace(&root, &target)?;
    if target.exists() {
        return Err("Note already exists".to_string());
    }

    fs::write(&target, content).map_err(|error| error.to_string())?;
    Ok(target.to_string_lossy().to_string())
}

fn collect_markdown_notes(path: &Path, notes: &mut Vec<MarkdownNote>) -> Result<(), String> {
    for entry in fs::read_dir(path).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name == ".obsidian" || name == ".git" || name == "node_modules" {
            continue;
        }

        if entry_path.is_dir() {
            collect_markdown_notes(&entry_path, notes)?;
        } else if entry_path
            .extension()
            .is_some_and(|extension| extension == "md")
        {
            let title = entry_path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let content = fs::read_to_string(&entry_path).unwrap_or_default();
            notes.push(MarkdownNote {
                content,
                title,
                path: entry_path.to_string_lossy().to_string(),
            });
        }
    }

    notes.sort_by(|left, right| left.title.cmp(&right.title));
    Ok(())
}

fn collect_ollama_models(
    root: &Path,
    path: &Path,
    models: &mut Vec<String>,
) -> Result<(), String> {
    for entry in fs::read_dir(path).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let entry_path = entry.path();
        if entry_path.is_dir() {
            collect_ollama_models(root, &entry_path, models)?;
            continue;
        }

        if let Some(model) = ollama_model_name_from_manifest(root, &entry_path) {
            models.push(model);
        }
    }

    Ok(())
}

fn ollama_model_name_from_manifest(root: &Path, manifest_path: &Path) -> Option<String> {
    let manifests = root.join("manifests");
    let relative = manifest_path.strip_prefix(manifests).ok()?;
    let parts: Vec<String> = relative
        .components()
        .filter_map(|component| component.as_os_str().to_str().map(ToString::to_string))
        .collect();

    if parts.len() < 3 {
        return None;
    }

    let tag = parts.last()?;
    let name = parts.get(parts.len().saturating_sub(2))?;
    let namespace = parts.get(parts.len().saturating_sub(3))?;
    let base = if namespace == "library" {
        name.to_string()
    } else {
        format!("{namespace}/{name}")
    };

    Some(if tag == "latest" {
        base
    } else {
        format!("{base}:{tag}")
    })
}

fn validate_ollama_model_name(model: &str) -> Result<String, String> {
    let model = model.trim();
    if model.is_empty()
        || !model
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || matches!(character, '.' | ':' | '-' | '_'))
    {
        return Err("Invalid Ollama model name".to_string());
    }

    Ok(model.to_string())
}

fn sanitize_note_title(title: &str) -> Result<String, String> {
    let sanitized: String = title
        .trim()
        .chars()
        .filter(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ' ')
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-");

    if sanitized.is_empty() {
        return Err("Note title cannot be empty".to_string());
    }

    Ok(sanitized)
}
