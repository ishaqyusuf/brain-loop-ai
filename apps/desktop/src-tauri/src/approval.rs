use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalHistoryEntry {
    pub at: String,
    pub by: String,
    pub event: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRequest {
    pub id: String,
    pub kind: String,
    pub status: String,
    pub title: String,
    pub description: String,
    pub risk: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub queue_item_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runner_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, String>,
    pub requested_by: String,
    pub requested_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    pub history: Vec<ApprovalHistoryEntry>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRequestInput {
    pub kind: String,
    pub title: String,
    pub description: String,
    pub risk: String,
    pub command: Option<String>,
    pub path: Option<String>,
    pub queue_item_id: Option<String>,
    pub project_id: Option<String>,
    pub runner_id: Option<String>,
    pub session_id: Option<String>,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
    pub requested_by: Option<String>,
}

pub struct ApprovalState {
    requests: Mutex<Vec<ApprovalRequest>>,
}

impl ApprovalState {
    pub fn new() -> Self {
        Self {
            requests: Mutex::new(load_requests().unwrap_or_default()),
        }
    }
}

fn load_requests() -> Result<Vec<ApprovalRequest>, String> {
    crate::state::ensure_state_root()
        .map_err(|e| format!("Failed to prepare state root for approvals: {}", e))?;
    let path = crate::state::approvals_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read approvals file: {}", e))?;
    serde_json::from_str::<Vec<ApprovalRequest>>(&content)
        .map_err(|e| format!("Failed to parse approvals file: {}", e))
}

fn write_requests(requests: &[ApprovalRequest]) -> Result<(), String> {
    crate::state::ensure_state_root()
        .map_err(|e| format!("Failed to prepare state root for approvals: {}", e))?;
    crate::atomic::atomic_write_json(&crate::state::approvals_path(), &requests)
        .map_err(|e| format!("Failed to write approvals file: {}", e))
}

fn now_iso() -> String {
    crate::atomic::utc_now_iso()
}

fn make_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("approval-{}", nanos)
}

fn validate_kind(kind: &str) -> Result<(), String> {
    if matches!(kind, "command" | "permission" | "destructive") {
        Ok(())
    } else {
        Err("Approval kind must be command, permission, or destructive.".to_string())
    }
}

fn approval_summary_for_queue(
    requests: &[ApprovalRequest],
    queue_item_id: &str,
) -> (Vec<String>, usize) {
    let mut ids = Vec::new();
    let mut pending = 0usize;

    for request in requests
        .iter()
        .filter(|request| request.queue_item_id.as_deref() == Some(queue_item_id))
    {
        ids.push(request.id.clone());
        if request.status == "pending" {
            pending += 1;
        }
    }

    (ids, pending)
}

fn sync_queue_thread_approval_metadata(
    requests: &[ApprovalRequest],
    queue_item_id: Option<&str>,
) {
    let Some(queue_item_id) = queue_item_id else {
        return;
    };
    let (ids, pending) = approval_summary_for_queue(requests, queue_item_id);
    let _ = crate::agent_thread::upsert_approval_metadata(queue_item_id, ids, pending);
}

fn sync_all_queue_thread_approval_metadata(requests: &[ApprovalRequest]) {
    let mut queue_ids = Vec::<String>::new();
    for request in requests {
        let Some(queue_item_id) = request.queue_item_id.as_ref() else {
            continue;
        };
        if !queue_ids.iter().any(|existing| existing == queue_item_id) {
            queue_ids.push(queue_item_id.clone());
        }
    }

    for queue_item_id in queue_ids {
        sync_queue_thread_approval_metadata(requests, Some(&queue_item_id));
    }
}

#[tauri::command]
pub fn list_approval_requests(
    state: State<'_, ApprovalState>,
) -> Result<Vec<ApprovalRequest>, String> {
    let mut requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?
        .clone();
    sync_all_queue_thread_approval_metadata(&requests);
    requests.sort_by(|a, b| b.requested_at.cmp(&a.requested_at));
    Ok(requests)
}

#[tauri::command]
pub fn request_approval(
    app: AppHandle,
    state: State<'_, ApprovalState>,
    input: ApprovalRequestInput,
) -> Result<ApprovalRequest, String> {
    validate_kind(&input.kind)?;
    if input.title.trim().is_empty() {
        return Err("Approval title is required.".to_string());
    }
    if input.description.trim().is_empty() {
        return Err("Approval description is required.".to_string());
    }

    let now = now_iso();
    let requested_by = input.requested_by.unwrap_or_else(|| "brain-loop".to_string());
    let request = ApprovalRequest {
        id: make_id(),
        kind: input.kind,
        status: "pending".to_string(),
        title: input.title,
        description: input.description,
        risk: input.risk,
        command: input.command,
        path: input.path,
        queue_item_id: input.queue_item_id,
        project_id: input.project_id,
        runner_id: input.runner_id,
        session_id: input.session_id,
        metadata: input.metadata,
        requested_by: requested_by.clone(),
        requested_at: now.clone(),
        resolved_by: None,
        resolved_at: None,
        history: vec![ApprovalHistoryEntry {
            at: now,
            by: requested_by,
            event: "requested".to_string(),
            note: None,
        }],
    };

    let mut requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?;
    let mut next_requests = requests.clone();
    next_requests.push(request.clone());
    write_requests(&next_requests)?;
    *requests = next_requests;
    sync_queue_thread_approval_metadata(requests.as_slice(), request.queue_item_id.as_deref());
    drop(requests);

    let _ = app.emit("approval-requested", &request);
    Ok(request)
}

pub fn request_merge_approval(
    app: &AppHandle,
    item: &crate::brain::QueueItem,
) -> Result<ApprovalRequest, String> {
    let state = app.state::<ApprovalState>();
    let mut requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?;

    if let Some(existing) = requests.iter().find(|request| {
        request.status == "pending"
            && request.queue_item_id.as_deref() == Some(item.id.as_str())
            && request.command.as_deref() == Some("brain-loop:land-approved-work")
    }) {
        return Ok(existing.clone());
    }

    let now = now_iso();
    let title = format!("Merge approved work for {}", item.id);
    let description = format!(
        "Review passed for {}. Approve this request to land the reviewed work into the registered project checkout.",
        item.task_name.as_deref().unwrap_or(item.id.as_str())
    );
    let request = ApprovalRequest {
        id: make_id(),
        kind: "destructive".to_string(),
        status: "pending".to_string(),
        title,
        description,
        risk: "Landing can commit local checkout changes, merge a task worktree, and update queue approval state.".to_string(),
        command: Some("brain-loop:land-approved-work".to_string()),
        path: Some(item.project_path.clone()),
        queue_item_id: Some(item.id.clone()),
        project_id: Some(item.project_id.clone()),
        runner_id: item.review_runner_id.clone().or_else(|| item.runner_id.clone()),
        session_id: item.session_id.clone(),
        metadata: BTreeMap::new(),
        requested_by: "brain-loop".to_string(),
        requested_at: now.clone(),
        resolved_by: None,
        resolved_at: None,
        history: vec![ApprovalHistoryEntry {
            at: now,
            by: "brain-loop".to_string(),
            event: "requested".to_string(),
            note: Some("Review passed; project requires merge approval before landing.".to_string()),
        }],
    };

    let mut next_requests = requests.clone();
    next_requests.push(request.clone());
    write_requests(&next_requests)?;
    *requests = next_requests;
    sync_queue_thread_approval_metadata(requests.as_slice(), request.queue_item_id.as_deref());
    drop(requests);

    let _ = app.emit("approval-requested", &request);
    Ok(request)
}

pub fn get_request(
    state: State<'_, ApprovalState>,
    request_id: &str,
) -> Result<ApprovalRequest, String> {
    let requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?;
    requests
        .iter()
        .find(|request| request.id == request_id)
        .cloned()
        .ok_or_else(|| format!("Approval request not found: {}", request_id))
}

#[tauri::command]
pub fn approve_request(
    app: AppHandle,
    state: State<'_, ApprovalState>,
    request_id: String,
    by: String,
) -> Result<ApprovalRequest, String> {
    resolve_request(app, state, request_id, by, "approved", None)
}

#[tauri::command]
pub fn deny_request(
    app: AppHandle,
    state: State<'_, ApprovalState>,
    request_id: String,
    by: String,
    reason: Option<String>,
) -> Result<ApprovalRequest, String> {
    resolve_request(app, state, request_id, by, "denied", reason)
}

#[tauri::command]
pub fn expire_request(
    app: AppHandle,
    state: State<'_, ApprovalState>,
    request_id: String,
    by: String,
    reason: Option<String>,
) -> Result<ApprovalRequest, String> {
    resolve_request(app, state, request_id, by, "expired", reason)
}

fn resolve_request(
    app: AppHandle,
    state: State<'_, ApprovalState>,
    request_id: String,
    by: String,
    status: &str,
    reason: Option<String>,
) -> Result<ApprovalRequest, String> {
    let mut requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?;
    let mut next_requests = requests.clone();
    let request_index = next_requests
        .iter()
        .position(|request| request.id == request_id)
        .ok_or_else(|| format!("Approval request not found: {}", request_id))?;

    if next_requests[request_index].status != "pending" {
        return Err(format!("Approval request is already {}.", next_requests[request_index].status));
    }

    let now = now_iso();
    next_requests[request_index].status = status.to_string();
    next_requests[request_index].resolved_by = Some(by.clone());
    next_requests[request_index].resolved_at = Some(now.clone());
    next_requests[request_index].history.push(ApprovalHistoryEntry {
        at: now.clone(),
        by: by.clone(),
        event: status.to_string(),
        note: reason.clone(),
    });

    let resolved = next_requests[request_index].clone();
    write_requests(&next_requests)?;
    *requests = next_requests;
    sync_queue_thread_approval_metadata(requests.as_slice(), resolved.queue_item_id.as_deref());
    drop(requests);

    if status == "denied" || status == "expired" {
        if let Some(queue_item_id) = resolved.queue_item_id.as_deref() {
            if let Ok(Some(mut item)) = crate::brain::read_queue_item(queue_item_id) {
                let _ = crate::brain::update_queue_item_status(
                    &mut item,
                    "blocked",
                    &by,
                    Some("Blocked because an approval request was denied or expired."),
                    Some(if status == "denied" { "approval_denied" } else { "approval_expired" }),
                    Some(&resolved.id),
                );
                let _ = crate::brain::write_queue_item(&item);
                if let Ok(value) = serde_json::to_value(&item) {
                    let _ = crate::agent_thread::upsert_from_queue_value(&value);
                }
            }
        }
    }

    let event = match status {
        "approved" => "approval-approved",
        "denied" => "approval-denied",
        "expired" => "approval-expired",
        _ => "approval-resolved",
    };
    let _ = app.emit(event, &resolved);
    let _ = app.emit("approval-resolved", &resolved);

    if status == "approved"
        && resolved.command.as_deref() == Some("brain-loop:land-approved-work")
    {
        if let Some(queue_item_id) = resolved.queue_item_id.as_deref() {
            crate::landing::land_queue_item_by_id(queue_item_id, "desktop-user")
                .map_err(|e| format!("Approval was recorded, but landing failed: {}", e))?;
        }
    }

    Ok(resolved)
}
