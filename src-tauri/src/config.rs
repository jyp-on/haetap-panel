use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Project {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Service {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub command: String,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct Config {
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default)]
    pub projects: Vec<Project>,
    #[serde(default)]
    pub services: Vec<Service>,
}

fn default_version() -> u32 { 1 }

pub fn load(path: &PathBuf) -> Result<Config, String> {
    if !path.exists() {
        return Ok(Config { version: 1, projects: vec![], services: vec![] });
    }
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

pub fn save(path: &PathBuf, config: &Config) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let raw = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn tmp_path(name: &str) -> PathBuf {
        let mut p = env::temp_dir();
        p.push(format!("haetap-panel-test-{}-{}.json", name, uuid::Uuid::new_v4()));
        p
    }

    #[test]
    fn loads_default_when_missing() {
        let path = tmp_path("missing");
        let cfg = load(&path).unwrap();
        assert_eq!(cfg.version, 1);
        assert!(cfg.projects.is_empty());
        assert!(cfg.services.is_empty());
    }

    #[test]
    fn round_trip() {
        let path = tmp_path("roundtrip");
        let original = Config {
            version: 1,
            projects: vec![Project { id: "p1".into(), name: "incubody".into() }],
            services: vec![Service {
                id: "s1".into(),
                project_id: "p1".into(),
                name: "API".into(),
                command: "./api.sh".into(),
                cwd: "/tmp".into(),
            }],
        };
        save(&path, &original).unwrap();
        let loaded = load(&path).unwrap();
        assert_eq!(loaded, original);
        let _ = std::fs::remove_file(&path);
    }
}
