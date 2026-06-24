use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrchestrationMessage {
    pub id: String,
    pub role: String,
    pub body: String,
    pub created_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrchestrationThread {
    pub id: String,
    pub title: String,
    pub project_id: String,
    pub project_name: String,
    pub project_path: String,
    pub origin_agent: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(default)]
    pub messages: Vec<OrchestrationMessage>,
    #[serde(default)]
    pub linked_queue_item_ids: Vec<String>,
    #[serde(default)]
    pub linked_thread_ids: Vec<String>,
    #[serde(default)]
    pub linked_handoff_paths: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub archived_at: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrchestrationThreadInput {
    pub title: String,
    pub project_id: String,
    pub project_name: String,
    pub project_path: String,
    #[serde(default)]
    pub origin_agent: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub initial_message: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrchestrationMessageInput {
    pub orchestration_id: String,
    pub role: String,
    pub body: String,
    #[serde(default)]
    pub agent: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrchestrationRunInput {
    pub orchestration_id: String,
}

pub fn list_orchestrations() -> Result<Vec<OrchestrationThread>, String> {
    crate::state::ensure_state_root()
        .map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let dir = crate::state::orchestrations_dir();
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&dir)
        .map_err(|e| format!("Failed to read orchestrations directory: {}", e))?;
    let mut threads = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !path.extension().map_or(false, |ext| ext == "json") {
            continue;
        }
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(thread) = serde_json::from_str::<OrchestrationThread>(&content) {
                if thread.archived_at.is_none() {
                    threads.push(thread);
                }
            }
        }
    }

    threads.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(threads)
}

pub fn create_orchestration(input: OrchestrationThreadInput) -> Result<OrchestrationThread, String> {
    crate::state::ensure_state_root()
        .map_err(|e| format!("Failed to prepare Brain Loop state root: {}", e))?;
    let title = non_empty(input.title.as_str(), "Untitled orchestration");
    let now = crate::atomic::utc_now_iso();
    let id = unique_orchestration_id(&title);
    let mut messages = Vec::new();
    if let Some(body) = input.initial_message.as_deref().map(str::trim).filter(|value| !value.is_empty()) {
        messages.push(OrchestrationMessage {
            id: "message-1".to_string(),
            role: "user".to_string(),
            body: body.to_string(),
            created_at: now.clone(),
            agent: input.origin_agent.clone(),
            model: input.model.clone(),
            metadata: BTreeMap::new(),
        });
    }

    let thread = OrchestrationThread {
        id,
        title,
        project_id: non_empty(input.project_id.as_str(), "unassigned"),
        project_name: non_empty(input.project_name.as_str(), "Unassigned project"),
        project_path: input.project_path.trim().to_string(),
        origin_agent: input
            .origin_agent
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("brain-loop")
            .to_string(),
        status: "draft".to_string(),
        model: input.model.filter(|value| !value.trim().is_empty()),
        messages,
        linked_queue_item_ids: Vec::new(),
        linked_thread_ids: Vec::new(),
        linked_handoff_paths: Vec::new(),
        created_at: now.clone(),
        updated_at: now,
        archived_at: None,
    };
    write_orchestration(&thread)?;
    Ok(thread)
}

pub fn append_message(input: OrchestrationMessageInput) -> Result<OrchestrationThread, String> {
    let mut thread = read_orchestration(&input.orchestration_id)?;
    let body = input.body.trim();
    if body.is_empty() {
        return Err("Message body is required.".to_string());
    }
    let now = crate::atomic::utc_now_iso();
    let message = OrchestrationMessage {
        id: format!("message-{}", thread.messages.len() + 1),
        role: non_empty(input.role.as_str(), "user"),
        body: body.to_string(),
        created_at: now.clone(),
        agent: input.agent.filter(|value| !value.trim().is_empty()),
        model: input.model.filter(|value| !value.trim().is_empty()),
        metadata: input.metadata,
    };
    thread.messages.push(message);
    if thread.status == "draft" {
        thread.status = "refining".to_string();
    }
    thread.updated_at = now;
    write_orchestration(&thread)?;
    Ok(thread)
}

pub fn run_live_turn(input: OrchestrationRunInput) -> Result<OrchestrationThread, String> {
    let mut thread = read_orchestration(&input.orchestration_id)?;
    let prompt = live_orchestration_prompt(&thread);
    let model = thread
        .model
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(match thread.origin_agent.as_str() {
            "claude" => "claude-sonnet-4-6",
            _ => "gpt-5-codex",
        })
        .to_string();

    let body = match thread.origin_agent.as_str() {
        "claude" => run_claude_orchestrator(&thread, &model, &prompt)?,
        "codex" => run_codex_orchestrator(&thread, &model, &prompt)?,
        other => {
            return Err(format!(
                "Orchestrator `{}` is not wired to a live local runtime.",
                other
            ));
        }
    };

    let now = crate::atomic::utc_now_iso();
    let mut metadata = BTreeMap::new();
    metadata.insert("responseKind".to_string(), "live-orchestration-turn".to_string());
    metadata.insert("orchestrator".to_string(), thread.origin_agent.clone());
    metadata.insert("model".to_string(), model.clone());
    thread.messages.push(OrchestrationMessage {
        id: format!("message-{}", thread.messages.len() + 1),
        role: "assistant".to_string(),
        body,
        created_at: now.clone(),
        agent: Some(thread.origin_agent.clone()),
        model: Some(model),
        metadata,
    });
    if thread.status == "draft" {
        thread.status = "refining".to_string();
    }
    thread.updated_at = now;
    write_orchestration(&thread)?;
    Ok(thread)
}

pub fn read_orchestration(id: &str) -> Result<OrchestrationThread, String> {
    let path = orchestration_path(id);
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read orchestration {}: {}", id, e))?;
    serde_json::from_str::<OrchestrationThread>(&content)
        .map_err(|e| format!("Failed to parse orchestration {}: {}", id, e))
}

pub fn write_orchestration(thread: &OrchestrationThread) -> Result<(), String> {
    crate::atomic::atomic_write_json(&orchestration_path(&thread.id), thread)
        .map_err(|e| format!("Failed to write orchestration: {}", e))
}

pub fn artifacts_dir(id: &str) -> PathBuf {
    crate::state::orchestrations_dir()
        .join(sanitize_segment(id))
        .join("handoffs")
}

pub fn sanitize_segment(value: &str) -> String {
    let mut clean = String::new();
    for ch in value.trim().to_ascii_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            clean.push(ch);
        } else if ch == '-' || ch == '_' || ch.is_ascii_whitespace() {
            clean.push('-');
        }
    }
    let compact = clean
        .split('-')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("-");
    if compact.is_empty() {
        "orchestration".to_string()
    } else {
        compact
    }
}

fn orchestration_path(id: &str) -> PathBuf {
    crate::state::orchestrations_dir().join(format!("{}.json", sanitize_segment(id)))
}

fn unique_orchestration_id(title: &str) -> String {
    let date = crate::atomic::utc_now_iso()
        .split('T')
        .next()
        .unwrap_or("orchestration")
        .to_string();
    let base = format!("{}-{}", date, sanitize_segment(title));
    let mut candidate = base.clone();
    let mut index = 2;
    while orchestration_path(&candidate).exists() {
        candidate = format!("{}-{}", base, index);
        index += 1;
    }
    candidate
}

fn non_empty(value: &str, fallback: &str) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        fallback.to_string()
    } else {
        trimmed.to_string()
    }
}

fn live_orchestration_prompt(thread: &OrchestrationThread) -> String {
    let conversation = thread
        .messages
        .iter()
        .filter(|message| {
            message
                .metadata
                .get("responseKind")
                .map(|value| value != "orchestration-intake-guidance")
                .unwrap_or(true)
        })
        .map(|message| format!("{}: {}", message.role, message.body))
        .collect::<Vec<_>>()
        .join("\n\n");

    format!(
        "You are the live Brain Loop orchestrator for a local task queue automation app.\n\nProject:\n- id: {project_id}\n- name: {project_name}\n- path: {project_path}\n\nRules:\n- Planning only; do not edit files or run mutating commands.\n- Convert the user's intent into implementation-ready direction.\n- Keep the response concise and concrete.\n- If the request is ready for handoff, list the worker task title and the exact handoff body Brain Loop should queue.\n- If more clarification is needed, ask targeted questions.\n- Preserve Brain Loop queue semantics: worker tasks should be reviewed and approved before they are considered done.\n\nConversation:\n{conversation}",
        project_id = thread.project_id,
        project_name = thread.project_name,
        project_path = thread.project_path,
        conversation = if conversation.trim().is_empty() {
            "No conversation yet.".to_string()
        } else {
            conversation
        },
    )
}

fn run_codex_orchestrator(
    thread: &OrchestrationThread,
    model: &str,
    prompt: &str,
) -> Result<String, String> {
    let mut command = Command::new("/Applications/Codex.app/Contents/Resources/codex");
    command
        .arg("exec")
        .arg("-C")
        .arg(orchestration_cwd(thread))
        .arg("--model")
        .arg(model)
        .arg("--sandbox")
        .arg("read-only")
        .arg(prompt);
    run_orchestrator_command(command, "Codex")
}

fn run_claude_orchestrator(
    thread: &OrchestrationThread,
    model: &str,
    prompt: &str,
) -> Result<String, String> {
    let mut command = Command::new("/usr/local/bin/claude");
    command
        .arg("--print")
        .arg("--model")
        .arg(model)
        .arg("--permission-mode")
        .arg("plan")
        .arg("--tools")
        .arg("")
        .arg(prompt)
        .current_dir(orchestration_cwd(thread));
    run_orchestrator_command(command, "Claude")
}

fn run_orchestrator_command(mut command: Command, label: &str) -> Result<String, String> {
    let output = command
        .output()
        .map_err(|e| format!("Failed to start {} orchestrator: {}", label, e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if !output.status.success() {
        return Err(format!(
            "{} orchestrator exited with status {}. {}",
            label,
            output
                .status
                .code()
                .map(|code| code.to_string())
                .unwrap_or_else(|| "unknown".to_string()),
            if stderr.is_empty() { stdout } else { stderr }
        ));
    }
    if stdout.is_empty() {
        return Err(format!("{} orchestrator returned an empty response.", label));
    }
    Ok(stdout)
}

fn orchestration_cwd(thread: &OrchestrationThread) -> String {
    let trimmed = thread.project_path.trim();
    if !trimmed.is_empty() && PathBuf::from(trimmed).is_dir() {
        trimmed.to_string()
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .to_string_lossy()
            .into_owned()
    }
}
