pub fn register() {}

#[tauri::command]
pub fn default_workspace_path() -> String {
    crate::workspace::default_path()
}

#[tauri::command]
pub fn default_ollama_models_path() -> String {
    crate::services::default_ollama_models_path()
}

#[tauri::command]
pub fn list_workspace_entries(path: Option<String>) -> Result<Vec<crate::workspace::WorkspaceEntry>, String> {
    crate::workspace::list_entries(path)
}

#[tauri::command]
pub fn read_text_file(workspace_path: String, file_path: String) -> Result<crate::workspace::FileContent, String> {
    crate::workspace::read_text_file(workspace_path, file_path)
}

#[tauri::command]
pub fn write_text_file(
    workspace_path: String,
    file_path: String,
    content: String,
) -> Result<(), String> {
    crate::workspace::write_text_file(workspace_path, file_path, content)
}

#[tauri::command]
pub fn create_file(
    workspace_path: String,
    parent_path: String,
    name: String,
) -> Result<(), String> {
    crate::workspace::create_file(workspace_path, parent_path, name)
}

#[tauri::command]
pub fn create_folder(
    workspace_path: String,
    parent_path: String,
    name: String,
) -> Result<(), String> {
    crate::workspace::create_folder(workspace_path, parent_path, name)
}

#[tauri::command]
pub fn delete_entry(workspace_path: String, entry_path: String) -> Result<(), String> {
    crate::workspace::delete_entry(workspace_path, entry_path)
}

#[tauri::command]
pub fn rename_entry(
    workspace_path: String,
    entry_path: String,
    name: String,
) -> Result<(), String> {
    crate::workspace::rename_entry(workspace_path, entry_path, name)
}

#[tauri::command]
pub fn move_entry(
    workspace_path: String,
    entry_path: String,
    destination_folder: String,
) -> Result<(), String> {
    crate::workspace::move_entry(workspace_path, entry_path, destination_folder)
}

#[tauri::command]
pub fn search_workspace(
    workspace_path: String,
    query: String,
) -> Result<Vec<crate::workspace::SearchResult>, String> {
    crate::workspace::search(workspace_path, query)
}

#[tauri::command]
pub fn validate_path(path: String) -> Result<bool, String> {
    crate::workspace::validate_path(path)
}

#[tauri::command]
pub fn list_ollama_models(models_path: String) -> Result<Vec<String>, String> {
    crate::services::list_ollama_models(models_path)
}

#[tauri::command]
pub fn start_ollama_model(model: String) -> Result<(), String> {
    crate::services::start_ollama_model(model)
}

#[tauri::command]
pub fn test_ollama_model(model: String) -> Result<String, String> {
    crate::services::test_ollama_model(model)
}

#[tauri::command]
pub fn list_markdown_notes(vault_path: String) -> Result<Vec<crate::services::MarkdownNote>, String> {
    crate::services::list_markdown_notes(vault_path)
}

#[tauri::command]
pub fn write_markdown_note(
    vault_path: String,
    title: String,
    content: String,
) -> Result<String, String> {
    crate::services::write_markdown_note(vault_path, title, content)
}

#[tauri::command]
pub fn git_status(workspace_path: Option<String>) -> Result<Vec<crate::git::GitFileStatus>, String> {
    crate::git::status(workspace_path)
}

#[tauri::command]
pub fn git_diff(workspace_path: Option<String>, file_path: String) -> Result<String, String> {
    crate::git::diff(workspace_path, file_path)
}

#[tauri::command]
pub fn git_stage(workspace_path: String, file_path: String) -> Result<(), String> {
    crate::git::stage(workspace_path, file_path)
}

#[tauri::command]
pub fn git_unstage(workspace_path: String, file_path: String) -> Result<(), String> {
    crate::git::unstage(workspace_path, file_path)
}

#[tauri::command]
pub fn git_commit(workspace_path: String, message: String) -> Result<(), String> {
    crate::git::commit(workspace_path, message)
}

#[tauri::command]
pub fn git_branches(workspace_path: String) -> Result<Vec<crate::git::GitBranch>, String> {
    crate::git::branches(workspace_path)
}

#[tauri::command]
pub fn git_checkout_branch(workspace_path: String, branch: String) -> Result<(), String> {
    crate::git::checkout_branch(workspace_path, branch)
}

#[tauri::command]
pub fn git_create_branch(workspace_path: String, branch: String) -> Result<(), String> {
    crate::git::create_branch(workspace_path, branch)
}

#[tauri::command]
pub fn github_pr_url(workspace_path: String) -> Result<String, String> {
    crate::git::github_pr_url(workspace_path)
}

#[tauri::command]
pub fn list_local_plugin_manifests(workspace_path: String) -> Result<Vec<crate::security::PluginManifest>, String> {
    crate::security::list_local_plugin_manifests(workspace_path)
}

#[tauri::command]
pub fn load_secure_settings() -> Result<crate::storage::SecureSettings, String> {
    crate::storage::load_secure_settings()
}

#[tauri::command]
pub fn save_secure_settings(settings: crate::storage::SecureSettings) -> Result<(), String> {
    crate::storage::save_secure_settings(settings)
}
