use chrono::Utc;
use serde::Serialize;
use std::io::{self, Write};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn atomic_write_string(path: &Path, content: &str) -> io::Result<()> {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    crate::state::ensure_dir(parent)?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let tmp_path = parent.join(format!(
        ".{}.tmp.{}",
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file"),
        timestamp
    ));

    let mut file = std::fs::File::create(&tmp_path)?;
    file.write_all(content.as_bytes())?;
    file.sync_all()?;

    std::fs::rename(&tmp_path, path)?;

    Ok(())
}

pub fn atomic_write_json<T: Serialize>(
    path: &Path,
    value: &T,
) -> io::Result<()> {
    let json = serde_json::to_string_pretty(value)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    atomic_write_string(path, &json)
}

pub fn atomic_write_toml<T: Serialize>(
    path: &Path,
    value: &T,
) -> io::Result<()> {
    let toml = toml::to_string_pretty(value)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    atomic_write_string(path, &toml)
}

pub fn utc_now_iso() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}
