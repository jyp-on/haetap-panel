use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum ServiceState {
    Stopped,
    Starting,
    Running { pid: u32, started_at: u64 },
    Stopping,
    Crashed { exit_code: i32, at: u64 },
}

pub struct ServiceManager {
    children: Arc<Mutex<HashMap<String, Child>>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        Self { children: Arc::new(Mutex::new(HashMap::new())) }
    }

    pub async fn spawn(&self, service_id: &str, command: &str, cwd: &str) -> Result<u32, String> {
        let child = Command::new("sh")
            .arg("-c")
            .arg(command)
            .current_dir(cwd)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| format!("spawn 실패: {}", e))?;
        let pid = child.id().ok_or("PID 획득 실패")?;
        self.children.lock().await.insert(service_id.to_string(), child);
        Ok(pid)
    }

    pub async fn kill(&self, service_id: &str) -> Result<Option<i32>, String> {
        let mut guard = self.children.lock().await;
        let mut child = match guard.remove(service_id) {
            Some(c) => c,
            None => return Ok(None),
        };
        drop(guard);

        let pid = child.id().ok_or("PID 없음")?;
        unsafe {
            libc::kill(pid as i32, libc::SIGTERM);
        }

        let timeout = tokio::time::sleep(std::time::Duration::from_secs(5));
        tokio::pin!(timeout);
        tokio::select! {
            status = child.wait() => {
                let code = status.map_err(|e| e.to_string())?.code().unwrap_or(-1);
                Ok(Some(code))
            }
            _ = &mut timeout => {
                let _ = child.kill().await;
                let status = child.wait().await.map_err(|e| e.to_string())?;
                Ok(Some(status.code().unwrap_or(-9)))
            }
        }
    }

    pub async fn is_running(&self, service_id: &str) -> bool {
        self.children.lock().await.contains_key(service_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn spawn_then_kill_short_command() {
        let mgr = ServiceManager::new();
        let pid = mgr.spawn("s1", "sleep 30", "/tmp").await.unwrap();
        assert!(pid > 0);
        assert!(mgr.is_running("s1").await);

        let exit = mgr.kill("s1").await.unwrap();
        assert!(exit.is_some());
        assert!(!mgr.is_running("s1").await);
    }

    #[tokio::test]
    async fn spawn_invalid_command_succeeds_at_spawn_layer() {
        // sh -c itself spawns successfully even when the inner command exits
        // immediately. The actual exit handling is deferred to Task 4 (state events).
        let mgr = ServiceManager::new();
        let result = mgr.spawn("s2", "exit 1", "/tmp").await;
        assert!(result.is_ok());
        // Clean up: kill (it might already be gone, that's ok)
        let _ = mgr.kill("s2").await;
    }

    #[tokio::test]
    async fn kill_unknown_service_returns_none() {
        let mgr = ServiceManager::new();
        let exit = mgr.kill("ghost").await.unwrap();
        assert!(exit.is_none());
    }
}
