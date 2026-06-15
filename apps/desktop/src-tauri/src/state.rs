use std::path::PathBuf;

const BRAIN_ROOT: &str = ".codex/brain-project-manager";

pub fn brain_project_manager_root() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string());
    PathBuf::from(home).join(BRAIN_ROOT)
}

pub fn manager_root() -> PathBuf {
    brain_project_manager_root()
}

pub fn settings_path() -> PathBuf {
    brain_project_manager_root().join("settings.json")
}

pub fn projects_path() -> PathBuf {
    brain_project_manager_root().join("projects.json")
}

pub fn queues_dir() -> PathBuf {
    brain_project_manager_root().join("queues").join("handoffs")
}

pub fn locks_dir() -> PathBuf {
    brain_project_manager_root().join("locks")
}

pub fn logs_dir() -> PathBuf {
    brain_project_manager_root().join("logs")
}

pub fn queue_item_path(id: &str) -> PathBuf {
    queues_dir().join(format!("{}.json", id))
}

pub fn lock_path(id: &str) -> PathBuf {
    locks_dir().join(format!("{}.json", id))
}

pub fn ensure_dir(path: &std::path::Path) -> std::io::Result<()> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}
