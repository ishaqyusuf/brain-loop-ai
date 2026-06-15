mod state;
mod atomic;
mod lock;
mod brain;
mod scheduler;
mod launchagent;
mod runner;
mod pty;
mod approval;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WebviewWindow};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ImplementationDispatcher {
    job_name: String,
    desired_status: String,
    #[serde(default = "default_status")]
    last_known_status: String,
    last_checked_at: String,
    last_updated_by: String,
    last_gateway_status: String,
    codex_automation_mode: String,
    last_error: Option<String>,
}

fn default_status() -> String {
    "unknown".to_string()
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct Settings {
    default_review_interval_minutes: u32,
    default_implementation_interval_minutes: u32,
    max_running_processes: u32,
    max_picked_minutes: u32,
    implementation_dispatcher: ImplementationDispatcher,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct BrainProject {
    id: String,
    name: String,
    path: String,
    enabled: bool,
    default_agent: String,
    review_interval_minutes: u32,
    implementation_interval_minutes: u32,
    priority: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    path_exists: Option<bool>,
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
    project_id: String,
    project_path: String,
    worktree_path: Option<String>,
    execution_path: Option<String>,
    plan_path: String,
    handoff_path: String,
    active_handoff_path: String,
    review_path: Option<String>,
    status: String,
    agent: String,
    recommended_agent: String,
    recommendation_reason: String,
    priority: String,
    attempt: u32,
    created_by: String,
    picked_by: Option<String>,
    created_at: String,
    picked_at: Option<String>,
    agent_started_at: Option<String>,
    started_by: Option<String>,
    runner_id: Option<String>,
    session_id: Option<String>,
    submitted_at: Option<String>,
    blocked_at: Option<String>,
    reviewed_at: Option<String>,
    approved_at: Option<String>,
    last_error: Option<String>,
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

fn get_manager_root() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/M1PRO".to_string());
    PathBuf::from(home).join(".codex").join("brain-project-manager")
}

#[tauri::command]
fn get_brain_status() -> Result<BrainStatus, String> {
    let root = get_manager_root();
    
    let settings_path = root.join("settings.json");
    let (impl_status, rev_status) = if settings_path.exists() {
        if let Ok(content) = fs::read_to_string(&settings_path) {
            if let Ok(settings) = serde_json::from_str::<Settings>(&content) {
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
    }
    Ok(projects)
}

fn read_projects() -> Result<Vec<BrainProject>, String> {
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
    let mut clean_projects = projects.to_vec();
    for project in clean_projects.iter_mut() {
        project.path_exists = None;
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
    if project.review_interval_minutes == 0 || project.implementation_interval_minutes == 0 {
        return Err("Intervals must be greater than zero.".to_string());
    }
    Ok(())
}

#[tauri::command]
fn create_project(mut project: BrainProject) -> Result<BrainProject, String> {
    validate_project(&project)?;
    let mut projects = read_projects()?;

    if projects.iter().any(|existing| existing.id == project.id) {
        return Err(format!("Project already exists: {}", project.id));
    }

    project.path_exists = None;
    projects.push(project.clone());
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
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
    projects[index] = project.clone();
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
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
    projects[index] = project.clone();
    write_projects(&projects)?;

    project.path_exists = Some(std::path::Path::new(&project.path).exists());
    Ok(project)
}

#[tauri::command]
fn list_queue() -> Result<QueueListResponse, String> {
    let mut items = Vec::new();
    let mut errors = Vec::new();
    let handoffs_dir = get_manager_root().join("queues").join("handoffs");
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
                    Ok(item) => items.push(item),
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

#[tauri::command]
fn list_recent_logs() -> Result<Vec<LogSummary>, String> {
    let mut logs = Vec::new();
    let runs_dir = get_manager_root().join("logs").join("runs");
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
fn update_queue_item_status(
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
fn start_automation() -> Result<String, String> {
    scheduler::SCHEDULER.start()
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

#[tauri::command]
fn run_implementation_once() -> Result<String, String> {
    let state = scheduler::SCHEDULER.get_state()?;
    if state == "stopped" {
        return Err("Scheduler is stopped. Start automation first.".to_string());
    }
    if state == "paused" {
        return Err("Scheduler is paused. Resume automation to run ticks.".to_string());
    }

    let active = scheduler::count_active_processes();
    let max = scheduler::read_max_running_processes();

    if !scheduler::SCHEDULER.can_launch_work(active, max) {
        let msg = format!("max_running_processes reached ({} >= {})", active, max);
        scheduler::SCHEDULER.record_skip(&msg)?;
        return Ok(format!("Skipped: {}", msg));
    }

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
    let eligible = queue.iter().filter(|item| {
        item.status == "queued" || item.status == "reviewed-fix-request"
    }).collect::<Vec<_>>();

    let skipped_disabled = eligible.iter().filter(|item| {
        !enabled_paths.contains(&item.project_path)
    }).count();

    let eligible_enabled = eligible.len() - skipped_disabled;

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
        "Implementation tick fired. Active: {}/{}. Enabled projects: {}. Eligible items: {} ({} skipped — disabled projects)",
        active, max, enabled_paths.len(), eligible_enabled, skipped_disabled
    );
    scheduler::SCHEDULER.record_tick(&msg)?;
    Ok(msg)
}

#[tauri::command]
fn run_review_once() -> Result<String, String> {
    let state = scheduler::SCHEDULER.get_state()?;
    if state == "stopped" {
        return Err("Scheduler is stopped. Start automation first.".to_string());
    }
    if state == "paused" {
        return Err("Scheduler is paused. Resume automation to run ticks.".to_string());
    }

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

    let eligible_enabled = eligible.len() - skipped_disabled;
    let msg = format!(
        "Review tick fired. Eligible items: {} ({} skipped — disabled projects)",
        eligible_enabled, skipped_disabled
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
            list_projects,
            create_project,
            update_project,
            set_project_enabled,
            list_queue,
            list_recent_logs,
            update_queue_item_status,
            acquire_brain_lock,
            release_brain_lock,
            check_brain_lock,
            start_automation,
            pause_automation,
            stop_automation,
            get_scheduler_status,
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
        .manage(pty::PtyState::new())
        .manage(approval::ApprovalState::new())
        .setup(|app| {
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
                            let _ = scheduler::SCHEDULER.start();
                            let _ = run_implementation_once();
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
