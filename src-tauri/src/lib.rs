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
        .run(tauri::generate_context!())
        .expect("failed to run JARVIS");
}
