mod state;
mod atomic;
mod lock;
mod brain;
mod scheduler;
mod launchagent;
mod runner;
mod pty;
mod approval;
mod agent_thread;
mod harness;
mod worktree;
mod landing;
mod direct_model;
mod project_setup;
mod orchestration;

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap, HashSet};
use std::fs;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WebviewWindow};

static AUTOMATION_LOOP_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ImplementationDispatcher {
    #[serde(default = "default_dispatcher_job_name")]
    job_name: String,
    #[serde(default = "default_dispatcher_desired_status")]
    desired_status: String,
    #[serde(default = "default_status")]
    last_known_status: String,
    #[serde(default = "default_epoch_timestamp")]
    last_checked_at: String,
    #[serde(default = "default_dispatcher_updated_by")]
    last_updated_by: String,
    #[serde(default = "default_dispatcher_gateway_status")]
    last_gateway_status: String,
    #[serde(default = "default_dispatcher_codex_automation_mode")]
    codex_automation_mode: String,
    #[serde(default)]
    last_error: Option<String>,
}

fn default_status() -> String {
    "unknown".to_string()
}

fn default_two_minutes() -> u32 {
    2
}

fn default_sixty_seconds() -> u32 {
    60
}

fn default_one() -> u32 {
    1
}

fn default_thirty_minutes() -> u32 {
    30
}

fn default_dispatcher_job_name() -> String {
    "brain-loop-app-scheduler".to_string()
}

fn default_dispatcher_desired_status() -> String {
    "stopped".to_string()
}

fn default_epoch_timestamp() -> String {
    "1970-01-01T00:00:00.000Z".to_string()
}

fn default_dispatcher_updated_by() -> String {
    "system".to_string()
}

fn default_dispatcher_gateway_status() -> String {
    "not-used".to_string()
}

fn default_dispatcher_codex_automation_mode() -> String {
    "implementation-and-review".to_string()
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Settings {
    #[serde(default = "default_two_minutes")]
    default_review_interval_minutes: u32,
    #[serde(default = "default_two_minutes")]
    default_implementation_interval_minutes: u32,
    #[serde(default = "default_sixty_seconds")]
    capacity_poll_interval_seconds: u32,
    #[serde(default = "default_one")]
    max_running_processes: u32,
    #[serde(default)]
    max_implementation_agents: Option<u32>,
    #[serde(default)]
    max_review_agents: Option<u32>,
    #[serde(default = "default_thirty_minutes")]
    max_picked_minutes: u32,
    #[serde(default = "default_max_loop_policy")]
    max_loop_policy: MaxLoopConcurrencyPolicy,
    #[serde(default = "default_scheduling_policy")]
    scheduling_policy: String,
    #[serde(default = "default_thread_storage_root")]
    thread_storage_root: String,
    #[serde(default = "default_worktree_storage_root")]
    worktree_storage_root: String,
    #[serde(default = "default_execution_strategy")]
    execution_strategy: String,
    #[serde(default = "default_runner_catalog")]
    runner_catalog: Vec<RunnerCatalogEntry>,
    #[serde(default = "default_implementation_runner")]
    default_implementation_runner: String,
    #[serde(default = "default_implementation_model")]
    default_implementation_model: String,
    #[serde(default = "default_review_runner")]
    default_review_runner: String,
    #[serde(default = "default_review_model")]
    default_review_model: String,
    #[serde(default = "default_implementation_dispatcher")]
    implementation_dispatcher: ImplementationDispatcher,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct MaxLoopConcurrencyPolicy {
    global_max: u32,
    #[serde(default)]
    runner_caps: HashMap<String, u32>,
    #[serde(default)]
    project_caps: HashMap<String, u32>,
    #[serde(default)]
    runner_project_caps: HashMap<String, HashMap<String, u32>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct RunnerCatalogEntry {
    id: String,
    label: String,
    enabled: bool,
    models: Vec<String>,
    default_model: String,
    #[serde(default = "default_runner_kind")]
    kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    provider_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    api_style: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    api_key_env: Option<String>,
}

fn default_max_loop_policy() -> MaxLoopConcurrencyPolicy {
    MaxLoopConcurrencyPolicy {
        global_max: 1,
        runner_caps: HashMap::new(),
        project_caps: HashMap::new(),
        runner_project_caps: HashMap::new(),
    }
}

fn default_scheduling_policy() -> String {
    "fix-before-new-task".to_string()
}

fn default_thread_storage_root() -> String {
    "~/.brain-loop/threads".to_string()
}

fn default_worktree_storage_root() -> String {
    "~/.brain-loop/worktrees".to_string()
}

fn default_execution_strategy() -> String {
    "worktree".to_string()
}

fn default_runner_kind() -> String {
    "cli".to_string()
}

fn default_implementation_runner() -> String {
    "open-code".to_string()
}

fn default_implementation_model() -> String {
    "deepseek v4 pro".to_string()
}

fn default_review_runner() -> String {
    "codex".to_string()
}

fn default_review_model() -> String {
    "gpt-5-codex".to_string()
}

fn default_runner_catalog() -> Vec<RunnerCatalogEntry> {
    vec![
        RunnerCatalogEntry {
            id: "open-code".to_string(),
            label: "OpenCode".to_string(),
            enabled: true,
            models: vec![default_implementation_model()],
            default_model: default_implementation_model(),
            kind: default_runner_kind(),
            provider_id: None,
            api_style: None,
            api_key_env: None,
        },
        RunnerCatalogEntry {
            id: "antigravity".to_string(),
            label: "Antigravity".to_string(),
            enabled: true,
            models: vec!["3.1 pro".to_string()],
            default_model: "3.1 pro".to_string(),
            kind: default_runner_kind(),
            provider_id: None,
            api_style: None,
            api_key_env: None,
        },
        RunnerCatalogEntry {
            id: "codex".to_string(),
            label: "Codex".to_string(),
            enabled: true,
            models: vec![default_review_model()],
            default_model: default_review_model(),
            kind: default_runner_kind(),
            provider_id: None,
            api_style: None,
            api_key_env: None,
        },
        RunnerCatalogEntry {
            id: "direct-deepseek".to_string(),
            label: "DeepSeek Direct".to_string(),
            enabled: false,
            models: vec!["deepseek-v4-pro".to_string(), "deepseek-v4-flash".to_string()],
            default_model: "deepseek-v4-pro".to_string(),
            kind: "direct-provider".to_string(),
            provider_id: Some("deepseek".to_string()),
            api_style: Some("openai-chat".to_string()),
            api_key_env: Some("DEEPSEEK_API_KEY".to_string()),
        },
        RunnerCatalogEntry {
            id: "direct-gemini".to_string(),
            label: "Gemini Direct".to_string(),
            enabled: false,
            models: vec![
                "gemini-3.5-flash".to_string(),
                "gemini-3.1-pro".to_string(),
                "gemini-3-flash".to_string(),
            ],
            default_model: "gemini-3.5-flash".to_string(),
            kind: "direct-provider".to_string(),
            provider_id: Some("gemini".to_string()),
            api_style: Some("gemini-generate-content".to_string()),
            api_key_env: Some("GEMINI_API_KEY".to_string()),
        },
    ]
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BrainProject {
    id: String,
    name: String,
    path: String,
    enabled: bool,
    default_agent: String,
    review_interval_minutes: u32,
    implementation_interval_minutes: u32,
    priority: String,
    #[serde(default)]
    auto_merge_on_review_pass: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    brain_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    brain_storage: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    path_exists: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    brain_path_exists: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct QueueHistoryEntry {
    at: String,
    by: String,
    status: Option<String>,
    note: Option<String>,
    event: Option<String>,
    detail: Option<String>,
    review_path: Option<String>,
    active_handoff_path: Option<String>,
    handoff_path: Option<String>,
    agent: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct QueueItem {
    id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    orchestration_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    orchestration_title: Option<String>,
    #[serde(default, alias = "threadName", skip_serializing_if = "Option::is_none")]
    thread_title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    task_name: Option<String>,
    project_id: String,
    project_path: String,
    worktree_path: Option<String>,
    execution_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    execution_strategy: Option<String>,
    plan_path: String,
    handoff_path: String,
    active_handoff_path: String,
    review_path: Option<String>,
    status: String,
    agent: String,
    recommended_agent: String,
    recommendation_reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    recommended_model: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    model_recommendation_reason: Option<String>,
    priority: String,
    attempt: u32,
    created_by: String,
    picked_by: Option<String>,
    created_at: String,
    picked_at: Option<String>,
    agent_started_at: Option<String>,
    started_by: Option<String>,
    runner_id: Option<String>,
    review_runner_id: Option<String>,
    session_id: Option<String>,
    submitted_at: Option<String>,
    blocked_at: Option<String>,
    reviewed_at: Option<String>,
    approved_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landing_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landing_branch: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landed_by: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landed_commit: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    landing_error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pre_landing_status: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pre_landing_commit: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pre_landing_committed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pre_landing_commit_message: Option<String>,
    last_error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    waiting_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    depends_on: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    blocked_by: Vec<String>,
    history: Vec<QueueHistoryEntry>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct QueueReadError {
    file_name: String,
    path: String,
    message: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct QueueListResponse {
    items: Vec<QueueItem>,
    errors: Vec<QueueReadError>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct BrainStatus {
    implementation_status: String,
    review_status: String,
    active_runs: u32,
    queued_items: u32,
    submitted_items: u32,
    blocked_items: u32,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct LogSummary {
    file_name: String,
    last_modified: String,
    size_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    queue_item_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    agent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    status: Option<String>,
}

fn default_implementation_dispatcher() -> ImplementationDispatcher {
    ImplementationDispatcher {
        job_name: default_dispatcher_job_name(),
        desired_status: default_dispatcher_desired_status(),
        last_known_status: "stopped".to_string(),
        last_checked_at: default_epoch_timestamp(),
        last_updated_by: default_dispatcher_updated_by(),
        last_gateway_status: default_dispatcher_gateway_status(),
        codex_automation_mode: default_dispatcher_codex_automation_mode(),
        last_error: Some(
            "External dispatcher is not used; Brain Loop app-owned scheduler is the automation runtime."
                .to_string(),
        ),
    }
}

fn default_settings() -> Settings {
    Settings {
        default_review_interval_minutes: 2,
        default_implementation_interval_minutes: 2,
        capacity_poll_interval_seconds: 60,
        max_running_processes: 1,
        max_implementation_agents: Some(1),
        max_review_agents: Some(1),
        max_picked_minutes: 30,
        max_loop_policy: default_max_loop_policy(),
        scheduling_policy: default_scheduling_policy(),
        thread_storage_root: default_thread_storage_root(),
        worktree_storage_root: default_worktree_storage_root(),
        execution_strategy: default_execution_strategy(),
        runner_catalog: default_runner_catalog(),
        default_implementation_runner: default_implementation_runner(),
        default_implementation_model: default_implementation_model(),
        default_review_runner: default_review_runner(),
        default_review_model: default_review_model(),
        implementation_dispatcher: default_implementation_dispatcher(),
    }
}

fn normalize_models(models: &[String]) -> Vec<String> {
    let mut normalized = Vec::new();
    for model in models {
        let trimmed = model.trim();
        if !trimmed.is_empty() && !normalized.iter().any(|existing: &String| existing == trimmed) {
            normalized.push(trimmed.to_string());
        }
    }
    normalized
}

fn normalize_settings(settings: &mut Settings) {
    let defaults = default_runner_catalog();
    for default_entry in defaults {
        if !settings.runner_catalog.iter().any(|entry| entry.id == default_entry.id) {
            settings.runner_catalog.push(default_entry);
        }
    }

    for entry in settings.runner_catalog.iter_mut() {
        entry.label = entry.label.trim().to_string();
        if entry.label.is_empty() {
            entry.label = entry.id.clone();
        }
        entry.models = normalize_models(&entry.models);
        if entry.models.is_empty() {
            entry.models.push(entry.default_model.trim().to_string());
        }
        if !entry.models.iter().any(|model| model.as_str() == entry.default_model.trim()) {
            entry.default_model = entry.models[0].clone();
        } else {
            entry.default_model = entry.default_model.trim().to_string();
        }
        entry.kind = entry.kind.trim().to_string();
        if entry.kind.is_empty() {
            entry.kind = default_runner_kind();
        }
        entry.provider_id = entry
            .provider_id
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        entry.api_style = entry
            .api_style
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        entry.api_key_env = entry
            .api_key_env
            .as_ref()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
    }

    if settings.max_loop_policy.global_max == 0 {
        settings.max_loop_policy.global_max = settings
            .max_implementation_agents
            .unwrap_or(settings.max_running_processes)
            .max(1);
    }

    settings.thread_storage_root = settings.thread_storage_root.trim().to_string();
    settings.worktree_storage_root = settings.worktree_storage_root.trim().to_string();
    settings.execution_strategy = settings.execution_strategy.trim().to_string();
    if settings.thread_storage_root.is_empty() {
        settings.thread_storage_root = default_thread_storage_root();
    }
    if settings.worktree_storage_root.is_empty() {
        settings.worktree_storage_root = default_worktree_storage_root();
    }
    if settings.execution_strategy.is_empty() {
        settings.execution_strategy = default_execution_strategy();
    }
    settings.capacity_poll_interval_seconds =
        settings.capacity_poll_interval_seconds.clamp(1, 60);

    let review_default_is_valid = settings
        .runner_catalog
        .iter()
        .find(|entry| entry.id == settings.default_review_runner)
        .map(|entry| entry.enabled)
        .unwrap_or(false);
    if !review_default_is_valid {
        let fallback_runner = default_review_runner();
        if let Some(entry) = settings
            .runner_catalog
            .iter()
            .find(|entry| entry.id == fallback_runner && entry.enabled)
        {
            settings.default_review_runner = entry.id.clone();
            settings.default_review_model = entry.default_model.clone();
        }
    }
}

fn read_settings_file() -> Result<Settings, String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let settings_path = state::settings_path();
    if !settings_path.exists() {
        return Ok(default_settings());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;
    let mut settings = toml::from_str::<Settings>(&content)
        .map_err(|e| format!("Failed to parse settings TOML: {}", e))?;
    normalize_settings(&mut settings);
    Ok(settings)
}

fn validate_runner_id(id: &str) -> bool {
    matches!(id, "open-code" | "antigravity" | "codex" | "direct-deepseek" | "direct-gemini")
}

fn validate_provider_api_style(api_style: &str) -> bool {
    matches!(
        api_style,
        "openai-chat" | "openai-responses" | "anthropic" | "gemini-generate-content"
    )
}

fn validate_settings(settings: &Settings) -> Result<(), String> {
    if settings.default_review_interval_minutes == 0
        || settings.default_implementation_interval_minutes == 0
        || settings.capacity_poll_interval_seconds == 0
        || settings.max_running_processes == 0
        || settings.max_picked_minutes == 0
        || settings.max_implementation_agents.unwrap_or(1) == 0
        || settings.max_review_agents.unwrap_or(1) == 0
    {
        return Err("Settings intervals and capacity values must be greater than zero.".to_string());
    }
    if settings.capacity_poll_interval_seconds > 60 {
        return Err("Capacity poll interval must be between 1 and 60 seconds.".to_string());
    }

    if !matches!(settings.scheduling_policy.as_str(), "fix-before-new-task" | "fifo") {
        return Err("Scheduling policy must be fix-before-new-task or fifo.".to_string());
    }

    if settings.thread_storage_root.trim().is_empty()
        || settings.worktree_storage_root.trim().is_empty()
    {
        return Err("Thread and worktree storage roots are required.".to_string());
    }
    if settings.thread_storage_root.contains('\0') || settings.worktree_storage_root.contains('\0') {
        return Err("Thread and worktree storage roots cannot contain NUL bytes.".to_string());
    }
    if !matches!(settings.execution_strategy.as_str(), "worktree" | "main-checkout" | "auto") {
        return Err("Execution strategy must be worktree, main-checkout, or auto.".to_string());
    }

    validate_max_loop_policy(&settings.max_loop_policy)?;

    let mut seen = HashSet::new();
    for entry in &settings.runner_catalog {
        if !validate_runner_id(&entry.id) {
            return Err(format!("Unsupported runner id: {}", entry.id));
        }
        if !seen.insert(entry.id.as_str()) {
            return Err(format!("Duplicate runner id: {}", entry.id));
        }
        if entry.label.trim().is_empty() {
            return Err(format!("Runner {} requires a label.", entry.id));
        }
        if !matches!(entry.kind.as_str(), "cli" | "direct-provider") {
            return Err(format!("Runner {} kind must be cli or direct-provider.", entry.id));
        }
        if entry.kind == "direct-provider" {
            let provider_id = entry.provider_id.as_deref().unwrap_or("").trim();
            let api_style = entry.api_style.as_deref().unwrap_or("").trim();
            let api_key_env = entry.api_key_env.as_deref().unwrap_or("").trim();
            if provider_id.is_empty() || api_style.is_empty() || api_key_env.is_empty() {
                return Err(format!(
                    "Direct provider runner {} requires providerId, apiStyle, and apiKeyEnv.",
                    entry.id
                ));
            }
            if !validate_provider_api_style(api_style) {
                return Err(format!("Direct provider runner {} has unsupported apiStyle: {}", entry.id, api_style));
            }
        }
        let models = normalize_models(&entry.models);
        if models.is_empty() {
            return Err(format!("Runner {} requires at least one model.", entry.id));
        }
        if !models.iter().any(|model| model.as_str() == entry.default_model.trim()) {
            return Err(format!(
                "Default model for {} must be one of its configured models.",
                entry.id
            ));
        }
    }

    validate_role_default(
        "implementation",
        &settings.default_implementation_runner,
        &settings.default_implementation_model,
        &settings.runner_catalog,
    )?;
    validate_role_default(
        "review",
        &settings.default_review_runner,
        &settings.default_review_model,
        &settings.runner_catalog,
    )?;

    Ok(())
}

fn validate_max_loop_policy(policy: &MaxLoopConcurrencyPolicy) -> Result<(), String> {
    if policy.global_max == 0 {
        return Err("MaxLoop global cap must be greater than zero.".to_string());
    }

    for (runner, cap) in &policy.runner_caps {
        if !validate_runner_id(runner) {
            return Err(format!("Unsupported MaxLoop runner cap: {}", runner));
        }
        if *cap == 0 {
            return Err(format!("MaxLoop runner cap for {} must be greater than zero.", runner));
        }
    }

    for (project_id, cap) in &policy.project_caps {
        if project_id.trim().is_empty() {
            return Err("MaxLoop project cap requires a project id.".to_string());
        }
        if *cap == 0 {
            return Err(format!("MaxLoop project cap for {} must be greater than zero.", project_id));
        }
    }

    for (project_id, runner_caps) in &policy.runner_project_caps {
        if project_id.trim().is_empty() {
            return Err("MaxLoop runner-project cap requires a project id.".to_string());
        }
        for (runner, cap) in runner_caps {
            if !validate_runner_id(runner) {
                return Err(format!(
                    "Unsupported MaxLoop runner-project cap: {} / {}",
                    project_id, runner
                ));
            }
            if *cap == 0 {
                return Err(format!(
                    "MaxLoop runner-project cap for {} / {} must be greater than zero.",
                    project_id, runner
                ));
            }
        }
    }

    Ok(())
}

fn validate_role_default(
    role: &str,
    runner: &str,
    model: &str,
    catalog: &[RunnerCatalogEntry],
) -> Result<(), String> {
    let entry = catalog
        .iter()
        .find(|entry| entry.id == runner)
        .ok_or_else(|| format!("Default {} runner is not in the runner catalog.", role))?;
    if !entry.enabled {
        return Err(format!("Default {} runner cannot be disabled.", role));
    }
    if !entry.models.iter().any(|candidate| candidate.as_str() == model.trim()) {
        return Err(format!(
            "Default {} model must be one of the selected runner's configured models.",
            role
        ));
    }
    Ok(())
}

#[tauri::command]
fn get_settings() -> Result<Settings, String> {
    read_settings_file()
}

#[tauri::command]
fn update_settings(mut settings: Settings) -> Result<Settings, String> {
    normalize_settings(&mut settings);
    validate_settings(&settings)?;
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    atomic::atomic_write_toml(&state::settings_path(), &settings)
        .map_err(|e| format!("Failed to write settings TOML: {}", e))?;
    Ok(settings)
}

#[tauri::command]
fn get_brain_status() -> Result<BrainStatus, String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let root = state::manager_root();
    
    let settings_path = state::settings_path();
    let (impl_status, rev_status) = if settings_path.exists() {
        if let Ok(content) = fs::read_to_string(&settings_path) {
            if let Ok(settings) = toml::from_str::<Settings>(&content) {
                let status = settings.implementation_dispatcher.last_known_status.clone();
                let mode = settings.implementation_dispatcher.codex_automation_mode.clone();
                let rev = if mode == "implementation-only" {
                    "paused".to_string()
                } else {
                    status.clone()
                };
                (status, rev)
            } else {
                ("unknown".to_string(), "unknown".to_string())
            }
        } else {
            ("unknown".to_string(), "unknown".to_string())
        }
    } else {
        ("unknown".to_string(), "unknown".to_string())
    };

    let mut active_runs = 0;
    let mut queued_items = 0;
    let mut submitted_items = 0;
    let mut blocked_items = 0;

    let handoffs_dir = root.join("queues").join("handoffs");
    if handoffs_dir.exists() {
        if let Ok(entries) = fs::read_dir(handoffs_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(item) = serde_json::from_str::<QueueItem>(&content) {
                            match item.status.as_str() {
                                "queued" => queued_items += 1,
                                "picked" | "started" => active_runs += 1,
                                "submitted" => submitted_items += 1,
                                "blocked" => blocked_items += 1,
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(BrainStatus {
        implementation_status: impl_status,
        review_status: rev_status,
        active_runs,
        queued_items,
        submitted_items,
        blocked_items,
    })
}

#[tauri::command]
fn list_projects() -> Result<Vec<BrainProject>, String> {
    let mut projects = read_projects()?;
    for project in projects.iter_mut() {
        project.path_exists = Some(std::path::Path::new(&project.path).exists());
        let (brain_path, brain_storage, brain_path_exists) = project_setup::infer_brain_fields(
            project.id.as_str(),
            project.path.as_str(),
            project.brain_path.as_deref(),
            project.brain_storage.as_deref(),
        );
        project.brain_path = brain_path;
        project.brain_storage = brain_storage;
        project.brain_path_exists = brain_path_exists;
    }
    Ok(projects)
}

pub(crate) fn read_projects() -> Result<Vec<BrainProject>, String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let projects_path = state::projects_path();
    if !projects_path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&projects_path)
        .map_err(|e| format!("Failed to read projects file: {}", e))?;
    serde_json::from_str::<Vec<BrainProject>>(&content)
        .map_err(|e| format!("Failed to parse projects JSON: {}", e))
}

fn write_projects(projects: &[BrainProject]) -> Result<(), String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let mut clean_projects = projects.to_vec();
    for project in clean_projects.iter_mut() {
        project.path_exists = None;
        project.brain_path_exists = None;
    }

    atomic::atomic_write_json(&state::projects_path(), &clean_projects)
        .map_err(|e| format!("Failed to write projects JSON: {}", e))
}

fn validate_project(project: &BrainProject) -> Result<(), String> {
    if project.id.trim().is_empty() {
        return Err("Project id is required.".to_string());
    }
    if project.name.trim().is_empty() {
        return Err("Project name is required.".to_string());
    }
    if project.path.trim().is_empty() {
        return Err("Project path is required.".to_string());
    }
    if !matches!(project.default_agent.as_str(), "open-code" | "antigravity" | "codex") {
        return Err("Default agent must be open-code, antigravity, or codex.".to_string());
    }
    if !matches!(project.priority.as_str(), "high" | "medium" | "low") {
        return Err("Priority must be high, medium, or low.".to_string());
    }
    if let Some(storage) = project.brain_storage.as_deref() {
        if !matches!(storage, "project" | "external") {
            return Err("Brain storage must be project or external.".to_string());
        }
    }
    if project.review_interval_minutes == 0 || project.implementation_interval_minutes == 0 {
        return Err("Intervals must be greater than zero.".to_string());
    }
    Ok(())
}

#[tauri::command]
fn inspect_project_folder(
    input: project_setup::ProjectFolderInspectionInput,
) -> Result<project_setup::ProjectFolderInspection, String> {
    project_setup::inspect_project_folder(input)
}

#[tauri::command]
fn create_project(mut project: BrainProject) -> Result<BrainProject, String> {
    validate_project(&project)?;
    let mut projects = read_projects()?;

    if projects.iter().any(|existing| existing.id == project.id) {
        return Err(format!("Project already exists: {}", project.id));
    }

    let (brain_path, brain_storage) = project_setup::prepare_project_brain(
        project.id.as_str(),
        project.name.as_str(),
        project.path.as_str(),
    )?;
    project.brain_path = Some(brain_path);
    project.brain_storage = Some(brain_storage);
    project.path_exists = None;
    project.brain_path_exists = None;
    projects.push(project.clone());
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
    project.brain_path_exists = project
        .brain_path
        .as_deref()
        .map(|path| std::path::Path::new(path).exists());
    Ok(project)
}

#[tauri::command]
fn update_project(mut project: BrainProject) -> Result<BrainProject, String> {
    validate_project(&project)?;
    let mut projects = read_projects()?;
    let index = projects
        .iter()
        .position(|existing| existing.id == project.id)
        .ok_or_else(|| format!("Project not found: {}", project.id))?;

    project.path_exists = None;
    project.brain_path_exists = None;
    projects[index] = project.clone();
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
    project.brain_path_exists = project
        .brain_path
        .as_deref()
        .map(|path| std::path::Path::new(path).exists());
    Ok(project)
}

#[tauri::command]
fn set_project_enabled(project_id: String, enabled: bool) -> Result<BrainProject, String> {
    let mut projects = read_projects()?;
    let index = projects
        .iter()
        .position(|existing| existing.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    projects[index].enabled = enabled;
    let mut project = projects[index].clone();
    project.path_exists = None;
    project.brain_path_exists = None;
    projects[index] = project.clone();
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
    project.brain_path_exists = project
        .brain_path
        .as_deref()
        .map(|path| std::path::Path::new(path).exists());
    Ok(project)
}

#[tauri::command]
fn list_queue() -> Result<QueueListResponse, String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let mut items = Vec::new();
    let mut errors = Vec::new();
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    let handoffs_dir = state::queues_dir();
    if !handoffs_dir.exists() {
        return Ok(QueueListResponse { items, errors });
    }
    
    let entries = fs::read_dir(handoffs_dir)
        .map_err(|e| format!("Failed to read handoffs directory: {}", e))?;
        
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let file_name = path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown")
                .to_string();

            match fs::read_to_string(&path) {
                Ok(content) => match serde_json::from_str::<QueueItem>(&content) {
                    Ok(mut item) => {
                        if item.thread_title.as_deref().map(str::trim).unwrap_or("").is_empty() {
                            item.thread_title = Some(derive_thread_title(&item));
                        }
                        if item.task_name.as_deref().map(str::trim).unwrap_or("").is_empty() {
                            item.task_name = item.thread_title.clone();
                        }
                        let runner = if item.recommended_agent.trim().is_empty() {
                            item.agent.as_str()
                        } else {
                            item.recommended_agent.as_str()
                        };
                        if item.recommended_model.as_deref().map(str::trim).unwrap_or("").is_empty() {
                            if let Some(model) = recommended_model_for_runner(&settings, runner) {
                                item.recommended_model = Some(model);
                                item.model_recommendation_reason = Some(
                                    "Derived from runner/model settings for display; source queue item did not include recommendedModel.".to_string(),
                                );
                            }
                        }
                        items.push(item);
                    },
                    Err(e) => errors.push(QueueReadError {
                        file_name,
                        path: path.display().to_string(),
                        message: e.to_string(),
                    }),
                },
                Err(e) => errors.push(QueueReadError {
                    file_name,
                    path: path.display().to_string(),
                    message: e.to_string(),
                }),
            }
        }
    }
    
    items.sort_by(|a, b| {
        let p_a = match a.priority.as_str() {
            "high" => 0,
            "medium" => 1,
            _ => 2,
        };
        let p_b = match b.priority.as_str() {
            "high" => 0,
            "medium" => 1,
            _ => 2,
        };
        
        let p_cmp = p_a.cmp(&p_b);
        if p_cmp == std::cmp::Ordering::Equal {
            a.created_at.cmp(&b.created_at)
        } else {
            p_cmp
        }
    });

    Ok(QueueListResponse { items, errors })
}

fn derive_thread_title(item: &QueueItem) -> String {
    if let Some(title) = item.thread_title.as_ref().filter(|title| !title.trim().is_empty()) {
        return clean_thread_title(title, Some(item.project_id.as_str()));
    }
    if let Some(title) = item.task_name.as_ref().filter(|title| !title.trim().is_empty()) {
        return clean_thread_title(title, Some(item.project_id.as_str()));
    }

    [
        item.handoff_path.as_str(),
        item.plan_path.as_str(),
        item.active_handoff_path.as_str(),
        item.id.as_str(),
    ]
    .iter()
    .find_map(|value| {
        let name = task_name_from_path(value, Some(item.project_id.as_str()));
        if name.is_empty() {
            None
        } else {
            Some(name)
        }
    })
    .unwrap_or_else(|| item.id.clone())
}

fn task_name_from_path(value: &str, project_id: Option<&str>) -> String {
    let file_name = value
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or(value)
        .trim()
        .trim_end_matches(".md")
        .trim_end_matches(".json");
    clean_thread_title(file_name, project_id)
}

fn clean_thread_title(value: &str, project_id: Option<&str>) -> String {
    let without_date = value
        .trim()
        .trim_start_matches(|ch: char| ch.is_ascii_digit() || ch == '-')
        .trim_matches('-');
    let without_project = project_id
        .and_then(|project| without_date.strip_prefix(&format!("{}-", project)))
        .unwrap_or(without_date);
    let without_suffix = without_project
        .strip_suffix("-handoff")
        .or_else(|| without_project.strip_suffix("-fix"))
        .unwrap_or(without_project);

    without_suffix
        .split(['-', '_'])
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[tauri::command]
fn list_recent_logs() -> Result<Vec<LogSummary>, String> {
    state::ensure_state_root().map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let mut logs = Vec::new();
    let runs_dir = state::logs_dir().join("runs");
    if !runs_dir.exists() {
        return Ok(logs);
    }
    
    let entries = fs::read_dir(runs_dir)
        .map_err(|e| format!("Failed to read runs directory: {}", e))?;
        
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
            let file_name = path.file_name()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_default();
                
            let metadata = entry.metadata().ok();
            let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            
            let last_modified = metadata
                .and_then(|m| m.modified().ok())
                .and_then(|t| {
                    let duration = t.duration_since(std::time::SystemTime::UNIX_EPOCH).ok()?;
                    Some(format!("{}s ago", duration.as_secs()))
                })
                .unwrap_or_else(|| "unknown".to_string());
                
            let mut queue_item_id = None;
            let mut project_id = None;
            let mut agent = None;
            let mut status = None;
            
            let meta_path = path.with_extension("json");
            if meta_path.exists() {
                if let Ok(content) = fs::read_to_string(&meta_path) {
                    if let Ok(meta) = serde_json::from_str::<serde_json::Value>(&content) {
                        queue_item_id = meta.get("queueItemId").and_then(|v| v.as_str()).map(String::from);
                        project_id = meta.get("projectId").and_then(|v| v.as_str()).map(String::from);
                        agent = meta.get("agent").and_then(|v| v.as_str()).map(String::from);
                        status = meta.get("status").and_then(|v| v.as_str()).map(String::from);
                    }
                }
            }

            logs.push(LogSummary {
                file_name,
                last_modified,
                size_bytes,
                queue_item_id,
                project_id,
                agent,
                status,
            });
        }
    }
    
    logs.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    Ok(logs)
}

#[tauri::command]
fn list_agent_threads() -> Result<Vec<agent_thread::AgentThread>, String> {
    agent_thread::list_agent_threads()
}

#[tauri::command]
fn list_archived_agent_threads() -> Result<Vec<agent_thread::AgentThread>, String> {
    agent_thread::list_archived_agent_threads()
}

#[tauri::command]
fn archive_agent_thread(
    thread_id: String,
    by: String,
    reason: Option<String>,
) -> Result<agent_thread::AgentThread, String> {
    agent_thread::archive_agent_thread(&thread_id, &by, reason.as_deref())
}

#[tauri::command]
fn list_orchestrations() -> Result<Vec<orchestration::OrchestrationThread>, String> {
    orchestration::list_orchestrations()
}

#[tauri::command]
fn create_orchestration(
    input: orchestration::OrchestrationThreadInput,
) -> Result<orchestration::OrchestrationThread, String> {
    orchestration::create_orchestration(input)
}

#[tauri::command]
fn append_orchestration_message(
    input: orchestration::OrchestrationMessageInput,
) -> Result<orchestration::OrchestrationThread, String> {
    orchestration::append_message(input)
}

#[tauri::command]
fn run_orchestration_turn(
    input: orchestration::OrchestrationRunInput,
) -> Result<orchestration::OrchestrationThread, String> {
    orchestration::run_live_turn(input)
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct OrchestrationProjectUpdateInput {
    orchestration_id: String,
    project_id: String,
}

#[tauri::command]
fn update_orchestration_project(
    input: OrchestrationProjectUpdateInput,
) -> Result<orchestration::OrchestrationThread, String> {
    let mut thread = orchestration::read_orchestration(&input.orchestration_id)?;
    let projects = read_projects()?;
    let project = projects
        .iter()
        .find(|project| project.id == input.project_id)
        .ok_or_else(|| format!("Project not found: {}", input.project_id))?;
    thread.project_id = project.id.clone();
    thread.project_name = project.name.clone();
    thread.project_path = project.path.clone();
    thread.updated_at = atomic::utc_now_iso();
    orchestration::write_orchestration(&thread)?;
    Ok(thread)
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct OrchestrationHandoffTaskInput {
    title: String,
    body: String,
    #[serde(default)]
    priority: Option<String>,
    #[serde(default)]
    agent: Option<String>,
    #[serde(default)]
    recommended_agent: Option<String>,
    #[serde(default)]
    recommended_model: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct OrchestrationHandoffInput {
    orchestration_id: String,
    tasks: Vec<OrchestrationHandoffTaskInput>,
    #[serde(default)]
    source_agent: Option<String>,
    #[serde(default)]
    register_project_if_missing: Option<bool>,
    #[serde(default)]
    imported_project_enabled: Option<bool>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct OrchestrationHandoffResult {
    orchestration: orchestration::OrchestrationThread,
    queue_items: Vec<brain::QueueItem>,
    project: BrainProject,
    project_created: bool,
}

#[tauri::command]
fn handoff_orchestration(
    input: OrchestrationHandoffInput,
) -> Result<OrchestrationHandoffResult, String> {
    let mut thread = orchestration::read_orchestration(&input.orchestration_id)?;
    let (project, project_created) = ensure_orchestration_project(
        &thread,
        input.register_project_if_missing.unwrap_or(true),
        input.imported_project_enabled.unwrap_or(false),
    )?;
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    let tasks = if input.tasks.is_empty() {
        vec![OrchestrationHandoffTaskInput {
            title: thread.title.clone(),
            body: orchestration_messages_as_handoff_body(&thread),
            priority: Some(project.priority.clone()),
            agent: Some(project.default_agent.clone()),
            recommended_agent: Some(settings.default_implementation_runner.clone()),
            recommended_model: Some(settings.default_implementation_model.clone()),
        }]
    } else {
        input.tasks
    };

    let mut created_items = Vec::new();
    let now = atomic::utc_now_iso();
    let artifact_dir = orchestration::artifacts_dir(&thread.id);
    state::ensure_dir(&artifact_dir)
        .map_err(|e| format!("Failed to prepare orchestration artifact directory: {}", e))?;

    for (index, task) in tasks.iter().enumerate() {
        let title = task.title.trim();
        if title.is_empty() {
            return Err("Handoff task title is required.".to_string());
        }
        if task.body.trim().is_empty() {
            return Err(format!("Handoff task body is required for {}.", title));
        }
        let slug = orchestration::sanitize_segment(title);
        let suffix = if tasks.len() > 1 {
            format!("-{}", index + 1)
        } else {
            String::new()
        };
        let queue_id = unique_queue_id(&format!("{}-{}{}", thread.id, slug, suffix));
        let plan_path = artifact_dir.join(format!("{}-plan.md", queue_id));
        let handoff_path = artifact_dir.join(format!("{}-handoff.md", queue_id));
        let source_agent = input
            .source_agent
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or(thread.origin_agent.as_str());
        let plan = format!(
            "# Plan: {title}\n\n## Source\n- Orchestration: {orchestration_id}\n- Project: {project_name}\n- Origin agent: {source_agent}\n\n## Goal\n{body}\n",
            title = title,
            orchestration_id = thread.id.as_str(),
            project_name = thread.project_name.as_str(),
            source_agent = source_agent,
            body = task.body.trim(),
        );
        let handoff = format!(
            "# Handoff: {title}\n\n## Orchestration\n- Orchestration ID: {orchestration_id}\n- Orchestration title: {orchestration_title}\n- Origin agent: {source_agent}\n\n## Project\n- Project ID: {project_id}\n- Project path: {project_path}\n\n## Task\n{body}\n",
            title = title,
            orchestration_id = thread.id.as_str(),
            orchestration_title = thread.title.as_str(),
            source_agent = source_agent,
            project_id = project.id.as_str(),
            project_path = project.path.as_str(),
            body = task.body.trim(),
        );
        atomic::atomic_write_string(&plan_path, &plan)
            .map_err(|e| format!("Failed to write orchestration plan artifact: {}", e))?;
        atomic::atomic_write_string(&handoff_path, &handoff)
            .map_err(|e| format!("Failed to write orchestration handoff artifact: {}", e))?;

        let agent = normalized_agent(task.agent.as_deref().unwrap_or(project.default_agent.as_str()));
        let recommended_agent = normalized_agent(
            task.recommended_agent
                .as_deref()
                .unwrap_or(settings.default_implementation_runner.as_str()),
        );
        let recommended_model = task
            .recommended_model
            .clone()
            .filter(|value| !value.trim().is_empty())
            .or_else(|| recommended_model_for_runner(&settings, recommended_agent.as_str()))
            .unwrap_or_else(|| settings.default_implementation_model.clone());
        let priority = normalized_priority(task.priority.as_deref().unwrap_or(project.priority.as_str()));
        let queue_item = brain::QueueItem {
            id: queue_id.clone(),
            orchestration_id: Some(thread.id.clone()),
            orchestration_title: Some(thread.title.clone()),
            thread_title: Some(title.to_string()),
            task_name: Some(title.to_string()),
            project_id: project.id.clone(),
            project_path: project.path.clone(),
            worktree_path: None,
            execution_path: None,
            execution_strategy: None,
            plan_path: plan_path.display().to_string(),
            handoff_path: handoff_path.display().to_string(),
            active_handoff_path: handoff_path.display().to_string(),
            review_path: None,
            status: "queued".to_string(),
            agent: agent.clone(),
            recommended_agent: recommended_agent.clone(),
            recommendation_reason: "Created from Brain Loop orchestration handoff.".to_string(),
            recommended_model: Some(recommended_model),
            model_recommendation_reason: Some("Resolved while creating orchestration-linked queue item.".to_string()),
            priority,
            attempt: 1,
            created_by: source_agent.to_string(),
            picked_by: None,
            created_at: now.clone(),
            picked_at: None,
            agent_started_at: None,
            started_by: None,
            runner_id: None,
            review_runner_id: None,
            session_id: None,
            submitted_at: None,
            blocked_at: None,
            reviewed_at: None,
            approved_at: None,
            landing_status: None,
            landing_branch: None,
            landed_at: None,
            landed_by: None,
            landed_commit: None,
            landing_error: None,
            pre_landing_status: None,
            pre_landing_commit: None,
            pre_landing_committed_at: None,
            pre_landing_commit_message: None,
            last_error: None,
            waiting_reason: None,
            depends_on: Vec::new(),
            blocked_by: Vec::new(),
            history: vec![brain::QueueHistoryEntry {
                at: now.clone(),
                by: "brain-loop".to_string(),
                status: Some("queued".to_string()),
                note: Some(format!("Created from orchestration {}", thread.id)),
                event: Some("orchestration_handoff_created".to_string()),
                detail: Some(format!("Linked to orchestration {}", thread.id)),
                review_path: None,
                active_handoff_path: Some(handoff_path.display().to_string()),
                handoff_path: Some(handoff_path.display().to_string()),
                agent: Some(agent),
            }],
        };
        brain::write_queue_item(&queue_item)
            .map_err(|e| format!("Failed to write queue item {}: {}", queue_id, e))?;
        if let Ok(value) = serde_json::to_value(&queue_item) {
            let _ = agent_thread::upsert_from_queue_value(&value);
        }
        thread.linked_queue_item_ids.push(queue_id);
        thread
            .linked_thread_ids
            .push(agent_thread::thread_id_for_queue_item(&queue_item.id));
        thread
            .linked_handoff_paths
            .push(handoff_path.display().to_string());
        created_items.push(queue_item);
    }

    thread.status = "handed-off".to_string();
    thread.updated_at = atomic::utc_now_iso();
    dedupe_strings(&mut thread.linked_queue_item_ids);
    dedupe_strings(&mut thread.linked_thread_ids);
    dedupe_strings(&mut thread.linked_handoff_paths);
    orchestration::write_orchestration(&thread)?;

    Ok(OrchestrationHandoffResult {
        orchestration: thread,
        queue_items: created_items,
        project,
        project_created,
    })
}

fn ensure_orchestration_project(
    thread: &orchestration::OrchestrationThread,
    register_if_missing: bool,
    imported_enabled: bool,
) -> Result<(BrainProject, bool), String> {
    let mut projects = read_projects()?;
    if let Some(project) = projects
        .iter()
        .find(|project| project.id == thread.project_id || project.path == thread.project_path)
        .cloned()
    {
        return Ok((project, false));
    }
    if !register_if_missing {
        return Err(format!("Project is not registered in Brain Loop: {}", thread.project_id));
    }

    let mut project = BrainProject {
        id: thread.project_id.clone(),
        name: thread.project_name.clone(),
        path: thread.project_path.clone(),
        enabled: imported_enabled,
        default_agent: default_implementation_runner(),
        review_interval_minutes: 2,
        implementation_interval_minutes: 2,
        priority: "medium".to_string(),
        auto_merge_on_review_pass: false,
        brain_path: None,
        brain_storage: None,
        path_exists: None,
        brain_path_exists: None,
    };
    validate_project(&project)?;
    let (brain_path, brain_storage) = project_setup::prepare_project_brain(
        project.id.as_str(),
        project.name.as_str(),
        project.path.as_str(),
    )?;
    project.brain_path = Some(brain_path);
    project.brain_storage = Some(brain_storage);
    projects.push(project.clone());
    write_projects(&projects)?;
    project.path_exists = Some(std::path::Path::new(&project.path).exists());
    project.brain_path_exists = project
        .brain_path
        .as_deref()
        .map(|path| std::path::Path::new(path).exists());
    Ok((project, true))
}

fn unique_queue_id(seed: &str) -> String {
    let base = orchestration::sanitize_segment(seed);
    let mut candidate = base.clone();
    let mut index = 2;
    while state::queue_item_path(&candidate).exists() {
        candidate = format!("{}-{}", base, index);
        index += 1;
    }
    candidate
}

fn normalized_agent(agent: &str) -> String {
    match agent {
        "antigravity" | "codex" | "direct-deepseek" | "direct-gemini" => agent.to_string(),
        _ => "open-code".to_string(),
    }
}

fn normalized_priority(priority: &str) -> String {
    match priority {
        "high" | "low" => priority.to_string(),
        _ => "medium".to_string(),
    }
}

fn orchestration_messages_as_handoff_body(thread: &orchestration::OrchestrationThread) -> String {
    if thread.messages.is_empty() {
        return format!("Implement the work described by orchestration {}.", thread.title);
    }

    let body = thread
        .messages
        .iter()
        .filter(|message| {
            message
                .metadata
                .get("responseKind")
                .map(|value| value != "orchestration-intake-guidance")
                .unwrap_or(true)
        })
        .map(|message| format!("### {}\n{}", message.role, message.body))
        .collect::<Vec<_>>()
        .join("\n\n");

    if body.trim().is_empty() {
        format!("Implement the work described by orchestration {}.", thread.title)
    } else {
        body
    }
}

fn dedupe_strings(values: &mut Vec<String>) {
    let mut seen = HashSet::new();
    values.retain(|value| seen.insert(value.clone()));
}

fn prepare_queue_item_thread_context(
    queue_item_id: &str,
    event: &str,
) -> Result<brain::QueueItem, String> {
    let mut item = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item: {}", e))?
        .ok_or_else(|| format!("Queue item not found: {}", queue_item_id))?;

    match worktree::ensure_task_worktree(&mut item) {
        Ok(preparation) => {
            let detail = if preparation.used_main_checkout {
                format!(
                    "Using main checkout {} with execution strategy {}",
                    preparation.path, preparation.strategy
                )
            } else if preparation.created {
                format!(
                    "Prepared isolated worktree {} on {} with execution strategy {}",
                    preparation.path, preparation.branch, preparation.strategy
                )
            } else {
                format!(
                    "Reused isolated worktree {} on {} with execution strategy {}",
                    preparation.path, preparation.branch, preparation.strategy
                )
            };
            item.history.push(brain::QueueHistoryEntry {
                at: atomic::utc_now_iso(),
                by: "brain-loop".to_string(),
                status: None,
                note: None,
                event: Some(event.to_string()),
                detail: Some(detail),
                review_path: None,
                active_handoff_path: None,
                handoff_path: None,
                agent: Some(item.agent.clone()),
            });
            item.last_error = None;
            brain::write_queue_item(&item)
                .map_err(|e| format!("Failed to write queue item: {}", e))?;
            if let Ok(value) = serde_json::to_value(&item) {
                agent_thread::upsert_from_queue_value(&value)?;
            }
            Ok(item)
        }
        Err(e) => {
            item.last_error = Some(e.clone());
            item.history.push(brain::QueueHistoryEntry {
                at: atomic::utc_now_iso(),
                by: "brain-loop".to_string(),
                status: None,
                note: None,
                event: Some("worktree_prepare_failed".to_string()),
                detail: Some(e.clone()),
                review_path: None,
                active_handoff_path: None,
                handoff_path: None,
                agent: Some(item.agent.clone()),
            });
            let _ = brain::write_queue_item(&item);
            if let Ok(value) = serde_json::to_value(&item) {
                let _ = agent_thread::upsert_from_queue_value(&value);
            }
            Err(e)
        }
    }
}

struct LaunchSpec {
    command: String,
    args: Vec<String>,
    cwd: String,
    run_id: String,
    agent: String,
}

struct DirectImplementationSpec {
    provider: direct_model::DirectModelProvider,
    model: String,
    cwd: String,
    run_id: String,
    prompt: String,
    agent: String,
}

struct DirectReviewSpec {
    provider: direct_model::DirectModelProvider,
    model: String,
    cwd: String,
    run_id: String,
    prompt: String,
    agent: String,
}

fn launch_run_id(kind: &str, queue_item_id: &str) -> String {
    let safe_id = queue_item_id
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() || ch == '-' { ch } else { '_' })
        .collect::<String>();
    let timestamp = atomic::utc_now_iso()
        .replace(':', "")
        .replace('.', "")
        .replace('Z', "");
    format!("{}-{}-{}", kind, timestamp, safe_id)
}

fn queue_item_title(item: &brain::QueueItem) -> String {
    item.thread_title
        .as_ref()
        .filter(|title| !title.trim().is_empty())
        .cloned()
        .or_else(|| {
            item.task_name
                .as_ref()
                .filter(|title| !title.trim().is_empty())
                .cloned()
        })
        .map(|title| clean_thread_title(&title, Some(item.project_id.as_str())))
        .filter(|title| !title.trim().is_empty())
        .unwrap_or_else(|| derive_brain_queue_thread_title(item))
}

fn derive_brain_queue_thread_title(item: &brain::QueueItem) -> String {
    [
        item.handoff_path.as_str(),
        item.plan_path.as_str(),
        item.active_handoff_path.as_str(),
        item.id.as_str(),
    ]
    .iter()
    .find_map(|value| {
        let title = task_name_from_path(value, Some(item.project_id.as_str()));
        if title.is_empty() {
            None
        } else {
            Some(title)
        }
    })
    .unwrap_or_else(|| item.id.clone())
}

fn execution_path(item: &brain::QueueItem) -> String {
    item.execution_path
        .as_ref()
        .or(item.worktree_path.as_ref())
        .cloned()
        .unwrap_or_else(|| item.project_path.clone())
}

fn implementation_prompt(item: &brain::QueueItem) -> String {
    format!(
        "Read /Users/M1PRO/.codex/skills/brain-work-from-handoff/SKILL.md and follow it.\n\nUse this Brain queue item:\n- Queue item: {id}\n- Queue file: {queue_file}\n- Project: {project_id}\n- Project path: {project_path}\n- Execution path: {execution_path}\n- Worktree path: {worktree_path}\n- Execution strategy: {execution_strategy}\n- Active handoff: {active_handoff}\n- Recommended runner: {recommended_agent}\n- Recommended model: {recommended_model}\n- Model recommendation reason: {model_reason}\n\nImplement only the active handoff from the execution path. When complete, update the queue item to submitted; if blocked, update it to blocked with lastError.",
        id = item.id.as_str(),
        queue_file = state::queue_item_path(&item.id).display(),
        project_id = item.project_id.as_str(),
        project_path = item.project_path.as_str(),
        execution_path = execution_path(item),
        worktree_path = item.worktree_path.as_deref().unwrap_or("none"),
        execution_strategy = item.execution_strategy.as_deref().unwrap_or("worktree"),
        active_handoff = item.active_handoff_path.as_str(),
        recommended_agent = item.recommended_agent.as_str(),
        recommended_model = item.recommended_model.as_deref().unwrap_or("none"),
        model_reason = item.model_recommendation_reason.as_deref().unwrap_or("none"),
    )
}

fn prompt_file_excerpt(path: &str, max_bytes: usize) -> String {
    if path.trim().is_empty() {
        return "No path provided.".to_string();
    }

    match fs::read_to_string(path) {
        Ok(content) if content.len() > max_bytes => {
            let mut end = max_bytes;
            while !content.is_char_boundary(end) {
                end -= 1;
            }
            format!(
                "{}\n\n[truncated after {} bytes]",
                &content[..end],
                max_bytes
            )
        }
        Ok(content) => content,
        Err(e) => format!("Unable to read {}: {}", path, e),
    }
}

fn direct_implementation_prompt(item: &brain::QueueItem) -> String {
    format!(
        "Use this Brain queue item:\n- Queue item: {id}\n- Queue file: {queue_file}\n- Project: {project_id}\n- Project path: {project_path}\n- Execution path: {execution_path}\n- Worktree path: {worktree_path}\n- Execution strategy: {execution_strategy}\n- Active handoff: {active_handoff}\n- Recommended runner: {recommended_agent}\n- Recommended model: {recommended_model}\n- Model recommendation reason: {model_reason}\n\nDirect model runtime notes:\n- Implement only the active handoff from the execution path.\n- Inspect files with read_file and search_text relative to the execution path only.\n- Do not try to read global Brain Loop skill files; the active handoff content is embedded below.\n- Use apply_patch for file edits and run_command only when truly needed; those tools require user approval before mutation.\n- Do not edit Brain queue JSON directly. End by calling finish_task with queueStatus \"submitted\" when implementation is complete, or \"blocked\" with a clear lastError when you cannot proceed.\n\nActive handoff content:\n```markdown\n{handoff}\n```",
        id = item.id.as_str(),
        queue_file = state::queue_item_path(&item.id).display(),
        project_id = item.project_id.as_str(),
        project_path = item.project_path.as_str(),
        execution_path = execution_path(item),
        worktree_path = item.worktree_path.as_deref().unwrap_or("none"),
        execution_strategy = item.execution_strategy.as_deref().unwrap_or("worktree"),
        active_handoff = item.active_handoff_path.as_str(),
        recommended_agent = item.recommended_agent.as_str(),
        recommended_model = item.recommended_model.as_deref().unwrap_or("none"),
        model_reason = item.model_recommendation_reason.as_deref().unwrap_or("none"),
        handoff = prompt_file_excerpt(item.active_handoff_path.as_str(), 48_000),
    )
}

fn direct_implementation_system_prompt() -> String {
    "You are a Brain Loop direct implementation runner. Work from the provided handoff, inspect the execution path with tools, make the smallest correct code changes, and finish by calling finish_task. Be precise: ask for approval only for mutations or commands that the direct runtime gates.".to_string()
}

fn implementation_model(item: &brain::QueueItem) -> String {
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    item
        .recommended_model
        .as_ref()
        .filter(|model| !model.trim().is_empty())
        .cloned()
        .unwrap_or_else(|| {
            runner_model(
                &settings,
                item.agent.as_str(),
                Some((
                    settings.default_implementation_runner.as_str(),
                    settings.default_implementation_model.as_str(),
                )),
            )
        })
}

fn review_prompt(item: &brain::QueueItem) -> String {
    format!(
        "Read /Users/M1PRO/.codex/skills/brain-review-handoff/SKILL.md and follow it.\n\nReview starting:\n- Queue item: {id}\n- Queue file: {queue_file}\n- Project: {project_id}\n- Project path: {project_path}\n- Execution path: {execution_path}\n- Worktree path: {worktree_path}\n- Execution strategy: {execution_strategy}\n- Status: {status}\n- Priority: {priority}\n- Agent: {agent}\n- Recommended runner: {recommended_agent}\n- Recommended model: {recommended_model}\n- Model recommendation reason: {model_reason}\n- Attempt: {attempt}\n- Created at: {created_at}\n- Picked at: {picked_at}\n- Started at: {started_at}\n- Submitted at: {submitted_at}\n- Plan: {plan}\n- Handoff: {handoff}\n- Active handoff: {active_handoff}\n- Existing review path: {review_path}\n- Runner/session: {runner}/{session}\n- Last error: {last_error}\n\nRun the review workflow for this submitted queue item. If review passes, follow the landing contract before approving. If fixes are required or landing is blocked, update the queue item according to the review skill.",
        id = item.id.as_str(),
        queue_file = state::queue_item_path(&item.id).display(),
        project_id = item.project_id.as_str(),
        project_path = item.project_path.as_str(),
        execution_path = execution_path(item),
        worktree_path = item.worktree_path.as_deref().unwrap_or("none"),
        execution_strategy = item.execution_strategy.as_deref().unwrap_or("worktree"),
        status = item.status.as_str(),
        priority = item.priority.as_str(),
        agent = item.agent.as_str(),
        recommended_agent = item.recommended_agent.as_str(),
        recommended_model = item.recommended_model.as_deref().unwrap_or("none"),
        model_reason = item.model_recommendation_reason.as_deref().unwrap_or("none"),
        attempt = item.attempt,
        created_at = item.created_at.as_str(),
        picked_at = item.picked_at.as_deref().unwrap_or("none"),
        started_at = item.agent_started_at.as_deref().unwrap_or("none"),
        submitted_at = item.submitted_at.as_deref().unwrap_or("none"),
        plan = item.plan_path.as_str(),
        handoff = item.handoff_path.as_str(),
        active_handoff = item.active_handoff_path.as_str(),
        review_path = item.review_path.as_deref().unwrap_or("none"),
        runner = item.runner_id.as_deref().unwrap_or("none"),
        session = item.session_id.as_deref().unwrap_or("none"),
        last_error = item.last_error.as_deref().unwrap_or("none"),
    )
}

fn direct_review_prompt(item: &brain::QueueItem) -> String {
    format!(
        "Review this Brain queue item:\n- Queue item: {id}\n- Queue file: {queue_file}\n- Project: {project_id}\n- Project path: {project_path}\n- Execution path: {execution_path}\n- Worktree path: {worktree_path}\n- Execution strategy: {execution_strategy}\n- Status: {status}\n- Priority: {priority}\n- Implementation runner: {agent}\n- Recommended runner: {recommended_agent}\n- Recommended model: {recommended_model}\n- Model recommendation reason: {model_reason}\n- Attempt: {attempt}\n- Submitted at: {submitted_at}\n- Plan: {plan}\n- Handoff: {handoff_path}\n- Active handoff: {active_handoff}\n- Existing review path: {review_path}\n- Runner/session: {runner}/{session}\n- Last error: {last_error}\n\nDirect model review rules:\n- Review only. Do not edit files, apply patches, or run mutating commands.\n- Inspect files with read_file and search_text relative to the execution path only.\n- Compare the implementation against the active handoff content embedded below.\n- End by calling finish_task exactly once.\n- Use queueStatus \"landing\" when the work should proceed to landing/approval.\n- Use queueStatus \"reviewed-fix-request\" when fixes are required; include specific fix instructions in the summary.\n- Use queueStatus \"blocked\" when review cannot safely complete; include lastError or a clear failure reason.\n\nActive handoff content:\n```markdown\n{handoff_content}\n```",
        id = item.id.as_str(),
        queue_file = state::queue_item_path(&item.id).display(),
        project_id = item.project_id.as_str(),
        project_path = item.project_path.as_str(),
        execution_path = execution_path(item),
        worktree_path = item.worktree_path.as_deref().unwrap_or("none"),
        execution_strategy = item.execution_strategy.as_deref().unwrap_or("worktree"),
        status = item.status.as_str(),
        priority = item.priority.as_str(),
        agent = item.agent.as_str(),
        recommended_agent = item.recommended_agent.as_str(),
        recommended_model = item.recommended_model.as_deref().unwrap_or("none"),
        model_reason = item.model_recommendation_reason.as_deref().unwrap_or("none"),
        attempt = item.attempt,
        submitted_at = item.submitted_at.as_deref().unwrap_or("none"),
        plan = item.plan_path.as_str(),
        handoff_path = item.handoff_path.as_str(),
        active_handoff = item.active_handoff_path.as_str(),
        review_path = item.review_path.as_deref().unwrap_or("none"),
        runner = item.runner_id.as_deref().unwrap_or("none"),
        session = item.session_id.as_deref().unwrap_or("none"),
        last_error = item.last_error.as_deref().unwrap_or("none"),
        handoff_content = prompt_file_excerpt(item.active_handoff_path.as_str(), 48_000),
    )
}

fn direct_review_system_prompt() -> String {
    "You are a Brain Loop direct review runner. Verify the submitted implementation against the embedded handoff using read-only tools, then finish with a queueStatus of landing, reviewed-fix-request, or blocked. Do not perform implementation work during review.".to_string()
}

fn implementation_launch_spec(item: &brain::QueueItem, run_id: String) -> Result<LaunchSpec, String> {
    let cwd = execution_path(item);
    let prompt = implementation_prompt(item);
    let model = implementation_model(item);
    match item.agent.as_str() {
        "open-code" => Ok(LaunchSpec {
            command: "opencode".to_string(),
            args: vec![
                "run".to_string(),
                "--dir".to_string(),
                cwd.clone(),
                "--model".to_string(),
                model,
                "--dangerously-skip-permissions".to_string(),
                "--title".to_string(),
                queue_item_title(item),
                prompt,
            ],
            cwd,
            run_id,
            agent: item.agent.clone(),
        }),
        "antigravity" => Ok(LaunchSpec {
            command: "agy".to_string(),
            args: vec![
                "--print".to_string(),
                "--model".to_string(),
                model,
                "--dangerously-skip-permissions".to_string(),
                prompt,
            ],
            cwd,
            run_id,
            agent: item.agent.clone(),
        }),
        "codex" => Ok(LaunchSpec {
            command: "/Applications/Codex.app/Contents/Resources/codex".to_string(),
            args: vec![
                "exec".to_string(),
                "-C".to_string(),
                cwd.clone(),
                "--model".to_string(),
                model,
                "--sandbox".to_string(),
                "workspace-write".to_string(),
                prompt,
            ],
            cwd,
            run_id,
            agent: item.agent.clone(),
        }),
        other if direct_model::is_direct_provider_runner(other) => Err(format!(
            "Direct implementation runner {} must use the Brain Loop direct runtime.",
            other
        )),
        other => Err(format!("Unsupported implementation agent: {}", other)),
    }
}

fn direct_implementation_spec(
    item: &brain::QueueItem,
    run_id: String,
) -> Result<Option<DirectImplementationSpec>, String> {
    let Some(provider) = direct_model::built_in_provider(item.agent.as_str()) else {
        return Ok(None);
    };

    Ok(Some(DirectImplementationSpec {
        provider,
        model: implementation_model(item),
        cwd: execution_path(item),
        run_id,
        prompt: direct_implementation_prompt(item),
        agent: item.agent.clone(),
    }))
}

fn direct_review_spec(
    item: &brain::QueueItem,
    run_id: String,
) -> Result<Option<DirectReviewSpec>, String> {
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    let runner = settings.default_review_runner.clone();
    let Some(provider) = direct_model::built_in_provider(runner.as_str()) else {
        return Ok(None);
    };
    let model = runner_model(
        &settings,
        runner.as_str(),
        Some((
            settings.default_review_runner.as_str(),
            settings.default_review_model.as_str(),
        )),
    );

    Ok(Some(DirectReviewSpec {
        provider,
        model,
        cwd: execution_path(item),
        run_id,
        prompt: direct_review_prompt(item),
        agent: format!("{}-review", runner),
    }))
}

fn review_launch_spec(item: &brain::QueueItem, run_id: String) -> Result<LaunchSpec, String> {
    let cwd = execution_path(item);
    let prompt = review_prompt(item);
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    let runner = settings.default_review_runner.clone();
    let model = runner_model(
        &settings,
        runner.as_str(),
        Some((
            settings.default_review_runner.as_str(),
            settings.default_review_model.as_str(),
        )),
    );

    match runner.as_str() {
        "open-code" => Ok(LaunchSpec {
            command: "opencode".to_string(),
            args: vec![
                "run".to_string(),
                "--dir".to_string(),
                cwd.clone(),
                "--model".to_string(),
                model,
                "--dangerously-skip-permissions".to_string(),
                "--title".to_string(),
                format!("Review {}", queue_item_title(item)),
                prompt,
            ],
            cwd,
            run_id,
            agent: "open-code-review".to_string(),
        }),
        "antigravity" => Ok(LaunchSpec {
            command: "agy".to_string(),
            args: vec![
                "--print".to_string(),
                "--model".to_string(),
                model,
                "--dangerously-skip-permissions".to_string(),
                prompt,
            ],
            cwd,
            run_id,
            agent: "antigravity-review".to_string(),
        }),
        "codex" => Ok(LaunchSpec {
            command: "/Applications/Codex.app/Contents/Resources/codex".to_string(),
            args: vec![
                "exec".to_string(),
                "-C".to_string(),
                cwd.clone(),
                "--model".to_string(),
                model,
                "--sandbox".to_string(),
                "workspace-write".to_string(),
                prompt,
            ],
            cwd,
            run_id,
            agent: "codex-review".to_string(),
        }),
        other if direct_model::is_direct_provider_runner(other) => {
            Err(direct_model::pending_runtime_error(other))
        },
        other => Err(format!("Unsupported review runner: {}", other)),
    }
}

fn append_history(item: &mut brain::QueueItem, event: &str, detail: &str, agent: Option<String>) {
    item.history.push(brain::QueueHistoryEntry {
        at: atomic::utc_now_iso(),
        by: "brain-loop".to_string(),
        status: None,
        note: None,
        event: Some(event.to_string()),
        detail: Some(detail.to_string()),
        review_path: None,
        active_handoff_path: None,
        handoff_path: None,
        agent,
    });
}

fn launch_detail(spec: &LaunchSpec) -> String {
    let mut args = spec.args.clone();
    if let Some(last) = args.last_mut() {
        if last.contains("brain-work-from-handoff") || last.contains("brain-review-handoff") {
            *last = "<prompt>".to_string();
        }
    }
    format!("{} {}", spec.command, args.join(" "))
}

fn direct_launch_detail(spec: &DirectImplementationSpec) -> String {
    format!(
        "direct-provider {} model={} cwd={}",
        spec.provider.provider_id, spec.model, spec.cwd
    )
}

fn runner_model(settings: &Settings, runner: &str, role_default: Option<(&str, &str)>) -> String {
    if let Some((role_runner, role_model)) = role_default {
        if role_runner == runner && !role_model.trim().is_empty() {
            return role_model.to_string();
        }
    }

    settings
        .runner_catalog
        .iter()
        .find(|entry| entry.id == runner)
        .map(|entry| entry.default_model.clone())
        .filter(|model| !model.trim().is_empty())
        .unwrap_or_else(|| match runner {
            "antigravity" => "3.1 pro".to_string(),
            "codex" => default_review_model(),
            runner => direct_model::built_in_provider(runner)
                .map(|provider| provider.default_model)
                .unwrap_or_else(default_implementation_model),
        })
}

fn recommended_model_for_runner(settings: &Settings, runner: &str) -> Option<String> {
    if settings.default_implementation_runner == runner && !settings.default_implementation_model.trim().is_empty() {
        return Some(settings.default_implementation_model.clone());
    }

    settings
        .runner_catalog
        .iter()
        .find(|entry| entry.id == runner)
        .map(|entry| entry.default_model.clone())
        .filter(|model| !model.trim().is_empty())
}

fn persist_thread_from_item(item: &brain::QueueItem) -> Result<(), String> {
    if let Ok(value) = serde_json::to_value(item) {
        agent_thread::upsert_from_queue_value(&value)?;
    }
    Ok(())
}

#[derive(Debug, Default)]
struct MaxLoopRuntimeState {
    total_active: usize,
    runner_active: HashMap<String, usize>,
    project_active: HashMap<String, usize>,
    runner_project_active: HashMap<String, usize>,
}

fn runner_project_key(project_id: &str, runner: &str) -> String {
    format!("{}::{}", project_id, runner)
}

impl MaxLoopRuntimeState {
    fn from_queue(queue: &[QueueItem]) -> Self {
        let mut state = Self::default();
        for item in queue {
            if !matches!(item.status.as_str(), "picked" | "started") {
                continue;
            }
            state.note_active(&item.project_id, &item.agent);
        }
        state
    }

    fn note_active(&mut self, project_id: &str, runner: &str) {
        self.total_active += 1;
        *self.runner_active.entry(runner.to_string()).or_insert(0) += 1;
        *self.project_active.entry(project_id.to_string()).or_insert(0) += 1;
        *self
            .runner_project_active
            .entry(runner_project_key(project_id, runner))
            .or_insert(0) += 1;
    }
}

fn max_loop_global_cap(settings: &Settings, legacy_max: usize) -> usize {
    std::cmp::min(
        settings.max_loop_policy.global_max.max(1) as usize,
        legacy_max.max(1),
    )
}

fn max_loop_waiting_reason(
    settings: &Settings,
    active: &MaxLoopRuntimeState,
    item: &QueueItem,
    legacy_max: usize,
) -> Option<String> {
    let global_cap = max_loop_global_cap(settings, legacy_max);
    if active.total_active >= global_cap {
        return Some(format!(
            "Waiting on MaxLoop global cap: {} active implementation agents >= {}.",
            active.total_active, global_cap
        ));
    }

    if let Some(cap) = settings.max_loop_policy.runner_caps.get(&item.agent) {
        let count = active.runner_active.get(&item.agent).copied().unwrap_or(0);
        if count >= *cap as usize {
            return Some(format!(
                "Waiting on MaxLoop runner cap for {}: {} active >= {}.",
                item.agent, count, cap
            ));
        }
    }

    if let Some(cap) = settings.max_loop_policy.project_caps.get(&item.project_id) {
        let count = active.project_active.get(&item.project_id).copied().unwrap_or(0);
        if count >= *cap as usize {
            return Some(format!(
                "Waiting on MaxLoop project cap for {}: {} active >= {}.",
                item.project_id, count, cap
            ));
        }
    }

    if let Some(project_runner_caps) = settings.max_loop_policy.runner_project_caps.get(&item.project_id) {
        if let Some(cap) = project_runner_caps.get(&item.agent) {
            let key = runner_project_key(&item.project_id, &item.agent);
            let count = active.runner_project_active.get(&key).copied().unwrap_or(0);
            if count >= *cap as usize {
                return Some(format!(
                    "Waiting on MaxLoop runner-project cap for {} / {}: {} active >= {}.",
                    item.project_id, item.agent, count, cap
                ));
            }
        }
    }

    None
}

fn record_max_loop_wait(item_id: &str, reason: &str) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", item_id, e))?
    else {
        return Ok(());
    };

    if item.waiting_reason.as_deref() == Some(reason) {
        return Ok(());
    }

    let agent = item.agent.clone();
    item.waiting_reason = Some(reason.to_string());
    append_history(
        &mut item,
        "maxloop_waiting",
        reason,
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write MaxLoop wait reason for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn record_dependency_wait(item_id: &str, reason: &str, blocked_by: &[String]) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", item_id, e))?
    else {
        return Ok(());
    };

    if item.waiting_reason.as_deref() == Some(reason) && item.blocked_by == blocked_by {
        return Ok(());
    }

    let agent = item.agent.clone();
    item.waiting_reason = Some(reason.to_string());
    item.blocked_by = blocked_by.to_vec();
    append_history(
        &mut item,
        "dependency_waiting",
        reason,
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write dependency wait reason for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn record_runner_disabled_wait(item_id: &str, reason: &str) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", item_id, e))?
    else {
        return Ok(());
    };

    if item.waiting_reason.as_deref() == Some(reason) {
        return Ok(());
    }

    let agent = item.agent.clone();
    item.waiting_reason = Some(reason.to_string());
    append_history(
        &mut item,
        "runner_disabled_waiting",
        reason,
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write runner disabled wait reason for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn record_review_capacity_wait(item_id: &str, reason: &str) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "submitted" {
        return Ok(());
    }

    if item.waiting_reason.as_deref() == Some(reason) {
        return Ok(());
    }

    let agent = item.agent.clone();
    item.waiting_reason = Some(reason.to_string());
    append_history(
        &mut item,
        "review_capacity_waiting",
        reason,
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write review wait reason for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn runner_disabled_waiting_reason(settings: &Settings, runner_id: &str) -> Option<String> {
    let Some(entry) = settings
        .runner_catalog
        .iter()
        .find(|entry| entry.id == runner_id)
    else {
        return Some(format!(
            "Waiting on unsupported runner `{}`. Enable or replace the queue item's runner before dispatch.",
            runner_id
        ));
    };

    if !entry.enabled {
        return Some(format!(
            "Waiting on disabled runner `{}`. Enable it in Settings > Agents before dispatch.",
            runner_id
        ));
    }

    None
}

fn priority_rank(priority: &str) -> usize {
    match priority {
        "high" => 0,
        "medium" => 1,
        _ => 2,
    }
}

fn implementation_candidate_order(policy: &str, left: &QueueItem, right: &QueueItem) -> std::cmp::Ordering {
    if policy == "fifo" {
        return left
            .created_at
            .cmp(&right.created_at)
            .then_with(|| left.id.cmp(&right.id));
    }

    let left_fix_rank = if left.status == "reviewed-fix-request" { 0 } else { 1 };
    let right_fix_rank = if right.status == "reviewed-fix-request" { 0 } else { 1 };
    left_fix_rank
        .cmp(&right_fix_rank)
        .then_with(|| priority_rank(&left.priority).cmp(&priority_rank(&right.priority)))
        .then_with(|| left.created_at.cmp(&right.created_at))
        .then_with(|| left.id.cmp(&right.id))
}

fn dependency_cycle_detected(
    item_id: &str,
    current_id: &str,
    depends_on: &HashMap<String, Vec<String>>,
    visiting: &mut HashSet<String>,
) -> bool {
    if !visiting.insert(current_id.to_string()) {
        return false;
    }

    let Some(dependencies) = depends_on.get(current_id) else {
        visiting.remove(current_id);
        return false;
    };

    for dependency in dependencies {
        if dependency == item_id {
            visiting.remove(current_id);
            return true;
        }
        if dependency_cycle_detected(item_id, dependency, depends_on, visiting) {
            visiting.remove(current_id);
            return true;
        }
    }

    visiting.remove(current_id);
    false
}

fn dependency_waiting_reason(
    queue: &[QueueItem],
    item: &QueueItem,
) -> Option<(String, Vec<String>)> {
    let dependencies = item
        .depends_on
        .iter()
        .map(|dependency| dependency.trim())
        .filter(|dependency| !dependency.is_empty())
        .collect::<Vec<_>>();

    if dependencies.is_empty() {
        return None;
    }

    if dependencies.iter().any(|dependency| *dependency == item.id) {
        return Some((
            "Waiting on task dependency cycle: item depends on itself.".to_string(),
            vec![item.id.clone()],
        ));
    }

    let by_id = queue
        .iter()
        .map(|candidate| (candidate.id.as_str(), candidate))
        .collect::<HashMap<_, _>>();
    let depends_on = queue
        .iter()
        .map(|candidate| (candidate.id.clone(), candidate.depends_on.clone()))
        .collect::<HashMap<_, _>>();

    if dependency_cycle_detected(&item.id, &item.id, &depends_on, &mut HashSet::new()) {
        return Some((
            "Waiting on task dependency cycle in queue dependencies.".to_string(),
            dependencies.iter().map(|dependency| (*dependency).to_string()).collect(),
        ));
    }

    let mut blocked_by = Vec::new();
    let mut missing = Vec::new();
    let mut blocked = Vec::new();

    for dependency in dependencies {
        match by_id.get(dependency) {
            Some(dependency_item) if dependency_item.status == "approved" => {}
            Some(dependency_item) if dependency_item.status == "blocked" => {
                blocked.push((*dependency).to_string());
                blocked_by.push((*dependency).to_string());
            }
            Some(_) => {
                blocked_by.push((*dependency).to_string());
            }
            None => {
                missing.push((*dependency).to_string());
                blocked_by.push((*dependency).to_string());
            }
        }
    }

    if blocked_by.is_empty() {
        return None;
    }

    if !blocked.is_empty() {
        return Some((
            format!("Waiting on blocked dependency task(s): {}.", blocked.join(", ")),
            blocked_by,
        ));
    }

    if !missing.is_empty() {
        return Some((
            format!("Waiting on missing dependency task(s): {}.", missing.join(", ")),
            blocked_by,
        ));
    }

    Some((
        format!("Waiting on dependency task(s): {}.", blocked_by.join(", ")),
        blocked_by,
    ))
}

fn block_queue_item(mut item: brain::QueueItem, by: &str, event: &str, detail: &str) -> Result<(), String> {
    item.last_error = Some(detail.to_string());
    brain::update_queue_item_status(&mut item, "blocked", by, Some(detail), Some(event), Some(detail))
        .map_err(|e| format!("Failed to block queue item: {}", e))?;
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write blocked queue item: {}", e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn block_direct_queue_item(queue_item_id: &str, event: &str, detail: &str) -> Result<(), String> {
    let Some(item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if !matches!(item.status.as_str(), "picked" | "started" | "stale-started") {
        return Ok(());
    }

    block_queue_item(item, "brain-loop", event, detail)
}

fn submit_direct_queue_item(mut item: brain::QueueItem, event: &str, detail: &str) -> Result<(), String> {
    brain::update_queue_item_status(
        &mut item,
        "submitted",
        "brain-loop",
        Some(detail),
        Some(event),
        Some(detail),
    )
    .map_err(|e| format!("Failed to submit direct queue item {}: {}", item.id, e))?;
    item.waiting_reason = None;
    item.blocked_by.clear();
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write submitted direct queue item {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn mark_direct_approval_waiting(
    queue_item_id: &str,
    result: &direct_model::DirectModelToolLoopResult,
) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "started" {
        return Ok(());
    }

    let approval_ids = result
        .approval_requests
        .iter()
        .map(|approval| approval.approval_request.id.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    let detail = if approval_ids.is_empty() {
        "Waiting for direct model tool approval.".to_string()
    } else {
        format!("Waiting for direct model tool approval: {}.", approval_ids)
    };
    let agent = item.agent.clone();
    item.waiting_reason = Some(detail.clone());
    append_history(
        &mut item,
        "direct_model_approval_waiting",
        &detail,
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write direct approval wait for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn finish_task_result(
    result: &direct_model::DirectModelToolLoopResult,
) -> Option<&direct_model::DirectModelToolResult> {
    result
        .tool_results
        .iter()
        .rev()
        .find(|execution| execution.tool_result.name == "finish_task")
        .map(|execution| &execution.tool_result)
}

fn apply_direct_implementation_result(
    queue_item_id: &str,
    result: direct_model::DirectModelToolLoopResult,
) -> Result<(), String> {
    if result.stopped_reason == "approval_required" {
        return mark_direct_approval_waiting(queue_item_id, &result);
    }

    let Some(item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "started" {
        return Ok(());
    }

    if result.stopped_reason == "max_iterations" {
        return block_queue_item(
            item,
            "brain-loop",
            "direct_model_max_iterations",
            "Direct model reached the maximum tool-loop iterations before finishing.",
        );
    }

    if result.completed {
        let finish = finish_task_result(&result);
        let detail = finish
            .map(|tool_result| tool_result.content.as_str())
            .filter(|content| !content.trim().is_empty())
            .unwrap_or("Direct model completed implementation.");
        let requested_status = finish
            .and_then(|tool_result| tool_result.metadata.get("requestedQueueStatus"))
            .map(|status| status.as_str())
            .unwrap_or("submitted");

        return match requested_status {
            "submitted" => submit_direct_queue_item(item, "direct_model_completed", detail),
            "blocked" => block_queue_item(item, "brain-loop", "direct_model_blocked", detail),
            other => block_queue_item(
                item,
                "brain-loop",
                "direct_model_invalid_finish_status",
                &format!(
                    "Direct model requested unsupported implementation status `{}`. {}",
                    other, detail
                ),
            ),
        };
    }

    block_queue_item(
        item,
        "brain-loop",
        "direct_model_incomplete",
        &format!(
            "Direct model stopped before completion: {}.",
            result.stopped_reason
        ),
    )
}

fn direct_review_tool_specs() -> Vec<direct_model::DirectModelToolSpec> {
    direct_model::tool_specs()
        .into_iter()
        .filter(|tool| matches!(tool.name.as_str(), "read_file" | "search_text" | "finish_task"))
        .collect()
}

fn apply_direct_review_result(
    app: &AppHandle,
    queue_item_id: &str,
    result: direct_model::DirectModelToolLoopResult,
) -> Result<(), String> {
    let Some(mut item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "reviewing" {
        return Ok(());
    }

    if result.stopped_reason == "max_iterations" {
        return block_queue_item(
            item,
            "brain-loop",
            "direct_review_max_iterations",
            "Direct review reached the maximum tool-loop iterations before finishing.",
        );
    }

    if !result.completed {
        return block_queue_item(
            item,
            "brain-loop",
            "direct_review_incomplete",
            &format!("Direct review stopped before completion: {}.", result.stopped_reason),
        );
    }

    let finish = finish_task_result(&result);
    let detail = finish
        .map(|tool_result| tool_result.content.as_str())
        .filter(|content| !content.trim().is_empty())
        .unwrap_or("Direct review completed.");
    let requested_status = finish
        .and_then(|tool_result| tool_result.metadata.get("requestedQueueStatus"))
        .map(|status| status.as_str())
        .unwrap_or("blocked");

    match requested_status {
        "reviewed-fix-request" | "landing" => {
            brain::update_queue_item_status(
                &mut item,
                requested_status,
                "brain-loop",
                Some(detail),
                Some("direct_review_completed"),
                Some(detail),
            )
            .map_err(|e| format!("Failed to apply direct review result for {}: {}", item.id, e))?;
            item.waiting_reason = None;
            item.blocked_by.clear();
            brain::write_queue_item(&item)
                .map_err(|e| format!("Failed to write direct review result for {}: {}", item.id, e))?;
            persist_thread_from_item(&item)?;
            if requested_status == "landing" {
                landing::apply_landing_policy(app, &item)?;
            }
            Ok(())
        }
        "blocked" => block_queue_item(item, "brain-loop", "direct_review_blocked", detail),
        other => block_queue_item(
            item,
            "brain-loop",
            "direct_review_invalid_finish_status",
            &format!(
                "Direct review requested unsupported review status `{}`. {}",
                other, detail
            ),
        ),
    }
}

fn spawn_direct_implementation_runner(
    app: AppHandle,
    item: brain::QueueItem,
    spec: DirectImplementationSpec,
    initial_tool_results: Vec<direct_model::DirectModelToolResult>,
) {
    let queue_item_id = item.id.clone();
    let project_id = item.project_id.clone();
    thread::spawn(move || {
        let review_app = app.clone();
        let has_initial_tool_results = !initial_tool_results.is_empty();
        let mut messages = vec![direct_model::DirectModelMessage {
            role: "user".to_string(),
            content: spec.prompt.clone(),
            provider_message_id: None,
            created_at: None,
            metadata: BTreeMap::new(),
        }];
        if has_initial_tool_results {
            messages.push(direct_model::DirectModelMessage {
                role: "user".to_string(),
                content: "An approved direct-model tool has completed. Continue from the tool result and finish the implementation with finish_task when ready.".to_string(),
                provider_message_id: None,
                created_at: None,
                metadata: BTreeMap::new(),
            });
        }
        let turn_input = direct_model::DirectModelTurnInput {
            runner_id: spec.provider.runner_id.clone(),
            provider_id: spec.provider.provider_id.clone(),
            api_style: spec.provider.api_style.clone(),
            model: spec.model.clone(),
            queue_item_id: queue_item_id.clone(),
            thread_id: agent_thread::thread_id_for_queue_item(&queue_item_id),
            execution_path: spec.cwd.clone(),
            system_prompt: direct_implementation_system_prompt(),
            messages,
            tools: direct_model::tool_specs(),
            tool_results: initial_tool_results,
            approval_policy: "on-risky-action".to_string(),
        };
        let input = direct_model::DirectModelToolLoopInput {
            turn_input,
            max_iterations: Some(6),
        };

        let runtime = match tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .worker_threads(2)
            .thread_name("brain-loop-direct-model")
            .build()
        {
            Ok(runtime) => runtime,
            Err(e) => {
                let detail = format!("Failed to start direct model runtime: {}", e);
                let _ = block_direct_queue_item(&queue_item_id, "direct_model_runtime_failed", &detail);
                let _ = scheduler::log_decision(&format!(
                    "DIRECT DISPATCH FAILED: {} ({}) — {}",
                    queue_item_id, project_id, detail
                ));
                return;
            }
        };

        let result = runtime.block_on(direct_model::execute_provider_tool_loop(app, input));
        let apply_result = match result {
            Ok(result) => apply_direct_implementation_result(&queue_item_id, result),
            Err(e) => block_direct_queue_item(
                &queue_item_id,
                "direct_model_failed",
                &format!("Direct model runner failed: {}", e),
            ),
        };

        if let Err(e) = apply_result {
            let _ = scheduler::log_decision(&format!(
                "DIRECT DISPATCH RECONCILE FAILED: {} ({}) — {}",
                queue_item_id, project_id, e
            ));
            return;
        }

        let submitted = brain::read_queue_item(&queue_item_id)
            .ok()
            .flatten()
            .map(|item| item.status == "submitted")
            .unwrap_or(false);
        if submitted && scheduler::SCHEDULER.get_state().as_deref() == Ok("running") {
            let _ = run_review_once(review_app);
        }
    });
}

fn spawn_direct_review_runner(app: AppHandle, item: brain::QueueItem, spec: DirectReviewSpec) {
    let queue_item_id = item.id.clone();
    let project_id = item.project_id.clone();
    thread::spawn(move || {
        let followup_app = app.clone();
        let messages = vec![direct_model::DirectModelMessage {
            role: "user".to_string(),
            content: spec.prompt.clone(),
            provider_message_id: None,
            created_at: None,
            metadata: BTreeMap::new(),
        }];
        let turn_input = direct_model::DirectModelTurnInput {
            runner_id: spec.provider.runner_id.clone(),
            provider_id: spec.provider.provider_id.clone(),
            api_style: spec.provider.api_style.clone(),
            model: spec.model.clone(),
            queue_item_id: queue_item_id.clone(),
            thread_id: agent_thread::thread_id_for_queue_item(&queue_item_id),
            execution_path: spec.cwd.clone(),
            system_prompt: direct_review_system_prompt(),
            messages,
            tools: direct_review_tool_specs(),
            tool_results: Vec::new(),
            approval_policy: "never".to_string(),
        };
        let input = direct_model::DirectModelToolLoopInput {
            turn_input,
            max_iterations: Some(4),
        };

        let runtime = match tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .worker_threads(2)
            .thread_name("brain-loop-direct-review")
            .build()
        {
            Ok(runtime) => runtime,
            Err(e) => {
                let detail = format!("Failed to start direct review runtime: {}", e);
                let _ = block_queue_item(
                    item.clone(),
                    "brain-loop",
                    "direct_review_runtime_failed",
                    &detail,
                );
                let _ = scheduler::log_decision(&format!(
                    "DIRECT REVIEW FAILED: {} ({}) — {}",
                    queue_item_id, project_id, detail
                ));
                return;
            }
        };

        let result = runtime.block_on(direct_model::execute_provider_tool_loop(app.clone(), input));
        let apply_result = match result {
            Ok(result) => apply_direct_review_result(&app, &queue_item_id, result),
            Err(e) => {
                let Some(item) = brain::read_queue_item(&queue_item_id).ok().flatten() else {
                    return;
                };
                block_queue_item(
                    item,
                    "brain-loop",
                    "direct_review_failed",
                    &format!("Direct review runner failed: {}", e),
                )
            }
        };

        if let Err(e) = apply_result {
            let _ = scheduler::log_decision(&format!(
                "DIRECT REVIEW RECONCILE FAILED: {} ({}) — {}",
                queue_item_id, project_id, e
            ));
            return;
        }

        if scheduler::SCHEDULER.get_state().as_deref() != Ok("running") {
            return;
        }

        let status = brain::read_queue_item(&queue_item_id)
            .ok()
            .flatten()
            .map(|item| item.status)
            .unwrap_or_default();
        if status == "reviewed-fix-request" {
            let _ = run_implementation_once(followup_app.clone());
        }
        let _ = run_review_once(followup_app);
    });
}

fn resume_direct_implementation_after_approved_tool(
    app: AppHandle,
    approval_request: &approval::ApprovalRequest,
    tool_result: direct_model::DirectModelToolResult,
) -> Result<(), String> {
    let Some(queue_item_id) = approval_request.queue_item_id.as_deref() else {
        return Ok(());
    };
    let Some(mut item) = brain::read_queue_item(queue_item_id)
        .map_err(|e| format!("Failed to read queue item {} after approved tool: {}", queue_item_id, e))?
    else {
        return Ok(());
    };

    if item.status != "started" || !direct_model::is_direct_provider_runner(item.agent.as_str()) {
        return Ok(());
    }

    let run_id = item
        .runner_id
        .clone()
        .unwrap_or_else(|| launch_run_id("implementation", &item.id));
    let Some(spec) = direct_implementation_spec(&item, run_id.clone())? else {
        return Ok(());
    };

    item.waiting_reason = None;
    item.blocked_by.clear();
    let agent = item.agent.clone();
    append_history(
        &mut item,
        "direct_model_approved_tool_resuming",
        &format!(
            "Approved direct tool {} completed; resuming provider loop.",
            tool_result.name
        ),
        Some(agent),
    );
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write direct resume state for {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;

    let mut initial_tool_results = direct_model::prior_tool_results_from_approval(approval_request)?;
    initial_tool_results.push(tool_result);
    spawn_direct_implementation_runner(app, item, spec, initial_tool_results);
    Ok(())
}

#[tauri::command]
fn execute_approved_direct_model_tool(
    app: AppHandle,
    input: direct_model::DirectModelApprovedToolExecutionInput,
) -> Result<direct_model::DirectModelApprovedToolExecutionResult, String> {
    let result = direct_model::execute_approved_tool(app.clone(), input.clone())?;
    resume_direct_implementation_after_approved_tool(
        app,
        &result.approval_request,
        result.tool_execution_result.tool_result.clone(),
    )?;
    Ok(result)
}

struct RunCompletion {
    status: String,
    exit_code: Option<i32>,
    error: Option<String>,
}

fn sanitized_run_id(id: &str) -> String {
    id.chars()
        .map(|ch| if ch.is_alphanumeric() || ch == '-' { ch } else { '_' })
        .collect()
}

fn is_older_than_minutes(timestamp: Option<&String>, minutes: i64) -> bool {
    let Some(timestamp) = timestamp else {
        return false;
    };
    let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(timestamp) else {
        return false;
    };
    chrono::Utc::now().signed_duration_since(parsed.with_timezone(&chrono::Utc))
        >= chrono::Duration::minutes(minutes)
}

fn find_run_completion(queue_item_id: &str, run_id: Option<&String>) -> Option<RunCompletion> {
    let run_id = run_id?;
    let safe_run_id = sanitized_run_id(run_id);
    let runs_dir = state::logs_dir().join("runs");
    let entries = fs::read_dir(runs_dir).ok()?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !path.extension().map_or(false, |ext| ext == "json") {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default();
        if !file_name.contains(&safe_run_id) {
            continue;
        }

        let Ok(content) = fs::read_to_string(&path) else {
            continue;
        };
        let Ok(metadata) = serde_json::from_str::<serde_json::Value>(&content) else {
            continue;
        };
        if metadata
            .get("queueItemId")
            .and_then(|value| value.as_str())
            != Some(queue_item_id)
        {
            continue;
        }

        let status = metadata
            .get("status")
            .and_then(|value| value.as_str())
            .unwrap_or("unknown")
            .to_string();
        if status != "completed" && status != "blocked" {
            continue;
        }

        return Some(RunCompletion {
            status,
            exit_code: metadata
                .get("exitCode")
                .and_then(|value| value.as_i64())
                .and_then(|code| i32::try_from(code).ok()),
            error: metadata
                .get("error")
                .and_then(|value| value.as_str())
                .map(String::from),
        });
    }

    None
}

fn has_history_event(item: &brain::QueueItem, event: &str) -> bool {
    item.history
        .iter()
        .any(|entry| entry.event.as_deref() == Some(event))
}

fn apply_stale_implementation_reconciliation(
    mut item: brain::QueueItem,
    completion: Option<RunCompletion>,
) -> Result<(), String> {
    if let Some(completion) = completion {
        if completion.status == "completed" && completion.exit_code == Some(0) {
            let detail = "Recovered completed implementation runner from run metadata.";
            item.last_error = None;
            brain::update_queue_item_status(
                &mut item,
                "submitted",
                "brain-loop",
                Some(detail),
                Some("stale_runner_completed"),
                Some(detail),
            )
            .map_err(|e| format!("Failed to submit stale completed item {}: {}", item.id, e))?;
            brain::write_queue_item(&item)
                .map_err(|e| format!("Failed to write reconciled item {}: {}", item.id, e))?;
            persist_thread_from_item(&item)?;
            return Ok(());
        }

        let detail = completion.error.unwrap_or_else(|| {
            format!(
                "Recovered failed implementation runner from run metadata; exit code {}.",
                completion
                    .exit_code
                    .map(|code| code.to_string())
                    .unwrap_or_else(|| "unknown".to_string())
            )
        });
        block_queue_item(item, "brain-loop", "stale_runner_failed", &detail)?;
        return Ok(());
    }

    let detail = "Implementation runner exceeded maxPickedMinutes without completion metadata.";
    item.last_error = Some(detail.to_string());
    brain::update_queue_item_status(
        &mut item,
        "stale-started",
        "brain-loop",
        Some(detail),
        Some("stale_started_detected"),
        Some(detail),
    )
    .map_err(|e| format!("Failed to mark stale started item {}: {}", item.id, e))?;
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write stale started item {}: {}", item.id, e))?;
    persist_thread_from_item(&item)?;
    Ok(())
}

fn apply_stale_review_reconciliation(
    item: brain::QueueItem,
    completion: Option<RunCompletion>,
) -> Result<(), String> {
    let detail = if let Some(completion) = completion {
        if completion.status == "completed" && completion.exit_code == Some(0) {
            "Recovered completed review runner from run metadata, but the queue item was still reviewing; manual reconciliation required.".to_string()
        } else {
            completion.error.unwrap_or_else(|| {
                format!(
                    "Recovered failed review runner from run metadata; exit code {}.",
                    completion
                        .exit_code
                        .map(|code| code.to_string())
                        .unwrap_or_else(|| "unknown".to_string())
                )
            })
        }
    } else {
        "Review runner exceeded maxPickedMinutes without completion metadata.".to_string()
    };

    block_queue_item(item, "brain-loop", "stale_review_blocked", &detail)
}

fn reconcile_stale_active_items() -> Result<usize, String> {
    let max_minutes = scheduler::read_max_picked_minutes();
    let queues_dir = state::queues_dir();
    if !queues_dir.exists() {
        return Ok(0);
    }

    let entries = fs::read_dir(&queues_dir)
        .map_err(|e| format!("Failed to read queue directory: {}", e))?;
    let mut reconciled = 0usize;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !path.extension().map_or(false, |ext| ext == "json") {
            continue;
        }

        let Some(queue_item_id) = path.file_stem().and_then(|name| name.to_str()) else {
            continue;
        };
        let Some(mut item) = brain::read_queue_item(queue_item_id)
            .map_err(|e| format!("Failed to read queue item {}: {}", queue_item_id, e))?
        else {
            continue;
        };

        match item.status.as_str() {
            "picked" if is_older_than_minutes(item.picked_at.as_ref(), max_minutes) => {
                let detail = "Picked reservation exceeded maxPickedMinutes; returned to queued.";
                item.last_error = None;
                brain::update_queue_item_status(
                    &mut item,
                    "queued",
                    "brain-loop",
                    Some(detail),
                    Some("stale_picked_requeued"),
                    Some(detail),
                )
                .map_err(|e| format!("Failed to requeue stale picked item {}: {}", item.id, e))?;
                brain::write_queue_item(&item)
                    .map_err(|e| format!("Failed to write requeued item {}: {}", item.id, e))?;
                persist_thread_from_item(&item)?;
                scheduler::log_decision(&format!("RECONCILE: {} {}", item.id, detail));
                reconciled += 1;
            }
            "started" if is_older_than_minutes(item.agent_started_at.as_ref().or(item.picked_at.as_ref()), max_minutes) => {
                if direct_model::is_direct_provider_runner(item.agent.as_str())
                    && item
                        .waiting_reason
                        .as_deref()
                        .map(|reason| reason.starts_with("Waiting for direct model tool approval"))
                        .unwrap_or(false)
                {
                    scheduler::log_decision(&format!(
                        "RECONCILE: {} direct model is waiting for approval",
                        item.id
                    ));
                    continue;
                }
                let completion = find_run_completion(&item.id, item.runner_id.as_ref());
                let item_id = item.id.clone();
                apply_stale_implementation_reconciliation(item, completion)?;
                scheduler::log_decision(&format!("RECONCILE: {} stale implementation reconciled", item_id));
                reconciled += 1;
            }
            "reviewing" if is_older_than_minutes(item.agent_started_at.as_ref().or(item.submitted_at.as_ref()), max_minutes) => {
                let completion = find_run_completion(&item.id, item.review_runner_id.as_ref());
                let item_id = item.id.clone();
                apply_stale_review_reconciliation(item, completion)?;
                scheduler::log_decision(&format!("RECONCILE: {} stale review reconciled", item_id));
                reconciled += 1;
            }
            "stale-started" if !has_history_event(&item, "stale_started_capacity_released") => {
                let agent = item.agent.clone();
                append_history(
                    &mut item,
                    "stale_started_capacity_released",
                    "Stale implementation item is no longer counted as an active implementation agent.",
                    Some(agent),
                );
                brain::write_queue_item(&item)
                    .map_err(|e| format!("Failed to write stale capacity audit {}: {}", item.id, e))?;
                persist_thread_from_item(&item)?;
                reconciled += 1;
            }
            _ => {}
        }
    }

    Ok(reconciled)
}

fn launch_implementation_item(app: AppHandle, queue_item_id: &str) -> Result<String, String> {
    let mut item = prepare_queue_item_thread_context(queue_item_id, "implementation_thread_prepared")?;
    let run_id = launch_run_id("implementation", &item.id);
    let direct_spec = direct_implementation_spec(&item, run_id.clone())?;
    let cli_spec = if direct_spec.is_none() {
        match implementation_launch_spec(&item, run_id.clone()) {
            Ok(spec) => Some(spec),
            Err(e) => {
                let _ = block_queue_item(item, "brain-loop", "unsupported_agent", &e);
                return Err(e);
            }
        }
    } else {
        None
    };

    brain::update_queue_item_status(
        &mut item,
        "picked",
        "brain-loop",
        Some("Reserved implementation agent slot."),
        Some("implementation_picked"),
        Some("Reserved implementation agent slot."),
    )
    .map_err(|e| format!("Failed to reserve implementation item: {}", e))?;
    brain::update_queue_item_status(
        &mut item,
        "started",
        "brain-loop",
        Some("Implementation runner launched."),
        Some("implementation_started"),
        Some("Implementation runner launched."),
    )
    .map_err(|e| format!("Failed to mark implementation started: {}", e))?;
    item.started_by = Some("brain-loop".to_string());
    item.runner_id = Some(run_id.clone());
    item.last_error = None;
    item.waiting_reason = None;
    item.blocked_by.clear();
    if let Some(spec) = direct_spec.as_ref() {
        item.session_id = Some(spec.run_id.clone());
        append_history(
            &mut item,
            "direct_runner_launch",
            &direct_launch_detail(spec),
            Some(spec.agent.clone()),
        );
    } else if let Some(spec) = cli_spec.as_ref() {
        append_history(
            &mut item,
            "runner_launch",
            &launch_detail(spec),
            Some(spec.agent.clone()),
        );
    }
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write started queue item: {}", e))?;
    persist_thread_from_item(&item)?;

    if let Some(spec) = direct_spec {
        spawn_direct_implementation_runner(app, item.clone(), spec, Vec::new());
        return Ok(format!("Started direct implementation runner {} for {}", run_id, item.id));
    }

    let Some(spec) = cli_spec else {
        return Err(format!("Unsupported implementation agent: {}", item.agent));
    };

    runner::run_process(
        app,
        spec.command,
        spec.args,
        Some(spec.cwd),
        Some(item.id.clone()),
        Some(item.project_id.clone()),
        Some(spec.agent),
        run_id.clone(),
    )?;

    Ok(format!("Started implementation runner {} for {}", run_id, item.id))
}

fn launch_review_item(app: AppHandle, queue_item_id: &str) -> Result<String, String> {
    let mut item = prepare_queue_item_thread_context(queue_item_id, "review_thread_prepared")?;
    let run_id = launch_run_id("review", &item.id);
    let direct_spec = direct_review_spec(&item, run_id.clone())?;
    let cli_spec = if direct_spec.is_none() {
        match review_launch_spec(&item, run_id.clone()) {
            Ok(spec) => Some(spec),
            Err(e) => {
                let _ = block_queue_item(item, "brain-loop", "unsupported_review_runner", &e);
                return Err(e);
            }
        }
    } else {
        None
    };

    brain::update_queue_item_status(
        &mut item,
        "reviewing",
        "brain-loop",
        Some("Review runner launched."),
        Some("review_started"),
        Some("Review runner launched."),
    )
    .map_err(|e| format!("Failed to mark review started: {}", e))?;
    item.review_runner_id = Some(run_id.clone());
    item.last_error = None;
    item.waiting_reason = None;
    item.blocked_by.clear();
    if let Some(spec) = direct_spec.as_ref() {
        item.session_id = Some(spec.run_id.clone());
        append_history(
            &mut item,
            "direct_review_runner_launch",
            &format!(
                "direct-provider {} model={} cwd={}",
                spec.provider.provider_id, spec.model, spec.cwd
            ),
            Some(spec.agent.clone()),
        );
    } else if let Some(spec) = cli_spec.as_ref() {
        append_history(
            &mut item,
            "review_runner_launch",
            &launch_detail(spec),
            Some(spec.agent.clone()),
        );
    }
    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write reviewing queue item: {}", e))?;
    persist_thread_from_item(&item)?;

    if let Some(spec) = direct_spec {
        spawn_direct_review_runner(app, item.clone(), spec);
        return Ok(format!("Started direct review runner {} for {}", run_id, item.id));
    }

    let Some(spec) = cli_spec else {
        return Err(format!("Unsupported review runner for {}", item.id));
    };

    runner::run_process(
        app,
        spec.command,
        spec.args,
        Some(spec.cwd),
        Some(item.id.clone()),
        Some(item.project_id.clone()),
        Some(spec.agent),
        run_id.clone(),
    )?;

    Ok(format!("Started review runner {} for {}", run_id, item.id))
}

#[tauri::command]
fn update_queue_item_status(
    app: AppHandle,
    item_id: String,
    new_status: String,
    by: String,
    note: Option<String>,
    event: Option<String>,
    detail: Option<String>,
) -> Result<brain::QueueItem, String> {
    let mut item = brain::read_queue_item(&item_id)
        .map_err(|e| format!("Failed to read queue item: {}", e))?
        .ok_or_else(|| format!("Queue item not found: {}", item_id))?;

    brain::update_queue_item_status(
        &mut item,
        &new_status,
        &by,
        note.as_deref(),
        event.as_deref(),
        detail.as_deref(),
    )
    .map_err(|e| format!("Failed to update queue item: {}", e))?;

    brain::write_queue_item(&item)
        .map_err(|e| format!("Failed to write queue item: {}", e))?;

    if new_status == "landing" {
        landing::apply_landing_policy(&app, &item)?;
        return brain::read_queue_item(&item_id)
            .map_err(|e| format!("Failed to read queue item after landing policy: {}", e))?
            .ok_or_else(|| format!("Queue item not found after landing policy: {}", item_id));
    }

    Ok(item)
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct LockResult {
    success: bool,
    message: String,
}

#[tauri::command]
fn acquire_brain_lock(
    lock_id: String,
    lock_type: String,
    holder: String,
) -> Result<LockResult, String> {
    let lock = lock::BrainLock {
        id: lock_id.clone(),
        lock_type,
        holder,
        held_since: atomic::utc_now_iso(),
        expires_at: None,
        metadata: serde_json::Value::Object(serde_json::Map::new()),
    };

    let root = state::locks_dir();
    lock::acquire_lock(&root, &lock)
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    Ok(LockResult {
        success: true,
        message: format!("Lock acquired: {}", lock_id),
    })
}

#[tauri::command]
fn release_brain_lock(lock_id: String) -> Result<LockResult, String> {
    let root = state::locks_dir();
    lock::release_lock(&root, &lock_id)
        .map_err(|e| format!("Failed to release lock: {}", e))?;

    Ok(LockResult {
        success: true,
        message: format!("Lock released: {}", lock_id),
    })
}

#[tauri::command]
fn check_brain_lock(lock_id: String) -> Result<bool, String> {
    Ok(lock::is_locked(&lock_id))
}

#[tauri::command]
fn start_automation(app: AppHandle) -> Result<String, String> {
    let result = scheduler::SCHEDULER.start();
    match result {
        Ok(message) => {
            ensure_automation_loop(app);
            Ok(message)
        }
        Err(e) if e == "Scheduler is already running" => {
            ensure_automation_loop(app);
            Ok("already running".to_string())
        }
        Err(e) => Err(e),
    }
}

#[tauri::command]
fn pause_automation() -> Result<String, String> {
    scheduler::SCHEDULER.pause()
}

#[tauri::command]
fn stop_automation() -> Result<String, String> {
    scheduler::SCHEDULER.stop()
}

#[tauri::command]
fn get_scheduler_status() -> Result<scheduler::SchedulerStatus, String> {
    scheduler::SCHEDULER.status()
}

fn ensure_automation_loop(app: AppHandle) {
    if AUTOMATION_LOOP_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }

    std::thread::spawn(move || {
        scheduler::log_decision("AUTOMATION LOOP: started");
        loop {
            let state = scheduler::SCHEDULER
                .get_state()
                .unwrap_or_else(|_| "error".to_string());

            if state == "stopped" || state == "error" {
                break;
            }

            if state == "running" {
                if let Err(e) = run_local_automation_triage(app.clone()) {
                    let _ = scheduler::SCHEDULER.record_skip(&format!(
                        "Automation triage loop error: {}",
                        e
                    ));
                }
            }

            std::thread::sleep(Duration::from_secs(scheduler::read_capacity_poll_interval_seconds()));
        }
        scheduler::log_decision("AUTOMATION LOOP: stopped");
        AUTOMATION_LOOP_RUNNING.store(false, Ordering::SeqCst);
    });
}

fn run_local_automation_triage(app: AppHandle) -> Result<String, String> {
    let review_result = match run_review_once(app.clone()) {
        Ok(detail) => detail,
        Err(e) => {
            let detail = format!("Review dispatch error: {}", e);
            let _ = scheduler::SCHEDULER.record_skip(&format!("Local triage {}", detail));
            detail
        }
    };

    let implementation_result = match run_implementation_once(app) {
        Ok(detail) => detail,
        Err(e) => {
            let detail = format!("Implementation dispatch error: {}", e);
            let _ = scheduler::SCHEDULER.record_skip(&format!("Local triage {}", detail));
            detail
        }
    };

    let summary = format!(
        "Local automation triage complete. Review: {}. Implementation: {}",
        review_result, implementation_result
    );
    scheduler::log_decision(&format!("TRIAGE: {}", summary));

    if review_result.contains("dispatch error") && implementation_result.contains("dispatch error") {
        Err(summary)
    } else {
        Ok(summary)
    }
}

fn enabled_project_paths() -> Result<HashSet<String>, String> {
    let projects = list_projects().unwrap_or_default();
    let enabled_paths = projects
        .iter()
        .filter(|project| project.enabled)
        .map(|project| project.path.clone())
        .collect::<HashSet<_>>();

    if enabled_paths.is_empty() {
        return Err("No enabled projects found.".to_string());
    }

    Ok(enabled_paths)
}

fn ensure_manual_item_project_enabled(
    item: &QueueItem,
    enabled_paths: &HashSet<String>,
) -> Result<(), String> {
    if enabled_paths.contains(&item.project_path) {
        return Ok(());
    }

    Err(format!(
        "Task {} is assigned to disabled or unregistered project {}.",
        item.id, item.project_path
    ))
}

fn run_single_implementation_item(
    app: AppHandle,
    item: &QueueItem,
    queue: &[QueueItem],
    settings: &Settings,
) -> Result<String, String> {
    if let Some(reason) = runner_disabled_waiting_reason(settings, item.agent.as_str()) {
        let _ = record_runner_disabled_wait(&item.id, &reason);
        scheduler::SCHEDULER.record_skip(&format!(
            "Manual start waiting {} ({}) - {}",
            item.id, item.status, reason
        ))?;
        return Err(reason);
    }

    if let Some((reason, blocked_by)) = dependency_waiting_reason(queue, item) {
        let _ = record_dependency_wait(&item.id, &reason, &blocked_by);
        scheduler::SCHEDULER.record_skip(&format!(
            "Manual start waiting {} ({}) - {}",
            item.id, item.status, reason
        ))?;
        return Err(reason);
    }

    let legacy_max = scheduler::read_max_running_processes();
    let active = MaxLoopRuntimeState::from_queue(queue);
    if let Some(reason) = max_loop_waiting_reason(settings, &active, item, legacy_max) {
        let _ = record_max_loop_wait(&item.id, &reason);
        scheduler::SCHEDULER.record_skip(&format!(
            "Manual start waiting {} ({}) - {}",
            item.id, item.status, reason
        ))?;
        return Err(reason);
    }

    let detail = launch_implementation_item(app, &item.id)?;
    scheduler::log_decision(&format!("MANUAL DISPATCH: {}", detail));
    Ok(format!(
        "Manual implementation start complete. {}",
        detail
    ))
}

fn run_single_review_item(app: AppHandle, item: &QueueItem) -> Result<String, String> {
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    if let Some(reason) = runner_disabled_waiting_reason(&settings, settings.default_review_runner.as_str()) {
        let _ = record_runner_disabled_wait(&item.id, &reason);
        scheduler::SCHEDULER.record_skip(&format!(
            "Manual review waiting {} ({}) - {}",
            item.id, item.status, reason
        ))?;
        return Err(reason);
    }

    let active_review = scheduler::count_active_review_processes();
    let max_review = scheduler::read_max_review_agents();
    if !scheduler::SCHEDULER.can_launch_work(active_review, max_review) {
        let reason = format!(
            "Waiting on review capacity: {} active review agents >= {}.",
            active_review, max_review
        );
        let _ = record_review_capacity_wait(&item.id, &reason);
        scheduler::SCHEDULER.record_skip(&format!(
            "Manual review waiting {} ({}) - {}",
            item.id, item.status, reason
        ))?;
        return Err(reason);
    }

    let detail = launch_review_item(app, &item.id)?;
    scheduler::log_decision(&format!("MANUAL REVIEW DISPATCH: {}", detail));
    Ok(format!("Manual review start complete. {}", detail))
}

#[tauri::command]
fn run_queue_item_once(app: AppHandle, queue_item_id: String) -> Result<String, String> {
    let reconciled = reconcile_stale_active_items()?;
    let queue = list_queue().map(|response| response.items).unwrap_or_default();
    let item = queue
        .iter()
        .find(|candidate| candidate.id == queue_item_id)
        .cloned()
        .ok_or_else(|| format!("Queue item not found: {}", queue_item_id))?;

    let enabled_paths = enabled_project_paths()?;
    ensure_manual_item_project_enabled(&item, &enabled_paths)?;

    let settings = read_settings_file().unwrap_or_else(|_| default_settings());
    let result = match item.status.as_str() {
        "queued" | "reviewed-fix-request" => {
            run_single_implementation_item(app, &item, &queue, &settings)
        }
        "submitted" => run_single_review_item(app, &item),
        "picked" | "started" | "reviewing" => Err(format!(
            "Task {} is already active with status {}.",
            item.id, item.status
        )),
        "landing" => Err(format!(
            "Task {} is waiting on landing or approval and cannot be manually started.",
            item.id
        )),
        "approved" => Err(format!(
            "Task {} is already approved and cannot be manually started.",
            item.id
        )),
        "blocked" | "stale-started" => Err(format!(
            "Task {} has status {}. Move it back to queued or submitted before starting.",
            item.id, item.status
        )),
        other => Err(format!(
            "Task {} has unsupported status {} for manual start.",
            item.id, other
        )),
    }?;

    scheduler::SCHEDULER.record_tick(&format!(
        "Manual queue item start: {}. Reconciled stale items: {}.",
        result, reconciled
    ))?;
    Ok(result)
}

#[tauri::command]
fn run_implementation_once(app: AppHandle) -> Result<String, String> {
    let state = scheduler::SCHEDULER.get_state()?;
    if state == "stopped" {
        return Err("Scheduler is stopped. Start automation first.".to_string());
    }
    if state == "paused" {
        return Err("Scheduler is paused. Resume automation to run ticks.".to_string());
    }

    let reconciled = reconcile_stale_active_items()?;
    let legacy_max = scheduler::read_max_running_processes();
    let settings = read_settings_file().unwrap_or_else(|_| default_settings());

    let projects = list_projects().unwrap_or_default();
    let enabled_paths: std::collections::HashSet<String> = projects
        .iter()
        .filter(|p| p.enabled)
        .map(|p| p.path.clone())
        .collect();

    if enabled_paths.is_empty() {
        let msg = "No enabled projects found";
        scheduler::SCHEDULER.record_skip(msg)?;
        return Ok(format!("Skipped: {}", msg));
    }

    let queue = list_queue().map(|response| response.items).unwrap_or_default();
    let mut max_loop_state = MaxLoopRuntimeState::from_queue(&queue);
    let active_before_tick = max_loop_state.total_active;
    let max = max_loop_global_cap(&settings, legacy_max);
    let mut eligible = queue.iter().filter(|item| {
        item.status == "queued" || item.status == "reviewed-fix-request"
    }).collect::<Vec<_>>();
    eligible.sort_by(|left, right| {
        implementation_candidate_order(&settings.scheduling_policy, left, right)
    });

    let skipped_disabled = eligible.iter().filter(|item| {
        !enabled_paths.contains(&item.project_path)
    }).count();

    let eligible_enabled = eligible.len() - skipped_disabled;
    let open_slots = max.saturating_sub(active_before_tick);
    let mut launched = 0usize;
    let mut launch_errors = 0usize;
    let mut policy_waiting = 0usize;
    let mut dependency_waiting = 0usize;
    let mut runner_waiting = 0usize;

    for item in eligible
        .iter()
        .filter(|item| enabled_paths.contains(&item.project_path))
    {
        if let Some(reason) = runner_disabled_waiting_reason(&settings, item.agent.as_str()) {
            runner_waiting += 1;
            let _ = record_runner_disabled_wait(&item.id, &reason);
            scheduler::SCHEDULER.record_skip(&format!("Waiting {} ({}) — {}", item.id, item.status, reason))?;
            continue;
        }

        if let Some((reason, blocked_by)) = dependency_waiting_reason(&queue, item) {
            dependency_waiting += 1;
            let _ = record_dependency_wait(&item.id, &reason, &blocked_by);
            scheduler::SCHEDULER.record_skip(&format!("Waiting {} ({}) — {}", item.id, item.status, reason))?;
            continue;
        }

        if let Some(reason) = max_loop_waiting_reason(&settings, &max_loop_state, item, legacy_max) {
            policy_waiting += 1;
            let _ = record_max_loop_wait(&item.id, &reason);
            scheduler::SCHEDULER.record_skip(&format!("Waiting {} ({}) — {}", item.id, item.status, reason))?;
            continue;
        }

        match launch_implementation_item(app.clone(), &item.id) {
            Ok(detail) => {
                launched += 1;
                max_loop_state.note_active(&item.project_id, &item.agent);
                scheduler::log_decision(&format!("DISPATCH: {}", detail));
            }
            Err(e) => {
                launch_errors += 1;
                scheduler::SCHEDULER.record_skip(&format!(
                    "Unable to launch implementation for {}: {}",
                    item.id, e
                ))?;
            }
        }
    }

    if skipped_disabled > 0 {
        for item in eligible.iter().filter(|item| !enabled_paths.contains(&item.project_path)) {
            let skip_msg = format!(
                "Skipped {} ({}) — project {} is disabled",
                item.id, item.status, item.project_path
            );
            scheduler::SCHEDULER.record_skip(&skip_msg)?;
        }
    }

    let msg = format!(
        "Implementation tick fired. Reconciled stale items: {}. Scheduling policy: {}. Active before tick: {}/{}. Enabled projects: {}. Eligible items: {} ({} skipped — disabled projects). Open global slots: {}. Launched: {}. Runner waiting: {}. Dependency waiting: {}. MaxLoop waiting: {}. Launch errors: {}",
        reconciled, settings.scheduling_policy, active_before_tick, max, enabled_paths.len(), eligible_enabled, skipped_disabled, open_slots, launched, runner_waiting, dependency_waiting, policy_waiting, launch_errors
    );
    scheduler::SCHEDULER.record_tick(&msg)?;
    Ok(msg)
}

#[tauri::command]
fn run_review_once(app: AppHandle) -> Result<String, String> {
    let state = scheduler::SCHEDULER.get_state()?;
    if state == "stopped" {
        return Err("Scheduler is stopped. Start automation first.".to_string());
    }
    if state == "paused" {
        return Err("Scheduler is paused. Resume automation to run ticks.".to_string());
    }

    let reconciled = reconcile_stale_active_items()?;
    let active_review = scheduler::count_active_review_processes();
    let max_review = scheduler::read_max_review_agents();
    let projects = list_projects().unwrap_or_default();
    let enabled_paths: std::collections::HashSet<String> = projects
        .iter()
        .filter(|p| p.enabled)
        .map(|p| p.path.clone())
        .collect();

    let queue = list_queue().map(|response| response.items).unwrap_or_default();
    let eligible = queue.iter().filter(|item| {
        item.status == "submitted"
    }).collect::<Vec<_>>();

    let skipped_disabled = eligible.iter().filter(|item| {
        !enabled_paths.contains(&item.project_path)
    }).count();
    let eligible_enabled = eligible.len() - skipped_disabled;

    if !scheduler::SCHEDULER.can_launch_work(active_review, max_review) {
        let msg = format!("max_review_agents reached ({} >= {})", active_review, max_review);
        scheduler::SCHEDULER.record_skip(&msg)?;
        let reason = format!(
            "Waiting on review capacity: {} active review agents >= {}.",
            active_review, max_review
        );
        for item in eligible.iter().filter(|item| enabled_paths.contains(&item.project_path)) {
            if let Err(e) = record_review_capacity_wait(&item.id, &reason) {
                scheduler::SCHEDULER.record_skip(&format!(
                    "Unable to persist review capacity wait for {}: {}",
                    item.id, e
                ))?;
            }
        }
        return Ok(format!("Skipped: {}", msg));
    }

    if eligible.is_empty() {
        let msg = "Review tick fired — no submitted items";
        scheduler::SCHEDULER.record_tick(msg)?;
        return Ok(msg.to_string());
    }

    if skipped_disabled > 0 {
        for item in eligible.iter().filter(|item| !enabled_paths.contains(&item.project_path)) {
            let skip_msg = format!(
                "Skipped {} ({}) — project {} is disabled",
                item.id, item.status, item.project_path
            );
            scheduler::SCHEDULER.record_skip(&skip_msg)?;
        }
    }

    let open_slots = max_review.saturating_sub(active_review);
    let mut launched = 0usize;
    let mut launch_errors = 0usize;

    for item in eligible
        .iter()
        .filter(|item| enabled_paths.contains(&item.project_path))
        .take(open_slots)
    {
        match launch_review_item(app.clone(), &item.id) {
            Ok(detail) => {
                launched += 1;
                scheduler::log_decision(&format!("REVIEW DISPATCH: {}", detail));
            }
            Err(e) => {
                launch_errors += 1;
                scheduler::SCHEDULER.record_skip(&format!(
                    "Unable to launch review for {}: {}",
                    item.id, e
                ))?;
            }
        }
    }

    if eligible_enabled > open_slots {
        for item in eligible
            .iter()
            .filter(|item| enabled_paths.contains(&item.project_path))
            .skip(open_slots)
        {
            let reason = format!(
                "Waiting on review capacity: {} active review agents + {} launched >= {}.",
                active_review, launched, max_review
            );
            if let Err(e) = record_review_capacity_wait(&item.id, &reason) {
                scheduler::SCHEDULER.record_skip(&format!(
                    "Unable to persist review capacity wait for {}: {}",
                    item.id, e
                ))?;
            }
            scheduler::SCHEDULER.record_skip(&format!(
                "Waiting {} ({}) — review capacity is full",
                item.id, item.status
            ))?;
        }
    }

    let msg = format!(
        "Review tick fired. Reconciled stale items: {}. Active before tick: {}/{}. Eligible items: {} ({} skipped — disabled projects). Open slots: {}. Launched: {}. Launch errors: {}",
        reconciled, active_review, max_review, eligible_enabled, skipped_disabled, open_slots, launched, launch_errors
    );
    scheduler::SCHEDULER.record_tick(&msg)?;
    Ok(msg)
}

#[tauri::command]
fn get_launchagent_info() -> launchagent::LaunchAgentInfo {
    launchagent::info()
}

#[tauri::command]
fn install_launchagent() -> Result<String, String> {
    launchagent::install_plist().map_err(|e| e.to_string())
}

#[tauri::command]
fn load_launchagent() -> Result<String, String> {
    launchagent::load_agent().map_err(|e| e.to_string())
}

#[tauri::command]
fn unload_launchagent() -> Result<String, String> {
    launchagent::unload_agent().map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_launchagent() -> Result<String, String> {
    launchagent::remove_plist().map_err(|e| e.to_string())
}

fn show_main_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_brain_status,
            get_settings,
            update_settings,
            inspect_project_folder,
            list_projects,
            create_project,
            update_project,
            set_project_enabled,
            list_queue,
            list_agent_threads,
            list_archived_agent_threads,
            archive_agent_thread,
            list_orchestrations,
            create_orchestration,
            append_orchestration_message,
            run_orchestration_turn,
            update_orchestration_project,
            handoff_orchestration,
            harness::list_harness_capabilities,
            harness::start_harness_session,
            harness::send_harness_message,
            harness::stop_harness_session,
            harness::record_harness_event,
            harness::replay_harness_events,
            direct_model::list_direct_model_runtime_contract,
            direct_model::preview_direct_model_provider_request,
            direct_model::preview_direct_model_stream_events,
            direct_model::preview_direct_model_harness_events,
            direct_model::record_direct_model_harness_events,
            direct_model::execute_direct_model_turn,
            direct_model::execute_direct_model_tool_loop,
            direct_model::execute_direct_model_tool,
            direct_model::request_direct_model_tool_approval,
            execute_approved_direct_model_tool,
            list_recent_logs,
            update_queue_item_status,
            acquire_brain_lock,
            release_brain_lock,
            check_brain_lock,
            start_automation,
            pause_automation,
            stop_automation,
            get_scheduler_status,
            run_queue_item_once,
            run_implementation_once,
            run_review_once,
            approval::list_approval_requests,
            approval::request_approval,
            approval::approve_request,
            approval::deny_request,
            approval::expire_request,
            get_launchagent_info,
            install_launchagent,
            load_launchagent,
            unload_launchagent,
            remove_launchagent,
            runner::run_process,
            runner::read_log_file,
            pty::spawn_pty,
            pty::write_pty,
            pty::resize_pty,
            pty::close_pty
        ])
        .manage(harness::HarnessRuntimeState::default())
        .manage(pty::PtyState::new())
        .manage(approval::ApprovalState::new())
        .setup(|app| {
            if let Err(error) = state::ensure_state_root() {
                eprintln!("Failed to prepare Brain Loop state root: {}", error);
            }

            let open_item = MenuItem::with_id(app, "open", "Open Brain Loop", true, None::<&str>)?;
            let run_once_item = MenuItem::with_id(app, "run_once", "Run Once", true, None::<&str>)?;
            let pause_item = MenuItem::with_id(app, "pause", "Pause Automation", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&open_item, &run_once_item, &pause_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "open" => {
                            if let Some(window) = app.get_webview_window("main") {
                                show_main_window(&window);
                            }
                        }
                        "run_once" => {
                            let _ = start_automation(app.clone());
                            let _ = run_local_automation_triage(app.clone());
                        }
                        "pause" => {
                            let _ = scheduler::SCHEDULER.pause();
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            show_main_window(&window);
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Brain Loop app")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
        });
}
