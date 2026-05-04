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
    use std::path::PathBuf;

    const MAX_DEPTH: usize = 5;
    const IGNORED_DIRS: &[&str] = &[
        "node_modules", "target", "dist", "build",
        "Pods", "__pycache__", "venv", ".venv",
        ".dart_tool", ".pub-cache", ".next", ".turbo", ".gradle",
        ".git", ".idea", ".vscode",
    ];

    let root = PathBuf::from(&cwd);
    if !root.is_dir() {
        return Err(format!("디렉토리가 아님: {}", cwd));
    }

    let mut results: Vec<String> = Vec::new();
    walk(&root, &root, 0, MAX_DEPTH, IGNORED_DIRS, &mut results);
    results.sort();
    Ok(results)
}

fn walk(
    root: &std::path::Path,
    current: &std::path::Path,
    depth: usize,
    max_depth: usize,
    ignored: &[&str],
    out: &mut Vec<String>,
) {
    if depth > max_depth {
        return;
    }
    let entries = match std::fs::read_dir(current) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = match path.file_name() {
            Some(n) => n.to_string_lossy().to_string(),
            None => continue,
        };
        if path.is_dir() {
            // 숨김 디렉토리 + 무시 목록 스킵
            if name.starts_with('.') {
                continue;
            }
            if ignored.contains(&name.as_str()) {
                continue;
            }
            walk(root, &path, depth + 1, max_depth, ignored, out);
        } else if path.is_file() && name.ends_with(".sh") {
            if let Ok(rel) = path.strip_prefix(root) {
                let s = rel.to_string_lossy().to_string();
                // 일관된 경로 구분자
                out.push(s.replace('\\', "/"));
            }
        }
    }
}
