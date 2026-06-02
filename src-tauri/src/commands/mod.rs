use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

use serde::Serialize;

#[derive(Serialize)]
pub struct WorkspaceEntry {
    name: String,
    path: String,
    kind: String,
}

#[derive(Serialize)]
pub struct GitFileStatus {
    path: String,
    status: String,
}

#[derive(Serialize)]
pub struct MarkdownNote {
    path: String,
    title: String,
}

pub fn register() {}

#[tauri::command]
pub fn default_workspace_path() -> String {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .unwrap_or(&manifest_dir)
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn list_workspace_entries(path: Option<String>) -> Result<Vec<WorkspaceEntry>, String> {
    let root = path.unwrap_or_else(default_workspace_path);
    let root_path = PathBuf::from(root);
    let entries = fs::read_dir(&root_path).map_err(|error| error.to_string())?;

    let mut result = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "node_modules" || name == "target" || name == ".git" || name == "dist" {
            continue;
        }

        let kind = if path.is_dir() { "directory" } else { "file" }.to_string();
        result.push(WorkspaceEntry {
            name,
            path: path.to_string_lossy().to_string(),
            kind,
        });
    }

    result.sort_by(|left, right| left.kind.cmp(&right.kind).then(left.name.cmp(&right.name)));
    Ok(result)
}

#[tauri::command]
pub fn git_status(workspace_path: Option<String>) -> Result<Vec<GitFileStatus>, String> {
    let root = workspace_path.unwrap_or_else(default_workspace_path);
    let output = Command::new("git")
        .args(["status", "--short"])
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout
        .lines()
        .filter_map(|line| {
            if line.len() < 4 {
                return None;
            }

            Some(GitFileStatus {
                status: line[..2].trim().to_string(),
                path: line[3..].to_string(),
            })
        })
        .collect())
}

#[tauri::command]
pub fn git_diff(workspace_path: Option<String>, file_path: String) -> Result<String, String> {
    let root = workspace_path.unwrap_or_else(default_workspace_path);
    let output = Command::new("git")
        .args(["diff", "--", &file_path])
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub fn validate_path(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub fn list_markdown_notes(vault_path: String) -> Result<Vec<MarkdownNote>, String> {
    let root = PathBuf::from(vault_path);
    if !root.exists() {
        return Err("Vault path does not exist".to_string());
    }

    let mut notes = Vec::new();
    collect_markdown_notes(&root, &mut notes)?;
    Ok(notes)
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
        } else if entry_path.extension().is_some_and(|extension| extension == "md") {
            let title = entry_path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            notes.push(MarkdownNote {
                title,
                path: entry_path.to_string_lossy().to_string(),
            });
        }
    }

    notes.sort_by(|left, right| left.title.cmp(&right.title));
    Ok(())
}
