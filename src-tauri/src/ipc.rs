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
