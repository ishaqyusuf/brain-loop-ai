use serde::{Deserialize, Serialize};
use std::io;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueHistoryEntry {
    pub at: String,
    pub by: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub review_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_handoff_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub handoff_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: String,
    #[serde(
        rename = "threadTitle",
        alias = "threadName",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub thread_title: Option<String>,
    #[serde(rename = "taskName", default, skip_serializing_if = "Option::is_none")]
    pub task_name: Option<String>,
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "projectPath")]
    pub project_path: String,
    #[serde(rename = "worktreePath", default, skip_serializing_if = "Option::is_none")]
    pub worktree_path: Option<String>,
    #[serde(rename = "executionPath", default, skip_serializing_if = "Option::is_none")]
    pub execution_path: Option<String>,
    #[serde(rename = "executionStrategy", default, skip_serializing_if = "Option::is_none")]
    pub execution_strategy: Option<String>,
    #[serde(rename = "planPath")]
    pub plan_path: String,
    #[serde(rename = "handoffPath")]
    pub handoff_path: String,
    #[serde(rename = "activeHandoffPath")]
    pub active_handoff_path: String,
    #[serde(rename = "reviewPath", default, skip_serializing_if = "Option::is_none")]
    pub review_path: Option<String>,
    pub status: String,
    pub agent: String,
    #[serde(rename = "recommendedAgent")]
    pub recommended_agent: String,
    #[serde(rename = "recommendationReason")]
    pub recommendation_reason: String,
    #[serde(rename = "recommendedModel", default, skip_serializing_if = "Option::is_none")]
    pub recommended_model: Option<String>,
    #[serde(rename = "modelRecommendationReason", default, skip_serializing_if = "Option::is_none")]
    pub model_recommendation_reason: Option<String>,
    pub priority: String,
    pub attempt: u32,
    #[serde(rename = "createdBy")]
    pub created_by: String,
    #[serde(rename = "pickedBy", default, skip_serializing_if = "Option::is_none")]
    pub picked_by: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "pickedAt", default, skip_serializing_if = "Option::is_none")]
    pub picked_at: Option<String>,
    #[serde(rename = "agentStartedAt", default, skip_serializing_if = "Option::is_none")]
    pub agent_started_at: Option<String>,
    #[serde(rename = "startedBy", default, skip_serializing_if = "Option::is_none")]
    pub started_by: Option<String>,
    #[serde(rename = "runnerId", default, skip_serializing_if = "Option::is_none")]
    pub runner_id: Option<String>,
    #[serde(rename = "reviewRunnerId", default, skip_serializing_if = "Option::is_none")]
    pub review_runner_id: Option<String>,
    #[serde(rename = "sessionId", default, skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(rename = "submittedAt", default, skip_serializing_if = "Option::is_none")]
    pub submitted_at: Option<String>,
    #[serde(rename = "blockedAt", default, skip_serializing_if = "Option::is_none")]
    pub blocked_at: Option<String>,
    #[serde(rename = "reviewedAt", default, skip_serializing_if = "Option::is_none")]
    pub reviewed_at: Option<String>,
    #[serde(rename = "approvedAt", default, skip_serializing_if = "Option::is_none")]
    pub approved_at: Option<String>,
    #[serde(rename = "landingStatus", default, skip_serializing_if = "Option::is_none")]
    pub landing_status: Option<String>,
    #[serde(rename = "landingBranch", default, skip_serializing_if = "Option::is_none")]
    pub landing_branch: Option<String>,
    #[serde(rename = "landedAt", default, skip_serializing_if = "Option::is_none")]
    pub landed_at: Option<String>,
    #[serde(rename = "landedBy", default, skip_serializing_if = "Option::is_none")]
    pub landed_by: Option<String>,
    #[serde(rename = "landedCommit", default, skip_serializing_if = "Option::is_none")]
    pub landed_commit: Option<String>,
    #[serde(rename = "landingError", default, skip_serializing_if = "Option::is_none")]
    pub landing_error: Option<String>,
    #[serde(rename = "preLandingStatus", default, skip_serializing_if = "Option::is_none")]
    pub pre_landing_status: Option<String>,
    #[serde(rename = "preLandingCommit", default, skip_serializing_if = "Option::is_none")]
    pub pre_landing_commit: Option<String>,
    #[serde(rename = "preLandingCommittedAt", default, skip_serializing_if = "Option::is_none")]
    pub pre_landing_committed_at: Option<String>,
    #[serde(rename = "preLandingCommitMessage", default, skip_serializing_if = "Option::is_none")]
    pub pre_landing_commit_message: Option<String>,
    #[serde(rename = "lastError", default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    #[serde(rename = "waitingReason", default, skip_serializing_if = "Option::is_none")]
    pub waiting_reason: Option<String>,
    #[serde(rename = "dependsOn", default, skip_serializing_if = "Vec::is_empty")]
    pub depends_on: Vec<String>,
    #[serde(rename = "blockedBy", default, skip_serializing_if = "Vec::is_empty")]
    pub blocked_by: Vec<String>,
    #[serde(default)]
    pub history: Vec<QueueHistoryEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    #[serde(rename = "defaultReviewIntervalMinutes")]
    pub default_review_interval_minutes: u32,
    #[serde(rename = "defaultImplementationIntervalMinutes")]
    pub default_implementation_interval_minutes: u32,
    #[serde(rename = "maxRunningProcesses")]
    pub max_running_processes: u32,
    #[serde(rename = "maxImplementationAgents", default, skip_serializing_if = "Option::is_none")]
    pub max_implementation_agents: Option<u32>,
    #[serde(rename = "maxReviewAgents", default, skip_serializing_if = "Option::is_none")]
    pub max_review_agents: Option<u32>,
    #[serde(rename = "maxPickedMinutes")]
    pub max_picked_minutes: u32,
    #[serde(rename = "threadStorageRoot", default)]
    pub thread_storage_root: String,
    #[serde(rename = "worktreeStorageRoot", default)]
    pub worktree_storage_root: String,
    #[serde(rename = "executionStrategy", default)]
    pub execution_strategy: String,
    #[serde(rename = "implementationDispatcher")]
    pub implementation_dispatcher: ImplementationDispatcher,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImplementationDispatcher {
    #[serde(rename = "jobName")]
    pub job_name: String,
    #[serde(rename = "desiredStatus")]
    pub desired_status: String,
    #[serde(rename = "lastKnownStatus")]
    pub last_known_status: String,
    #[serde(rename = "lastCheckedAt")]
    pub last_checked_at: String,
    #[serde(rename = "lastUpdatedBy")]
    pub last_updated_by: String,
    #[serde(rename = "lastGatewayStatus")]
    pub last_gateway_status: String,
    #[serde(rename = "codexAutomationMode")]
    pub codex_automation_mode: String,
    #[serde(rename = "lastError", default, skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
}

pub fn read_queue_item(id: &str) -> io::Result<Option<QueueItem>> {
    let path = crate::state::queue_item_path(id);
    if !path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(&path)?;
    let item: QueueItem =
        serde_json::from_str(&content).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e.to_string()))?;
    Ok(Some(item))
}

pub fn write_queue_item(item: &QueueItem) -> io::Result<()> {
    let path = crate::state::queue_item_path(&item.id);
    crate::atomic::atomic_write_json(&path, item)
}

const VALID_STATUSES: &[&str] = &[
    "queued",
    "picked",
    "started",
    "stale-started",
    "submitted",
    "reviewing",
    "blocked",
    "reviewed-fix-request",
    "landing",
    "approved",
];

pub fn is_valid_status(status: &str) -> bool {
    VALID_STATUSES.contains(&status)
}

pub fn is_valid_transition(current: &str, next: &str) -> bool {
    match current {
        "queued" => matches!(next, "picked" | "blocked"),
        "picked" => matches!(next, "started" | "blocked" | "queued"),
        "started" => matches!(next, "stale-started" | "submitted" | "blocked"),
        "stale-started" => matches!(next, "queued" | "started" | "submitted" | "blocked"),
        "submitted" => matches!(next, "reviewing" | "reviewed-fix-request" | "landing" | "blocked"),
        "reviewing" => matches!(next, "reviewed-fix-request" | "landing" | "blocked"),
        "blocked" => matches!(next, "queued" | "picked" | "started"),
        "reviewed-fix-request" => matches!(next, "picked" | "started" | "blocked"),
        "landing" => matches!(next, "approved" | "blocked"),
        "approved" => false,
        _ => false,
    }
}

pub fn update_queue_item_status(
    item: &mut QueueItem,
    new_status: &str,
    by: &str,
    note: Option<&str>,
    event: Option<&str>,
    detail: Option<&str>,
) -> io::Result<()> {
    let current = item.status.as_str();

    if !is_valid_status(current) {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("Current status is not valid: {}", current),
        ));
    }

    if !is_valid_status(new_status) {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!(
                "Invalid queue status: \"{}\". Expected one of: {}",
                new_status,
                VALID_STATUSES.join(", ")
            ),
        ));
    }

    if !is_valid_transition(current, new_status) {
        let allowed: Vec<&str> = match current {
            "queued" => vec!["picked", "blocked"],
            "picked" => vec!["started", "blocked", "queued"],
            "started" => vec!["stale-started", "submitted", "blocked"],
            "stale-started" => vec!["queued", "started", "submitted", "blocked"],
            "submitted" => vec!["reviewing", "reviewed-fix-request", "landing", "blocked"],
            "reviewing" => vec!["reviewed-fix-request", "landing", "blocked"],
            "blocked" => vec!["queued", "picked", "started"],
            "reviewed-fix-request" => vec!["picked", "started", "blocked"],
            "landing" => vec!["approved", "blocked"],
            "approved" => vec![],
            _ => vec![],
        };
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!(
                "Invalid queue transition: \"{}\" -> \"{}\". Allowed transitions from \"{}\": {}",
                current,
                new_status,
                current,
                if allowed.is_empty() { "none".to_string() } else { allowed.join(", ") }
            ),
        ));
    }

    let now = crate::atomic::utc_now_iso();
    item.status = new_status.to_string();

    match new_status {
        "picked" => item.picked_at = Some(now.clone()),
        "started" | "reviewing" => item.agent_started_at = Some(now.clone()),
        "submitted" => item.submitted_at = Some(now.clone()),
        "reviewed-fix-request" | "landing" => item.reviewed_at = Some(now.clone()),
        "blocked" => item.blocked_at = Some(now.clone()),
        "approved" => item.approved_at = Some(now.clone()),
        _ => {}
    }

    let entry = QueueHistoryEntry {
        at: now,
        by: by.to_string(),
        status: None,
        note: note.map(String::from),
        event: event.map(String::from),
        detail: detail.map(String::from),
        review_path: None,
        active_handoff_path: None,
        handoff_path: None,
        agent: None,
    };
    item.history.push(entry);

    Ok(())
}
