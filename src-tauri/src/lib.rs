mod config;
mod process;
mod ipc;
mod tray;

use std::sync::Arc;
use tauri::Manager;

use ipc::AppState;
use process::ServiceManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let config_dir = app
                .path()
                .app_config_dir()
                .map_err(|e| e.to_string())?;
            let config_path = config_dir.join("config.json");

            app.manage(AppState {
                manager: Arc::new(ServiceManager::new()),
                config_path,
            });

            tray::setup_tray(&app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ipc::load_config,
            ipc::save_config,
            ipc::start_service,
            ipc::stop_service,
            ipc::list_running,
            ipc::send_input,
            ipc::resize_pty,
            ipc::list_scripts,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("앱 실행 실패");
}
