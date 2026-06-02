mod commands;
mod git;
mod security;
mod services;
mod storage;
mod workspace;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    services::initialize();
    security::initialize();
    git::initialize();
    workspace::initialize();
    storage::initialize();
    commands::register();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::default_workspace_path,
            commands::list_workspace_entries,
            commands::git_status,
            commands::git_diff,
            commands::validate_path,
            commands::list_markdown_notes,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run JARVIS");
}
