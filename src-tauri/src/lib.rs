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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::default_workspace_path,
            commands::list_workspace_entries,
            commands::read_text_file,
            commands::write_text_file,
            commands::create_file,
            commands::create_folder,
            commands::delete_entry,
            commands::rename_entry,
            commands::move_entry,
            commands::search_workspace,
            commands::git_status,
            commands::git_diff,
            commands::git_stage,
            commands::git_unstage,
            commands::git_commit,
            commands::git_branches,
            commands::git_checkout_branch,
            commands::git_create_branch,
            commands::github_pr_url,
            commands::validate_path,
            commands::list_markdown_notes,
            commands::load_secure_settings,
            commands::save_secure_settings,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run JARVIS");
}
