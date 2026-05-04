use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

pub struct ServiceManager {
    pids: Arc<Mutex<HashMap<String, u32>>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        Self { pids: Arc::new(Mutex::new(HashMap::new())) }
    }

    pub async fn spawn(
        &self,
        app: &AppHandle,
        service_id: &str,
        command: &str,
        cwd: &str,
    ) -> Result<u32, String> {
        let mut child = Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(cwd)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| format!("spawn 실패: {}", e))?;
        let pid = child.id().ok_or("PID 획득 실패")?;
        self.pids.lock().await.insert(service_id.to_string(), pid);

        let stdout = child.stdout.take().ok_or("stdout 캡처 실패")?;
        let stderr = child.stderr.take().ok_or("stderr 캡처 실패")?;
        let log_event = format!("log:{}", service_id);
        let state_event = format!("state:{}", service_id);

        // stdout reader
        {
            let app = app.clone();
            let event = log_event.clone();
            tokio::spawn(async move {
                let mut reader = BufReader::new(stdout).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = app.emit(&event, line);
                }
            });
        }
        // stderr reader (same channel)
        {
            let app = app.clone();
            let event = log_event.clone();
            tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = app.emit(&event, line);
                }
            });
        }

        // wait + state event
        {
            let app = app.clone();
            let sid = service_id.to_string();
            let pids = self.pids.clone();
            tokio::spawn(async move {
                let status = child.wait().await;
                let exit_code = status.ok().and_then(|s| s.code()).unwrap_or(-1);
                pids.lock().await.remove(&sid);
                let payload = if exit_code == 0 {
                    serde_json::json!({"status": "stopped"})
                } else {
                    serde_json::json!({
                        "status": "crashed",
                        "exitCode": exit_code,
                        "at": now_ms(),
                    })
                };
                let _ = app.emit(&state_event, payload);
            });
        }

        Ok(pid)
    }

    pub async fn kill(&self, service_id: &str) -> Result<bool, String> {
        let pid = match self.pids.lock().await.get(service_id).copied() {
            Some(p) => p,
            None => return Ok(false),
        };
        unsafe {
            if libc::kill(pid as i32, libc::SIGTERM) != 0 {
                return Err(format!("SIGTERM 실패: pid={}", pid));
            }
        }
        // 5초 후에도 PID가 살아있으면 SIGKILL
        let pids = self.pids.clone();
        let sid = service_id.to_string();
        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            if pids.lock().await.contains_key(&sid) {
                unsafe {
                    libc::kill(pid as i32, libc::SIGKILL);
                }
            }
        });
        Ok(true)
    }

    pub async fn running_pids(&self) -> HashMap<String, u32> {
        self.pids.lock().await.clone()
    }

    pub async fn is_running(&self, service_id: &str) -> bool {
        self.pids.lock().await.contains_key(service_id)
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn pid_map_starts_empty() {
        let mgr = ServiceManager::new();
        assert!(mgr.running_pids().await.is_empty());
        assert!(!mgr.is_running("anything").await);
    }
}
