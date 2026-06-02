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
    children: Vec<WorkspaceEntry>,
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

#[derive(Serialize)]
pub struct FileContent {
    path: String,
    content: String,
}

#[derive(Serialize)]
pub struct SearchResult {
    path: String,
    line: usize,
    preview: String,
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
    let ignore_patterns = load_ignore_patterns(&root_path);
    collect_workspace_entries(&root_path, &root_path, &ignore_patterns, 0)
}

#[tauri::command]
pub fn read_text_file(workspace_path: String, file_path: String) -> Result<FileContent, String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let target = canonicalize_existing(&file_path)?;
    ensure_inside_workspace(&workspace, &target)?;

    if !target.is_file() {
        return Err("Path is not a file".to_string());
    }

    let content = fs::read_to_string(&target).map_err(|error| error.to_string())?;
    Ok(FileContent {
        path: target.to_string_lossy().to_string(),
        content,
    })
}

#[tauri::command]
pub fn write_text_file(
    workspace_path: String,
    file_path: String,
    content: String,
) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let target = canonicalize_existing(&file_path)?;
    ensure_inside_workspace(&workspace, &target)?;

    if !target.is_file() {
        return Err("Path is not a file".to_string());
    }

    fs::write(target, content).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_file(
    workspace_path: String,
    parent_path: String,
    name: String,
) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let parent = canonicalize_existing(&parent_path)?;
    ensure_inside_workspace(&workspace, &parent)?;
    validate_entry_name(&name)?;

    let target = parent.join(name);
    ensure_inside_workspace(&workspace, &target)?;
    if target.exists() {
        return Err("File already exists".to_string());
    }

    fs::write(target, "").map_err(|error| error.to_string())
}

#[tauri::command]
pub fn create_folder(
    workspace_path: String,
    parent_path: String,
    name: String,
) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let parent = canonicalize_existing(&parent_path)?;
    ensure_inside_workspace(&workspace, &parent)?;
    validate_entry_name(&name)?;

    let target = parent.join(name);
    ensure_inside_workspace(&workspace, &target)?;
    if target.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir(target).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_entry(workspace_path: String, entry_path: String) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let target = canonicalize_existing(&entry_path)?;
    ensure_inside_workspace(&workspace, &target)?;

    if target == workspace {
        return Err("Cannot remove the workspace root".to_string());
    }

    if target.is_dir() {
        fs::remove_dir_all(target).map_err(|error| error.to_string())
    } else {
        fs::remove_file(target).map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn rename_entry(
    workspace_path: String,
    entry_path: String,
    name: String,
) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let target = canonicalize_existing(&entry_path)?;
    ensure_inside_workspace(&workspace, &target)?;
    validate_entry_name(&name)?;

    if target == workspace {
        return Err("Cannot rename the workspace root".to_string());
    }

    let parent = target
        .parent()
        .ok_or_else(|| "Target has no parent directory".to_string())?;
    let destination = parent.join(name);
    ensure_inside_workspace(&workspace, &destination)?;
    if destination.exists() {
        return Err("Destination already exists".to_string());
    }

    fs::rename(target, destination).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn move_entry(
    workspace_path: String,
    entry_path: String,
    destination_folder: String,
) -> Result<(), String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let target = canonicalize_existing(&entry_path)?;
    let destination_parent = canonicalize_existing(&destination_folder)?;
    ensure_inside_workspace(&workspace, &target)?;
    ensure_inside_workspace(&workspace, &destination_parent)?;

    if target == workspace {
        return Err("Cannot move the workspace root".to_string());
    }
    if !destination_parent.is_dir() {
        return Err("Destination must be a folder".to_string());
    }

    let file_name = target
        .file_name()
        .ok_or_else(|| "Target has no file name".to_string())?;
    let destination = destination_parent.join(file_name);
    ensure_inside_workspace(&workspace, &destination)?;
    if destination.exists() {
        return Err("Destination already exists".to_string());
    }

    fs::rename(target, destination).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn search_workspace(
    workspace_path: String,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let workspace = canonicalize_existing(&workspace_path)?;
    let query = query.trim().to_lowercase();
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let mut results = Vec::new();
    let ignore_patterns = load_ignore_patterns(&workspace);
    search_directory(
        &workspace,
        &workspace,
        &ignore_patterns,
        &query,
        &mut results,
    )?;
    Ok(results)
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
        } else if entry_path
            .extension()
            .is_some_and(|extension| extension == "md")
        {
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

fn collect_workspace_entries(
    root: &Path,
    path: &Path,
    ignore_patterns: &[String],
    depth: usize,
) -> Result<Vec<WorkspaceEntry>, String> {
    if depth > 8 {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(path).map_err(|error| error.to_string())?;
    let mut result = Vec::new();
    for entry in entries.flatten() {
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if should_ignore_entry(root, &entry_path, &name, ignore_patterns) {
            continue;
        }

        let is_dir = entry_path.is_dir();
        let children = if is_dir {
            collect_workspace_entries(root, &entry_path, ignore_patterns, depth + 1)
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        result.push(WorkspaceEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            kind: if is_dir { "directory" } else { "file" }.to_string(),
            children,
        });
    }

    result.sort_by(|left, right| left.kind.cmp(&right.kind).then(left.name.cmp(&right.name)));
    Ok(result)
}

fn search_directory(
    root: &Path,
    path: &Path,
    ignore_patterns: &[String],
    query: &str,
    results: &mut Vec<SearchResult>,
) -> Result<(), String> {
    if results.len() >= 200 {
        return Ok(());
    }

    for entry in fs::read_dir(path).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let entry_path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if should_ignore_entry(root, &entry_path, &name, ignore_patterns) {
            continue;
        }

        if entry_path.is_dir() {
            search_directory(root, &entry_path, ignore_patterns, query, results)?;
            continue;
        }

        if !is_probably_text_file(&entry_path) {
            continue;
        }

        if let Ok(content) = fs::read_to_string(&entry_path) {
            for (index, line) in content.lines().enumerate() {
                if line.to_lowercase().contains(query) {
                    results.push(SearchResult {
                        path: entry_path.to_string_lossy().to_string(),
                        line: index + 1,
                        preview: line.trim().chars().take(160).collect(),
                    });
                    if results.len() >= 200 {
                        return Ok(());
                    }
                }
            }
        }
    }

    Ok(())
}

fn load_ignore_patterns(root: &Path) -> Vec<String> {
    let mut patterns = vec![
        ".git".to_string(),
        "node_modules".to_string(),
        "target".to_string(),
        "dist".to_string(),
        ".vite".to_string(),
        ".tmp".to_string(),
        "tmp".to_string(),
        "temp".to_string(),
    ];

    let gitignore = root.join(".gitignore");
    if let Ok(content) = fs::read_to_string(gitignore) {
        patterns.extend(content.lines().filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with('!') {
                return None;
            }

            Some(
                trimmed
                    .trim_start_matches('/')
                    .trim_end_matches('/')
                    .replace('\\', "/"),
            )
        }));
    }

    patterns
}

fn should_ignore_entry(root: &Path, path: &Path, name: &str, ignore_patterns: &[String]) -> bool {
    let relative = path
        .strip_prefix(root)
        .ok()
        .map(|value| value.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|| name.to_string());

    ignore_patterns.iter().any(|pattern| {
        name == pattern
            || relative == *pattern
            || relative.starts_with(&format!("{pattern}/"))
            || pattern
                .strip_prefix("*.")
                .is_some_and(|extension| relative.ends_with(&format!(".{extension}")))
    })
}

fn is_probably_text_file(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            matches!(
                extension.to_lowercase().as_str(),
                "css"
                    | "html"
                    | "js"
                    | "json"
                    | "md"
                    | "rs"
                    | "toml"
                    | "ts"
                    | "tsx"
                    | "txt"
                    | "xml"
                    | "yaml"
                    | "yml"
            )
        })
}

fn canonicalize_existing(path: &str) -> Result<PathBuf, String> {
    PathBuf::from(path)
        .canonicalize()
        .map_err(|error| error.to_string())
}

fn ensure_inside_workspace(workspace: &Path, target: &Path) -> Result<(), String> {
    if target.starts_with(workspace) {
        Ok(())
    } else {
        Err("Path is outside the active workspace".to_string())
    }
}

fn validate_entry_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name cannot be empty".to_string());
    }

    if trimmed.contains('/') || trimmed.contains('\\') || trimmed == "." || trimmed == ".." {
        return Err("Name must be a single file or folder name".to_string());
    }

    Ok(())
}
