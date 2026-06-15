use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};

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
    pub requested_by: Option<String>,
}

pub struct ApprovalState {
    requests: Mutex<Vec<ApprovalRequest>>,
}

impl ApprovalState {
    pub fn new() -> Self {
        Self {
            requests: Mutex::new(Vec::new()),
        }
    }
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

#[tauri::command]
pub fn list_approval_requests(
    state: State<'_, ApprovalState>,
) -> Result<Vec<ApprovalRequest>, String> {
    let mut requests = state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?
        .clone();
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

    state
        .requests
        .lock()
        .map_err(|_| "Approval state lock poisoned.".to_string())?
        .push(request.clone());
    let _ = app.emit("approval-requested", &request);
    Ok(request)
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
    let request = requests
        .iter_mut()
        .find(|request| request.id == request_id)
        .ok_or_else(|| format!("Approval request not found: {}", request_id))?;

    if request.status != "pending" {
        return Err(format!("Approval request is already {}.", request.status));
    }

    let now = now_iso();
    request.status = status.to_string();
    request.resolved_by = Some(by.clone());
    request.resolved_at = Some(now.clone());
    request.history.push(ApprovalHistoryEntry {
        at: now.clone(),
        by: by.clone(),
        event: status.to_string(),
        note: reason.clone(),
    });

    let resolved = request.clone();
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
    Ok(resolved)
}
