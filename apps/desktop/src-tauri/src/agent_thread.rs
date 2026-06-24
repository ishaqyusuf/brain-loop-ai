use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AgentThreadMessage {
    pub id: String,
    pub role: String,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AgentThread {
    pub id: String,
    pub queue_item_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub orchestration_id: Option<String>,
    pub project_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_name: Option<String>,
    pub project_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_strategy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub handoff_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_handoff_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub review_path: Option<String>,
    pub title: String,
    pub status: String,
    pub implementation_status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub review_status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runner_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub review_runner_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_thread_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub review_log_file_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub waiting_reason: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub approval_request_ids: Vec<String>,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub pending_approval_count: usize,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub messages: Vec<AgentThreadMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub archived_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub archived_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub archive_reason: Option<String>,
}

pub fn list_agent_threads() -> Result<Vec<AgentThread>, String> {
    list_threads(false)
}

pub fn list_archived_agent_threads() -> Result<Vec<AgentThread>, String> {
    list_threads(true)
}

fn list_threads(archived: bool) -> Result<Vec<AgentThread>, String> {
    let dir = crate::state::agent_threads_dir();
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read agent threads directory: {}", e))?;
    let mut threads = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !path.extension().map_or(false, |ext| ext == "json") {
            continue;
        }

        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(thread) = serde_json::from_str::<AgentThread>(&content) {
                if thread.archived_at.is_some() == archived {
                    threads.push(thread);
                }
            }
        }
    }

    threads.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(threads)
}

pub fn archive_agent_thread(
    thread_id: &str,
    by: &str,
    reason: Option<&str>,
) -> Result<AgentThread, String> {
    let path = crate::state::agent_threads_dir().join(format!("{}.json", thread_id));
    let mut thread = read_existing_thread(&path)
        .ok_or_else(|| format!("Agent thread not found: {}", thread_id))?;
    if !is_archivable_status(&thread.status) {
        return Err(format!(
            "Agent thread {} cannot be archived while status is {}.",
            thread_id, thread.status
        ));
    }

    let now = crate::atomic::utc_now_iso();
    thread.archived_at = Some(now.clone());
    thread.archived_by = Some(if by.trim().is_empty() {
        "brain-loop".to_string()
    } else {
        by.trim().to_string()
    });
    thread.archive_reason = reason
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(String::from);
    thread.updated_at = now;
    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to archive agent thread: {}", e))?;

    Ok(thread)
}

pub fn upsert_from_queue_value(item: &Value) -> Result<AgentThread, String> {
    let queue_item_id = required_string(item, "id")?;
    let project_id = required_string(item, "projectId")?;
    let project_path = required_string(item, "projectPath")?;
    let implementation_status = required_string(item, "status")?;
    let id = thread_id_for_queue_item(&queue_item_id);
    let path = crate::state::agent_threads_dir().join(format!("{}.json", id));
    let existing = read_existing_thread(&path);
    let now = crate::atomic::utc_now_iso();
    let runner_id = optional_string(item, "runnerId");
    let review_runner_id = optional_string(item, "reviewRunnerId");
    let existing_message_source = existing
        .as_ref()
        .and_then(|thread| thread.message_source.clone())
        .unwrap_or_else(|| "brain-timeline".to_string());
    let existing_provider_session_id = existing
        .as_ref()
        .and_then(|thread| thread.provider_session_id.clone());
    let existing_provider_thread_id = existing
        .as_ref()
        .and_then(|thread| thread.provider_thread_id.clone());

    let existing_log_file_path = existing
        .as_ref()
        .and_then(|thread| {
            if thread.runner_id.as_deref() == runner_id.as_deref() {
                thread.log_file_path.clone()
            } else {
                None
            }
        });
    let existing_review_log_file_path = existing
        .as_ref()
        .and_then(|thread| {
            if thread.review_runner_id.as_deref() == review_runner_id.as_deref() {
                thread.review_log_file_path.clone()
            } else {
                None
            }
        });
    let approval_request_ids = existing
        .as_ref()
        .map(|thread| thread.approval_request_ids.clone())
        .unwrap_or_default();
    let pending_approval_count = existing
        .as_ref()
        .map(|thread| thread.pending_approval_count)
        .unwrap_or_default();
    let next_status = thread_status_for_queue_status(&implementation_status).to_string();
    let mut messages = existing
        .as_ref()
        .map(|thread| thread.messages.clone())
        .unwrap_or_default();
    let should_append_status_message = existing
        .as_ref()
        .map(|thread| thread.implementation_status != implementation_status)
        .unwrap_or(true)
        || messages.is_empty();
    if should_append_status_message {
        append_queue_state_message(
            &mut messages,
            item,
            &implementation_status,
            &next_status,
            &now,
        );
    }
    if let Some(waiting_reason) = optional_string(item, "waitingReason") {
        append_unique_message(
            &mut messages,
            "system",
            "waiting",
            "Waiting",
            &waiting_reason,
            &now,
            [("waitingReason", waiting_reason.as_str())],
        );
    }
    append_artifact_messages(&mut messages, item, &now);
    let should_preserve_archive = existing
        .as_ref()
        .and_then(|thread| thread.archived_at.as_ref())
        .is_some()
        && is_archivable_status(&next_status);

    let thread = AgentThread {
        id,
        queue_item_id: queue_item_id.clone(),
        orchestration_id: optional_string(item, "orchestrationId"),
        project_id,
        project_name: None,
        project_path,
        worktree_path: optional_string(item, "worktreePath"),
        execution_path: optional_string(item, "executionPath"),
        execution_strategy: optional_string(item, "executionStrategy"),
        plan_path: optional_string(item, "planPath"),
        handoff_path: optional_string(item, "handoffPath"),
        active_handoff_path: optional_string(item, "activeHandoffPath"),
        review_path: optional_string(item, "reviewPath"),
        title: title_for_queue_item(item, &queue_item_id),
        status: next_status,
        implementation_status: implementation_status.clone(),
        review_status: review_status_for_queue_status(&implementation_status).map(String::from),
        log_file_path: existing_log_file_path,
        review_log_file_path: existing_review_log_file_path,
        runner_id,
        review_runner_id,
        message_source: Some(existing_message_source),
        provider_session_id: existing_provider_session_id,
        provider_thread_id: existing_provider_thread_id,
        created_at: existing
            .as_ref()
            .map(|thread| thread.created_at.clone())
            .unwrap_or_else(|| optional_string(item, "createdAt").unwrap_or_else(|| now.clone())),
        updated_at: now,
        last_error: optional_string(item, "lastError"),
        waiting_reason: optional_string(item, "waitingReason"),
        approval_request_ids,
        pending_approval_count,
        messages,
        archived_at: if should_preserve_archive {
            existing.as_ref().and_then(|thread| thread.archived_at.clone())
        } else {
            None
        },
        archived_by: if should_preserve_archive {
            existing.as_ref().and_then(|thread| thread.archived_by.clone())
        } else {
            None
        },
        archive_reason: if should_preserve_archive {
            existing.as_ref().and_then(|thread| thread.archive_reason.clone())
        } else {
            None
        },
    };

    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to write agent thread: {}", e))?;

    Ok(thread)
}

pub fn upsert_run_log_path(
    queue_item_id: &str,
    run_id: &str,
    agent: Option<&str>,
    log_file_path: &str,
) -> Result<(), String> {
    let id = thread_id_for_queue_item(queue_item_id);
    let path = crate::state::agent_threads_dir().join(format!("{}.json", id));
    let mut thread = if let Some(thread) = read_existing_thread(&path) {
        thread
    } else if let Ok(Some(item)) = crate::brain::read_queue_item(queue_item_id) {
        let value = serde_json::to_value(item)
            .map_err(|e| format!("Failed to serialize queue item for thread update: {}", e))?;
        upsert_from_queue_value(&value)?
    } else {
        return Ok(());
    };

    if agent == Some("codex-review") || run_id.starts_with("review-") {
        thread.review_runner_id = Some(run_id.to_string());
        thread.review_log_file_path = Some(log_file_path.to_string());
        append_unique_message(
            &mut thread.messages,
            "agent",
            "review-transcript",
            "Review transcript linked",
            "A review run transcript is available for this thread.",
            &crate::atomic::utc_now_iso(),
            [("runnerId", run_id), ("logFilePath", log_file_path)],
        );
    } else {
        thread.runner_id = Some(run_id.to_string());
        thread.log_file_path = Some(log_file_path.to_string());
        append_unique_message(
            &mut thread.messages,
            "agent",
            "implementation-transcript",
            "Implementation transcript linked",
            "An implementation run transcript is available for this thread.",
            &crate::atomic::utc_now_iso(),
            [("runnerId", run_id), ("logFilePath", log_file_path)],
        );
    }

    thread.updated_at = crate::atomic::utc_now_iso();
    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to write agent thread log path: {}", e))?;

    Ok(())
}

pub fn upsert_approval_metadata(
    queue_item_id: &str,
    approval_request_ids: Vec<String>,
    pending_approval_count: usize,
) -> Result<(), String> {
    let id = thread_id_for_queue_item(queue_item_id);
    let path = crate::state::agent_threads_dir().join(format!("{}.json", id));
    let mut thread = if let Some(thread) = read_existing_thread(&path) {
        thread
    } else if let Ok(Some(item)) = crate::brain::read_queue_item(queue_item_id) {
        let value = serde_json::to_value(item)
            .map_err(|e| format!("Failed to serialize queue item for thread update: {}", e))?;
        upsert_from_queue_value(&value)?
    } else {
        return Ok(());
    };

    thread.approval_request_ids = approval_request_ids;
    thread.pending_approval_count = pending_approval_count;
    let now = crate::atomic::utc_now_iso();
    let body = if pending_approval_count == 0 {
        "All linked approvals are resolved.".to_string()
    } else if pending_approval_count == 1 {
        "One linked approval request is waiting.".to_string()
    } else {
        format!("{} linked approval requests are waiting.", pending_approval_count)
    };
    let pending_count_text = pending_approval_count.to_string();
    append_unique_message(
        &mut thread.messages,
        "approval",
        "approval-state",
        "Approval state updated",
        &body,
        &now,
        [("pendingApprovalCount", pending_count_text.as_str())],
    );
    thread.updated_at = now;
    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to write agent thread approval metadata: {}", e))?;

    Ok(())
}

pub fn upsert_provider_message(
    queue_item_id: &str,
    message: AgentThreadMessage,
    provider_session_id: Option<String>,
    provider_thread_id: Option<String>,
) -> Result<AgentThread, String> {
    let id = thread_id_for_queue_item(queue_item_id);
    let path = crate::state::agent_threads_dir().join(format!("{}.json", id));
    let mut thread = if let Some(thread) = read_existing_thread(&path) {
        thread
    } else if let Ok(Some(item)) = crate::brain::read_queue_item(queue_item_id) {
        let value = serde_json::to_value(item)
            .map_err(|e| format!("Failed to serialize queue item for thread update: {}", e))?;
        upsert_from_queue_value(&value)?
    } else {
        return Err(format!("Queue item not found for provider message: {}", queue_item_id));
    };

    if let Some(source_event_id) = message.metadata.get("sourceEventId") {
        if thread.messages.iter().any(|existing| {
            existing
                .metadata
                .get("sourceEventId")
                .map(|value| value == source_event_id)
                .unwrap_or(false)
        }) {
            return Ok(thread);
        }
    }

    thread.message_source = Some("structured-provider-events".to_string());
    if provider_session_id.is_some() {
        thread.provider_session_id = provider_session_id;
    }
    if provider_thread_id.is_some() {
        thread.provider_thread_id = provider_thread_id;
    }
    thread.messages.push(message);
    thread.updated_at = crate::atomic::utc_now_iso();
    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to write agent thread provider message: {}", e))?;

    Ok(thread)
}

pub fn mark_provider_session(
    queue_item_id: &str,
    provider_session_id: Option<String>,
    provider_thread_id: Option<String>,
) -> Result<AgentThread, String> {
    let id = thread_id_for_queue_item(queue_item_id);
    let path = crate::state::agent_threads_dir().join(format!("{}.json", id));
    let mut thread = if let Some(thread) = read_existing_thread(&path) {
        thread
    } else if let Ok(Some(item)) = crate::brain::read_queue_item(queue_item_id) {
        let value = serde_json::to_value(item)
            .map_err(|e| format!("Failed to serialize queue item for thread update: {}", e))?;
        upsert_from_queue_value(&value)?
    } else {
        return Err(format!("Queue item not found for provider session: {}", queue_item_id));
    };

    thread.message_source = Some("structured-provider-events".to_string());
    if provider_session_id.is_some() {
        thread.provider_session_id = provider_session_id;
    }
    if provider_thread_id.is_some() {
        thread.provider_thread_id = provider_thread_id;
    }
    thread.updated_at = crate::atomic::utc_now_iso();
    crate::atomic::atomic_write_json(&path, &thread)
        .map_err(|e| format!("Failed to write agent thread provider session: {}", e))?;

    Ok(thread)
}

fn read_existing_thread(path: &std::path::Path) -> Option<AgentThread> {
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str::<AgentThread>(&content).ok()
}

fn is_zero(value: &usize) -> bool {
    *value == 0
}

fn is_archivable_status(status: &str) -> bool {
    matches!(status, "done" | "landing" | "blocked" | "unknown")
}

fn append_queue_state_message(
    messages: &mut Vec<AgentThreadMessage>,
    item: &Value,
    queue_status: &str,
    thread_status: &str,
    at: &str,
) {
    let queue_item_id = optional_string(item, "id").unwrap_or_else(|| "unknown".to_string());
    let execution_path = optional_string(item, "executionPath")
        .or_else(|| optional_string(item, "projectPath"))
        .unwrap_or_else(|| "unknown execution path".to_string());
    let body = format!(
        "Queue item {} moved to {}. Thread state is {}. Execution path: {}.",
        queue_item_id, queue_status, thread_status, execution_path
    );
    append_unique_message(
        messages,
        "system",
        "queue-state",
        "Queue state updated",
        &body,
        at,
        [("queueStatus", queue_status), ("threadStatus", thread_status)],
    );
}

fn append_artifact_messages(messages: &mut Vec<AgentThreadMessage>, item: &Value, at: &str) {
    for (key, title) in [
        ("planPath", "Plan artifact linked"),
        ("activeHandoffPath", "Active handoff linked"),
        ("handoffPath", "Handoff artifact linked"),
        ("reviewPath", "Review artifact linked"),
    ] {
        if let Some(path) = optional_string(item, key) {
            append_unique_message(
                messages,
                "artifact",
                key,
                title,
                &path,
                at,
                [(key, path.as_str())],
            );
        }
    }
}

fn append_unique_message<'a, I>(
    messages: &mut Vec<AgentThreadMessage>,
    role: &str,
    kind: &str,
    title: &str,
    body: &str,
    at: &str,
    metadata: I,
) where
    I: IntoIterator<Item = (&'a str, &'a str)>,
{
    let metadata_map = metadata
        .into_iter()
        .map(|(key, value)| (key.to_string(), value.to_string()))
        .collect::<BTreeMap<_, _>>();

    if messages.iter().any(|message| {
        message.kind == kind && message.body == body && message.metadata == metadata_map
    }) {
        return;
    }

    messages.push(AgentThreadMessage {
        id: format!("message-{}", messages.len() + 1),
        role: role.to_string(),
        kind: kind.to_string(),
        title: title.to_string(),
        body: body.to_string(),
        created_at: at.to_string(),
        metadata: metadata_map,
    });
}

pub fn thread_id_for_queue_item(queue_item_id: &str) -> String {
    let mut clean = String::with_capacity(queue_item_id.len());
    for ch in queue_item_id.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
            clean.push(ch);
        } else {
            clean.push('_');
        }
    }
    format!("thread-{}", clean)
}

fn required_string(item: &Value, key: &str) -> Result<String, String> {
    optional_string(item, key).ok_or_else(|| format!("Queue item is missing {}", key))
}

fn optional_string(item: &Value, key: &str) -> Option<String> {
    item.get(key)
        .and_then(|value| value.as_str())
        .filter(|value| !value.trim().is_empty())
        .map(String::from)
}

fn title_for_queue_item(item: &Value, queue_item_id: &str) -> String {
    let project_id = optional_string(item, "projectId");

    optional_string(item, "threadTitle")
        .or_else(|| optional_string(item, "threadName"))
        .or_else(|| optional_string(item, "taskName"))
        .or_else(|| optional_string(item, "title"))
        .map(|title| clean_thread_title(&title, project_id.as_deref()))
        .filter(|title| !title.is_empty())
        .or_else(|| {
            [
                optional_string(item, "handoffPath"),
                optional_string(item, "planPath"),
                optional_string(item, "activeHandoffPath"),
                Some(queue_item_id.to_string()),
            ]
            .into_iter()
            .flatten()
            .find_map(|path| {
                std::path::Path::new(&path)
                    .file_stem()
                    .and_then(|stem| stem.to_str())
                    .map(|stem| clean_thread_title(stem, project_id.as_deref()))
                    .filter(|title| !title.is_empty())
            })
        })
        .unwrap_or_else(|| queue_item_id.to_string())
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

fn thread_status_for_queue_status(status: &str) -> &'static str {
    match status {
        "queued" | "reviewed-fix-request" => "waiting",
        "picked" | "started" | "stale-started" => "implementing",
        "submitted" => "waiting-review",
        "reviewing" => "reviewing",
        "landing" => "landing",
        "approved" => "done",
        "blocked" => "blocked",
        _ => "unknown",
    }
}

fn review_status_for_queue_status(status: &str) -> Option<&'static str> {
    match status {
        "submitted" => Some("waiting"),
        "reviewing" => Some("reviewing"),
        "reviewed-fix-request" => Some("fix-requested"),
        "landing" => Some("landing"),
        "approved" => Some("approved"),
        _ => None,
    }
}
