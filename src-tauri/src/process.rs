use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

pub struct ServiceManager {
    pids: Arc<Mutex<HashMap<String, u32>>>,
    masters: Arc<Mutex<HashMap<String, Box<dyn MasterPty + Send>>>>,
    writers: Arc<Mutex<HashMap<String, Box<dyn Write + Send>>>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        Self {
            pids: Arc::new(Mutex::new(HashMap::new())),
            masters: Arc::new(Mutex::new(HashMap::new())),
            writers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn spawn(
        &self,
        app: &AppHandle,
        service_id: &str,
        command: &str,
        cwd: &str,
    ) -> Result<u32, String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("openpty 실패: {}", e))?;

        let mut cmd = CommandBuilder::new("sh");
        cmd.arg("-c");
        cmd.arg(command);
        cmd.cwd(cwd);
        cmd.env("TERM", "xterm-256color");

        let mut child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("spawn 실패: {}", e))?;
        // Parent doesn't need slave anymore
        drop(pair.slave);

        let pid = child.process_id().ok_or("PID 획득 실패")?;
        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("reader clone 실패: {}", e))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("writer take 실패: {}", e))?;

        self.pids.lock().await.insert(service_id.to_string(), pid);
        self.masters
            .lock()
            .await
            .insert(service_id.to_string(), pair.master);
        self.writers
            .lock()
            .await
            .insert(service_id.to_string(), writer);

        let log_event = format!("pty:{}", service_id);
        let state_event = format!("state:{}", service_id);

        // PTY reader OS thread
        {
            let app = app.clone();
            let event = log_event.clone();
            std::thread::spawn(move || {
                let mut buf = [0u8; 4096];
                loop {
                    match reader.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => {
                            let chunk = buf[..n].to_vec();
                            let _ = app.emit(&event, chunk);
                        }
                        Err(_) => break,
                    }
                }
            });
        }

        // Wait + cleanup task (blocking wait offloaded)
        {
            let app = app.clone();
            let sid = service_id.to_string();
            let pids = self.pids.clone();
            let masters = self.masters.clone();
            let writers = self.writers.clone();
            tokio::task::spawn_blocking(move || {
                let exit = child.wait().ok();
                let exit_code = exit.as_ref().map(|s| s.exit_code() as i32).unwrap_or(-1);

                tauri::async_runtime::block_on(async {
                    pids.lock().await.remove(&sid);
                    masters.lock().await.remove(&sid);
                    writers.lock().await.remove(&sid);
                });

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

    pub async fn write_input(&self, service_id: &str, bytes: &[u8]) -> Result<(), String> {
        let mut guard = self.writers.lock().await;
        let writer = guard
            .get_mut(service_id)
            .ok_or_else(|| format!("writer 없음: {}", service_id))?;
        writer
            .write_all(bytes)
            .map_err(|e| format!("write 실패: {}", e))?;
        writer.flush().map_err(|e| format!("flush 실패: {}", e))?;
        Ok(())
    }

    pub async fn resize(&self, service_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let guard = self.masters.lock().await;
        let master = guard
            .get(service_id)
            .ok_or_else(|| format!("master 없음: {}", service_id))?;
        master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("resize 실패: {}", e))
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
    async fn empty_state() {
        let mgr = ServiceManager::new();
        assert!(mgr.running_pids().await.is_empty());
        assert!(!mgr.is_running("anything").await);
    }
}
