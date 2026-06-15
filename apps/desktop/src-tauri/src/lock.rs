use serde::{Deserialize, Serialize};
use std::io::{self, Write};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainLock {
    pub id: String,
    #[serde(rename = "type")]
    pub lock_type: String,
    pub holder: String,
    pub held_since: String,
    pub expires_at: Option<String>,
    #[serde(default)]
    pub metadata: serde_json::Value,
}

pub fn acquire_lock(root: &Path, lock: &BrainLock) -> io::Result<()> {
    let lock_path = crate::state::lock_path(&lock.id);
    crate::state::ensure_dir(root)?;

    let json = serde_json::to_string_pretty(lock)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;

    use std::os::unix::fs::OpenOptionsExt;
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o644)
        .open(&lock_path)?;

    file.write_all(json.as_bytes())?;
    file.sync_all()?;

    Ok(())
}

pub fn release_lock(_root: &Path, id: &str) -> io::Result<()> {
    let lock_path = crate::state::lock_path(id);
    if lock_path.exists() {
        std::fs::remove_file(&lock_path)?;
    }
    Ok(())
}

pub fn is_locked(id: &str) -> bool {
    let lock_path = crate::state::lock_path(id);
    lock_path.exists()
}

pub fn read_lock(id: &str) -> io::Result<Option<BrainLock>> {
    let lock_path = crate::state::lock_path(id);
    if !lock_path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(&lock_path)?;
    let lock: BrainLock =
        serde_json::from_str(&content).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    Ok(Some(lock))
}
