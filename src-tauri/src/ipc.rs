use crate::config::{self, Config};
use crate::process::ServiceManager;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, State};

pub struct AppState {
    pub manager: Arc<ServiceManager>,
    pub config_path: PathBuf,
}

#[tauri::command]
pub fn load_config(state: State<AppState>) -> Result<Config, String> {
    config::load(&state.config_path)
}

#[tauri::command]
pub fn save_config(state: State<AppState>, config: Config) -> Result<(), String> {
    config::save(&state.config_path, &config)
}

#[tauri::command]
pub async fn start_service(
    app: AppHandle,
    state: State<'_, AppState>,
    service_id: String,
    command: String,
    cwd: String,
) -> Result<u32, String> {
    if state.manager.is_running(&service_id).await {
        return Err("이미 실행 중".into());
    }
    state.manager.spawn(&app, &service_id, &command, &cwd).await
}

#[tauri::command]
pub async fn stop_service(
    state: State<'_, AppState>,
    service_id: String,
) -> Result<bool, String> {
    state.manager.kill(&service_id).await
}

#[tauri::command]
pub async fn list_running(
    state: State<'_, AppState>,
) -> Result<HashMap<String, u32>, String> {
    Ok(state.manager.running_pids().await)
}

#[tauri::command]
pub async fn send_input(
    state: State<'_, AppState>,
    service_id: String,
    data: String,
) -> Result<(), String> {
    state.manager.write_input(&service_id, data.as_bytes()).await
}

#[tauri::command]
pub async fn resize_pty(
    state: State<'_, AppState>,
    service_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.manager.resize(&service_id, cols, rows).await
}

#[tauri::command]
pub fn list_scripts(cwd: String) -> Result<Vec<String>, String> {
    use std::fs;
    let entries = fs::read_dir(&cwd).map_err(|e| format!("디렉토리 읽기 실패: {}", e))?;
    let mut scripts: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let path = e.path();
            if path.is_file() {
                let name = path.file_name()?.to_string_lossy().to_string();
                if name.ends_with(".sh") {
                    return Some(name);
                }
            }
            None
        })
        .collect();
    scripts.sort();
    Ok(scripts)
}
