use std::path::PathBuf;

const BRAIN_ROOT: &str = ".brain-loop";
const LEGACY_BRAIN_ROOT: &str = ".codex/brain-project-manager";
const DEFAULT_THREAD_STORAGE_ROOT: &str = "~/.brain-loop/threads";
const DEFAULT_WORKTREE_STORAGE_ROOT: &str = "~/.brain-loop/worktrees";
const DEFAULT_EXECUTION_STRATEGY: &str = "worktree";

pub fn brain_project_manager_root() -> PathBuf {
    home_dir().join(BRAIN_ROOT)
}

pub fn legacy_brain_project_manager_root() -> PathBuf {
    home_dir().join(LEGACY_BRAIN_ROOT)
}

pub fn manager_root() -> PathBuf {
    brain_project_manager_root()
}

pub fn settings_path() -> PathBuf {
    brain_project_manager_root().join("settings.toml")
}

pub fn projects_path() -> PathBuf {
    brain_project_manager_root().join("projects.json")
}

pub fn approvals_path() -> PathBuf {
    brain_project_manager_root().join("approvals.json")
}

pub fn queues_dir() -> PathBuf {
    brain_project_manager_root().join("queues").join("handoffs")
}

pub fn orchestrations_dir() -> PathBuf {
    brain_project_manager_root().join("orchestrations")
}

pub fn locks_dir() -> PathBuf {
    brain_project_manager_root().join("locks")
}

pub fn logs_dir() -> PathBuf {
    brain_project_manager_root().join("logs")
}

pub fn harness_events_dir() -> PathBuf {
    brain_project_manager_root().join("harness").join("events")
}

pub fn agent_threads_dir() -> PathBuf {
    expand_user_path(&settings_string("threadStorageRoot", DEFAULT_THREAD_STORAGE_ROOT))
}

pub fn worktrees_dir() -> PathBuf {
    expand_user_path(&settings_string("worktreeStorageRoot", DEFAULT_WORKTREE_STORAGE_ROOT))
}

pub fn execution_strategy() -> String {
    let strategy = settings_string("executionStrategy", DEFAULT_EXECUTION_STRATEGY);
    match strategy.as_str() {
        "worktree" | "main-checkout" | "auto" => strategy,
        _ => DEFAULT_EXECUTION_STRATEGY.to_string(),
    }
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

pub fn ensure_state_root() -> std::io::Result<()> {
    let root = brain_project_manager_root();
    let legacy_root = legacy_brain_project_manager_root();

    ensure_dir(&root)?;
    migrate_settings_if_needed(&legacy_root)?;
    copy_file_if_missing(&legacy_root.join("projects.json"), &root.join("projects.json"))?;
    copy_file_if_missing(&legacy_root.join("workspaces.json"), &root.join("workspaces.json"))?;

    copy_dir_if_missing(&legacy_root.join("queues"), &root.join("queues"))?;
    copy_dir_if_missing(&legacy_root.join("locks"), &root.join("locks"))?;
    copy_dir_if_missing(&legacy_root.join("logs"), &root.join("logs"))?;
    copy_dir_if_missing(&legacy_root.join("threads"), &root.join("threads"))?;

    ensure_dir(&queues_dir())?;
    ensure_dir(&orchestrations_dir())?;
    ensure_dir(&root.join("queues").join("archive"))?;
    ensure_dir(&locks_dir())?;
    ensure_dir(&logs_dir())?;
    ensure_dir(&root.join("logs").join("runs"))?;
    ensure_dir(&harness_events_dir())?;
    ensure_dir(&root.join("threads"))?;
    ensure_dir(&root.join("worktrees"))?;

    Ok(())
}

fn migrate_settings_if_needed(legacy_root: &std::path::Path) -> std::io::Result<()> {
    let target = settings_path();
    if target.exists() {
        return Ok(());
    }

    let legacy = legacy_root.join("settings.json");
    if !legacy.exists() {
        return Ok(());
    }

    let content = std::fs::read_to_string(&legacy)?;
    let json = serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))?;
    let toml_value = json_to_toml_value(&json).unwrap_or_else(|| {
        toml::Value::Table(toml::map::Map::new())
    });
    let toml = toml::to_string_pretty(&toml_value)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))?;
    crate::atomic::atomic_write_string(&target, &toml)
}

fn json_to_toml_value(value: &serde_json::Value) -> Option<toml::Value> {
    match value {
        serde_json::Value::Null => None,
        serde_json::Value::Bool(value) => Some(toml::Value::Boolean(*value)),
        serde_json::Value::Number(value) => {
            if let Some(value) = value.as_i64() {
                Some(toml::Value::Integer(value))
            } else {
                value.as_f64().map(toml::Value::Float)
            }
        }
        serde_json::Value::String(value) => Some(toml::Value::String(value.clone())),
        serde_json::Value::Array(values) => Some(toml::Value::Array(
            values.iter().filter_map(json_to_toml_value).collect(),
        )),
        serde_json::Value::Object(values) => {
            let mut table = toml::map::Map::new();
            for (key, value) in values {
                if let Some(value) = json_to_toml_value(value) {
                    table.insert(key.clone(), value);
                }
            }
            Some(toml::Value::Table(table))
        }
    }
}

fn copy_file_if_missing(source: &std::path::Path, destination: &std::path::Path) -> std::io::Result<()> {
    if destination.exists() || !source.exists() {
        return Ok(());
    }
    if let Some(parent) = destination.parent() {
        ensure_dir(parent)?;
    }
    let _ = std::fs::copy(source, destination)?;
    Ok(())
}

fn copy_dir_if_missing(source: &std::path::Path, destination: &std::path::Path) -> std::io::Result<()> {
    if destination.exists() || !source.exists() {
        return Ok(());
    }
    copy_dir_recursive(source, destination)
}

fn copy_dir_recursive(source: &std::path::Path, destination: &std::path::Path) -> std::io::Result<()> {
    ensure_dir(destination)?;
    for entry in std::fs::read_dir(source)? {
        let entry = entry?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        let metadata = entry.metadata()?;
        if metadata.is_dir() {
            copy_dir_recursive(&source_path, &destination_path)?;
        } else if metadata.is_file() {
            copy_file_if_missing(&source_path, &destination_path)?;
        }
    }
    Ok(())
}

fn settings_string(key: &str, fallback: &str) -> String {
    let path = settings_path();
    let Ok(content) = std::fs::read_to_string(path) else {
        return fallback.to_string();
    };
    let Ok(settings) = toml::from_str::<toml::Value>(&content) else {
        return fallback.to_string();
    };
    settings
        .get(key)
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(String::from)
        .unwrap_or_else(|| fallback.to_string())
}

pub fn expand_user_path(raw: &str) -> PathBuf {
    let trimmed = raw.trim();
    if trimmed == "~" {
        return home_dir();
    }
    if let Some(rest) = trimmed.strip_prefix("~/") {
        return home_dir().join(rest);
    }
    PathBuf::from(trimmed)
}

fn home_dir() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| "/Users".to_string()))
}
