use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs::OpenOptions;
use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

#[derive(Default)]
pub struct HarnessRuntimeState {
    codex_sessions: Arc<Mutex<BTreeMap<String, CodexRuntimeHandle>>>,
}

#[derive(Clone)]
struct CodexRuntimeHandle {
    queue_item_id: String,
    brain_thread_id: String,
    provider_thread_id: String,
    provider_session_id: String,
    model: String,
    stdin: Arc<Mutex<ChildStdin>>,
    child: Arc<Mutex<Child>>,
    next_request_id: Arc<AtomicU64>,
}

#[derive(Clone)]
struct CodexEventContext {
    queue_item_id: String,
    brain_thread_id: String,
    provider_thread_id: String,
    provider_session_id: String,
    model: String,
}

impl From<&CodexRuntimeHandle> for CodexEventContext {
    fn from(runtime: &CodexRuntimeHandle) -> Self {
        Self {
            queue_item_id: runtime.queue_item_id.clone(),
            brain_thread_id: runtime.brain_thread_id.clone(),
            provider_thread_id: runtime.provider_thread_id.clone(),
            provider_session_id: runtime.provider_session_id.clone(),
            model: runtime.model.clone(),
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HarnessProviderCapability {
    pub provider: String,
    pub label: String,
    pub mode: String,
    pub exact_messages: bool,
    pub details: String,
    pub event_kinds: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HarnessEventInput {
    pub kind: String,
    pub source_event_id: String,
    pub provider: String,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub queue_item_id: Option<String>,
    #[serde(default)]
    pub thread_id: Option<String>,
    #[serde(default)]
    pub run_id: Option<String>,
    #[serde(default)]
    pub provider_session_id: Option<String>,
    #[serde(default)]
    pub provider_thread_id: Option<String>,
    #[serde(default)]
    pub turn_id: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HarnessSessionStartInput {
    pub queue_item_id: String,
    pub provider: String,
    pub model: String,
    pub prompt: String,
    #[serde(default)]
    pub execution_path: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HarnessSession {
    pub session_id: String,
    pub queue_item_id: String,
    pub thread_id: String,
    pub provider_thread_id: Option<String>,
    pub provider: String,
    pub model: String,
    pub message_source: String,
    pub started_at: String,
}

const STRUCTURED_EVENT_KINDS: &[&str] = &[
    "session.started",
    "turn.started",
    "message.delta",
    "message.completed",
    "tool.started",
    "tool.completed",
    "approval.required",
    "file.changed",
    "run.log",
    "turn.completed",
    "session.failed",
    "session.completed",
];

#[tauri::command]
pub fn list_harness_capabilities() -> Result<Vec<HarnessProviderCapability>, String> {
    let direct_event_kinds = crate::direct_model::runtime_event_kinds();
    Ok(vec![
        HarnessProviderCapability {
            provider: "codex".to_string(),
            label: "Codex".to_string(),
            mode: "structured-provider-events".to_string(),
            exact_messages: true,
            details: "Brain Loop starts Codex app-server sessions over newline JSON-RPC, stores raw provider events, and renders completed provider messages verbatim in the thread.".to_string(),
            event_kinds: STRUCTURED_EVENT_KINDS.iter().map(|kind| kind.to_string()).collect(),
        },
        HarnessProviderCapability {
            provider: "open-code".to_string(),
            label: "OpenCode".to_string(),
            mode: "transcript-only".to_string(),
            exact_messages: false,
            details: "OpenCode exposes ACP and JSON session export surfaces, but Brain Loop keeps it transcript-only until a stable live message stream is wired.".to_string(),
            event_kinds: vec!["run.log".to_string()],
        },
        HarnessProviderCapability {
            provider: "antigravity".to_string(),
            label: "Antigravity".to_string(),
            mode: "transcript-only".to_string(),
            exact_messages: false,
            details: "AGY currently exposes CLI conversation/log-file surfaces in this install; no verified structured live message API is available yet.".to_string(),
            event_kinds: vec!["run.log".to_string()],
        },
        HarnessProviderCapability {
            provider: "direct-deepseek".to_string(),
            label: "DeepSeek Direct".to_string(),
            mode: "unsupported".to_string(),
            exact_messages: false,
            details: "Direct DeepSeek is cataloged as an OpenAI-compatible model provider. Brain Loop now exposes the planned tool-loop contract, but dispatch is still disabled until provider execution is wired.".to_string(),
            event_kinds: direct_event_kinds.clone(),
        },
        HarnessProviderCapability {
            provider: "direct-gemini".to_string(),
            label: "Gemini Direct".to_string(),
            mode: "unsupported".to_string(),
            exact_messages: false,
            details: "Direct Gemini is cataloged as a Gemini generateContent provider with function calling. Brain Loop now exposes the planned tool-loop contract, but dispatch is still disabled until provider execution is wired.".to_string(),
            event_kinds: direct_event_kinds,
        },
    ])
}

#[tauri::command]
pub fn start_harness_session(
    app: AppHandle,
    state: State<'_, HarnessRuntimeState>,
    input: HarnessSessionStartInput,
) -> Result<HarnessSession, String> {
    if input.provider != "codex" {
        return Err(format!(
            "{} does not expose structured-provider-events in Brain Loop yet.",
            input.provider
        ));
    }

    let started_at = crate::atomic::utc_now_iso();
    let queue_item_id = input.queue_item_id.clone();
    let brain_thread_id = format!("thread-{}", queue_item_id);
    let cwd = input
        .execution_path
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| std::env::current_dir()
            .ok()
            .map(|path| path.to_string_lossy().to_string())
            .unwrap_or_else(|| ".".to_string()));

    let mut runtime = start_codex_runtime(
        app.clone(),
        state.codex_sessions.clone(),
        queue_item_id.clone(),
        brain_thread_id.clone(),
        input.model.clone(),
        cwd,
    )?;
    let session_id = runtime.provider_session_id.clone();

    let session_event = HarnessEventInput {
        kind: "session.started".to_string(),
        source_event_id: format!("codex:{}:session.started", runtime.provider_thread_id),
        provider: input.provider.clone(),
        model: Some(input.model.clone()),
        queue_item_id: Some(input.queue_item_id.clone()),
        thread_id: Some(brain_thread_id.clone()),
        run_id: Some(session_id.clone()),
        provider_session_id: Some(session_id.clone()),
        provider_thread_id: Some(runtime.provider_thread_id.clone()),
        turn_id: None,
        role: None,
        title: Some("Harness session started".to_string()),
        body: Some(input.execution_path.clone().unwrap_or_else(|| "No execution path recorded.".to_string())),
        created_at: Some(started_at.clone()),
        metadata: BTreeMap::new(),
    };
    record_harness_event(app.clone(), session_event)?;

    state
        .codex_sessions
        .lock()
        .map_err(|_| "Failed to lock Codex harness session state.".to_string())?
        .insert(brain_thread_id.clone(), runtime.clone());

    if !input.prompt.trim().is_empty() {
        send_codex_turn(&mut runtime, &input.prompt)?;
    }

    Ok(HarnessSession {
        session_id,
        queue_item_id: input.queue_item_id,
        thread_id: brain_thread_id,
        provider_thread_id: Some(runtime.provider_thread_id),
        provider: input.provider,
        model: input.model,
        message_source: "structured-provider-events".to_string(),
        started_at,
    })
}

#[tauri::command]
pub fn send_harness_message(
    app: AppHandle,
    state: State<'_, HarnessRuntimeState>,
    thread_id: String,
    message: String,
) -> Result<crate::agent_thread::AgentThread, String> {
    if let Some(mut runtime) = state
        .codex_sessions
        .lock()
        .map_err(|_| "Failed to lock Codex harness session state.".to_string())?
        .get(&thread_id)
        .cloned()
    {
        send_codex_turn(&mut runtime, &message)?;
        return crate::agent_thread::mark_provider_session(
            &runtime.queue_item_id,
            Some(runtime.provider_session_id),
            Some(runtime.provider_thread_id),
        );
    }

    let queue_item_id = queue_item_id_from_thread_id(&thread_id)?;
    let queue_item = crate::brain::read_queue_item(&queue_item_id)
        .map_err(|e| format!("Failed to read queue item for Codex harness recovery: {}", e))?
        .ok_or_else(|| format!("Queue item not found for Codex harness recovery: {}", queue_item_id))?;
    let model = "gpt-5-codex".to_string();
    let cwd = queue_item.execution_path.clone().unwrap_or(queue_item.project_path);
    let mut runtime = start_codex_runtime(
        app.clone(),
        state.codex_sessions.clone(),
        queue_item_id.clone(),
        thread_id.clone(),
        model.clone(),
        cwd.clone(),
    )?;
    let session_event = HarnessEventInput {
        kind: "session.started".to_string(),
        source_event_id: format!("codex:{}:session.started", runtime.provider_thread_id),
        provider: "codex".to_string(),
        model: Some(model),
        queue_item_id: Some(queue_item_id.clone()),
        thread_id: Some(thread_id.clone()),
        run_id: Some(runtime.provider_session_id.clone()),
        provider_session_id: Some(runtime.provider_session_id.clone()),
        provider_thread_id: Some(runtime.provider_thread_id.clone()),
        turn_id: None,
        role: None,
        title: Some("Harness session recovered".to_string()),
        body: Some(cwd),
        created_at: Some(crate::atomic::utc_now_iso()),
        metadata: BTreeMap::from([("recoveredRuntime".to_string(), "true".to_string())]),
    };
    record_harness_event(app, session_event)?;
    state
        .codex_sessions
        .lock()
        .map_err(|_| "Failed to lock Codex harness session state.".to_string())?
        .insert(thread_id, runtime.clone());
    send_codex_turn(&mut runtime, &message)?;
    crate::agent_thread::mark_provider_session(
        &runtime.queue_item_id,
        Some(runtime.provider_session_id),
        Some(runtime.provider_thread_id),
    )
}

#[tauri::command]
pub fn stop_harness_session(
    app: AppHandle,
    state: State<'_, HarnessRuntimeState>,
    thread_id: String,
) -> Result<crate::agent_thread::AgentThread, String> {
    let queue_item_id = queue_item_id_from_thread_id(&thread_id)?;
    let runtime = state
        .codex_sessions
        .lock()
        .map_err(|_| "Failed to lock Codex harness session state.".to_string())?
        .remove(&thread_id);
    if let Some(runtime) = runtime {
        let request_id = runtime.next_request_id.fetch_add(1, Ordering::SeqCst);
        let _ = write_json_line(
            &runtime.stdin,
            json!({
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "thread/unsubscribe",
                "params": { "threadId": runtime.provider_thread_id },
            }),
        );
        if let Ok(mut child) = runtime.child.lock() {
            let _ = child.kill();
        }
    }

    let event = HarnessEventInput {
        kind: "session.completed".to_string(),
        source_event_id: format!("{}:session.completed:{}", thread_id, chrono::Utc::now().timestamp_millis()),
        provider: "codex".to_string(),
        model: None,
        queue_item_id: Some(queue_item_id),
        thread_id: Some(thread_id),
        run_id: None,
        provider_session_id: None,
        provider_thread_id: None,
        turn_id: None,
        role: Some("system".to_string()),
        title: Some("Harness session completed".to_string()),
        body: Some("The structured harness session was stopped.".to_string()),
        created_at: Some(crate::atomic::utc_now_iso()),
        metadata: BTreeMap::new(),
    };

    record_harness_event(app, event)
}

#[tauri::command]
pub fn replay_harness_events(
    app: AppHandle,
    queue_item_id: String,
) -> Result<crate::agent_thread::AgentThread, String> {
    let path = crate::state::harness_events_dir().join(format!("{}.jsonl", sanitize_id(&queue_item_id)));
    let file = OpenOptions::new()
        .read(true)
        .open(&path)
        .map_err(|e| format!("Failed to open harness event log for replay: {}", e))?;
    let reader = BufReader::new(file);
    let mut latest = None;
    for line in reader.lines() {
        let line = line.map_err(|e| format!("Failed to read harness event log: {}", e))?;
        if line.trim().is_empty() {
            continue;
        }
        let event = serde_json::from_str::<HarnessEventInput>(&line)
            .map_err(|e| format!("Failed to parse harness event log entry: {}", e))?;
        latest = Some(ingest_harness_event(app.clone(), event, false)?);
    }

    latest.ok_or_else(|| format!("No harness events found for queue item: {}", queue_item_id))
}

#[tauri::command]
pub fn record_harness_event(
    app: AppHandle,
    event: HarnessEventInput,
) -> Result<crate::agent_thread::AgentThread, String> {
    ingest_harness_event(app, event, true)
}

fn ingest_harness_event(
    app: AppHandle,
    event: HarnessEventInput,
    should_append_raw_event: bool,
) -> Result<crate::agent_thread::AgentThread, String> {
    validate_event(&event)?;
    if should_append_raw_event {
        append_raw_event(&event)?;
    }

    let queue_item_id = event
        .queue_item_id
        .clone()
        .or_else(|| event.thread_id.as_deref().and_then(queue_item_id_from_thread_id_value))
        .ok_or_else(|| "Harness event must include queueItemId or a threadId derived from one.".to_string())?;

    let thread = match event.kind.as_str() {
        "message.completed" | "approval.required" | "session.failed" | "session.completed" => {
            let message = message_from_event(&event)?;
            crate::agent_thread::upsert_provider_message(
                &queue_item_id,
                message,
                event.provider_session_id.clone(),
                event.provider_thread_id.clone(),
            )?
        }
        "session.started" => crate::agent_thread::mark_provider_session(
            &queue_item_id,
            event.provider_session_id.clone(),
            event.provider_thread_id.clone(),
        )?,
        _ => crate::agent_thread::mark_provider_session(
            &queue_item_id,
            event.provider_session_id.clone(),
            event.provider_thread_id.clone(),
        )?,
    };

    let _ = app.emit("harness-event", event);
    Ok(thread)
}

fn start_codex_runtime(
    app: AppHandle,
    sessions: Arc<Mutex<BTreeMap<String, CodexRuntimeHandle>>>,
    queue_item_id: String,
    brain_thread_id: String,
    model: String,
    cwd: String,
) -> Result<CodexRuntimeHandle, String> {
    let executable = codex_executable();
    let mut child = Command::new(&executable)
        .args(["app-server", "--stdio"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Codex app-server at {}: {}", executable, e))?;

    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| "Codex app-server stdin was not available.".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Codex app-server stdout was not available.".to_string())?;
    if let Some(stderr) = child.stderr.take() {
        spawn_codex_stderr_reader(
            app.clone(),
            queue_item_id.clone(),
            brain_thread_id.clone(),
            model.clone(),
            stderr,
        );
    }

    let stdin = Arc::new(Mutex::new(stdin));
    let mut reader = BufReader::new(stdout);
    write_json_line(
        &stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "clientInfo": {
                    "name": "brain-loop",
                    "title": "Brain Loop",
                    "version": env!("CARGO_PKG_VERSION")
                },
                "capabilities": {
                    "experimentalApi": true,
                    "requestAttestation": false
                }
            }
        }),
    )?;
    read_jsonrpc_response(&mut reader, 1)?;
    write_json_line(&stdin, json!({ "jsonrpc": "2.0", "method": "initialized" }))?;

    write_json_line(
        &stdin,
        json!({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "thread/start",
            "params": {
                "model": model,
                "cwd": cwd,
                "approvalPolicy": "on-request",
                "sandbox": "workspace-write",
                "ephemeral": false,
                "serviceName": "Brain Loop",
                "sessionStartSource": "startup",
                "threadSource": "api"
            }
        }),
    )?;
    let thread_start = read_jsonrpc_response(&mut reader, 2)?;
    let thread = thread_start
        .get("thread")
        .ok_or_else(|| "Codex thread/start response did not include a thread.".to_string())?;
    let provider_thread_id = thread
        .get("id")
        .and_then(Value::as_str)
        .ok_or_else(|| "Codex thread/start response did not include thread.id.".to_string())?
        .to_string();
    let provider_session_id = thread
        .get("sessionId")
        .and_then(Value::as_str)
        .unwrap_or(&provider_thread_id)
        .to_string();

    let handle = CodexRuntimeHandle {
        queue_item_id: queue_item_id.clone(),
        brain_thread_id: brain_thread_id.clone(),
        provider_thread_id: provider_thread_id.clone(),
        provider_session_id: provider_session_id.clone(),
        model: model.clone(),
        stdin,
        child: Arc::new(Mutex::new(child)),
        next_request_id: Arc::new(AtomicU64::new(3)),
    };
    spawn_codex_stdout_reader(app, sessions, reader, handle.clone());

    Ok(handle)
}

fn send_codex_turn(runtime: &mut CodexRuntimeHandle, message: &str) -> Result<(), String> {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("Cannot send an empty harness message.".to_string());
    }
    let request_id = runtime.next_request_id.fetch_add(1, Ordering::SeqCst);
    let client_user_message_id = format!(
        "brain-loop-{}-{}",
        sanitize_id(&runtime.queue_item_id),
        chrono::Utc::now().timestamp_millis()
    );
    write_json_line(
        &runtime.stdin,
        json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "turn/start",
            "params": {
                "threadId": runtime.provider_thread_id,
                "clientUserMessageId": client_user_message_id,
                "input": [{
                    "type": "text",
                    "text": trimmed,
                    "text_elements": []
                }],
                "model": runtime.model
            }
        }),
    )
}

fn spawn_codex_stdout_reader(
    app: AppHandle,
    sessions: Arc<Mutex<BTreeMap<String, CodexRuntimeHandle>>>,
    mut reader: BufReader<std::process::ChildStdout>,
    runtime: CodexRuntimeHandle,
) {
    std::thread::spawn(move || {
        let context = CodexEventContext::from(&runtime);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }
                    let Ok(value) = serde_json::from_str::<Value>(trimmed) else {
                        continue;
                    };
                    if let Some(event) = codex_notification_to_harness_event(&context, &value) {
                        let _ = record_harness_event(app.clone(), event);
                    }
                }
                Err(_) => break,
            }
        }
        if let Ok(mut sessions) = sessions.lock() {
            sessions.remove(&runtime.brain_thread_id);
        }
    });
}

fn spawn_codex_stderr_reader(
    app: AppHandle,
    queue_item_id: String,
    brain_thread_id: String,
    model: String,
    stderr: std::process::ChildStderr,
) {
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().map_while(Result::ok) {
            let body = line.trim();
            if body.is_empty() {
                continue;
            }
            let event = HarnessEventInput {
                kind: "run.log".to_string(),
                source_event_id: format!(
                    "codex:{}:stderr:{}",
                    queue_item_id,
                    chrono::Utc::now().timestamp_micros()
                ),
                provider: "codex".to_string(),
                model: Some(model.clone()),
                queue_item_id: Some(queue_item_id.clone()),
                thread_id: Some(brain_thread_id.clone()),
                run_id: None,
                provider_session_id: None,
                provider_thread_id: None,
                turn_id: None,
                role: Some("system".to_string()),
                title: Some("Codex log".to_string()),
                body: Some(body.to_string()),
                created_at: Some(crate::atomic::utc_now_iso()),
                metadata: BTreeMap::from([("stream".to_string(), "stderr".to_string())]),
            };
            let _ = record_harness_event(app.clone(), event);
        }
    });
}

fn codex_notification_to_harness_event(
    context: &CodexEventContext,
    message: &Value,
) -> Option<HarnessEventInput> {
    let method = message.get("method")?.as_str()?;
    let params = message.get("params").unwrap_or(&Value::Null);
    match method {
        "turn/started" => Some(base_codex_event(context, params, "turn.started", "Turn started", None)),
        "turn/completed" => Some(base_codex_event(context, params, "turn.completed", "Turn completed", None)),
        "item/agentMessage/delta" => {
            let delta = params.get("delta").and_then(Value::as_str)?.to_string();
            let item_id = params.get("itemId").and_then(Value::as_str).unwrap_or("unknown");
            let turn_id = params.get("turnId").and_then(Value::as_str);
            Some(HarnessEventInput {
                kind: "message.delta".to_string(),
                source_event_id: format!(
                    "codex:{}:{}:{}:{}",
                    context.provider_thread_id,
                    turn_id.unwrap_or("turn"),
                    item_id,
                    chrono::Utc::now().timestamp_micros()
                ),
                provider: "codex".to_string(),
                model: Some(context.model.clone()),
                queue_item_id: Some(context.queue_item_id.clone()),
                thread_id: Some(context.brain_thread_id.clone()),
                run_id: Some(context.provider_session_id.clone()),
                provider_session_id: Some(context.provider_session_id.clone()),
                provider_thread_id: Some(context.provider_thread_id.clone()),
                turn_id: turn_id.map(String::from),
                role: Some("agent".to_string()),
                title: Some("Codex".to_string()),
                body: Some(delta),
                created_at: Some(crate::atomic::utc_now_iso()),
                metadata: BTreeMap::from([("itemId".to_string(), item_id.to_string())]),
            })
        }
        "item/completed" => codex_completed_item_to_harness_event(context, params),
        _ => None,
    }
}

fn codex_completed_item_to_harness_event(
    context: &CodexEventContext,
    params: &Value,
) -> Option<HarnessEventInput> {
    let item = params.get("item")?;
    let item_type = item.get("type")?.as_str()?;
    let item_id = item.get("id").and_then(Value::as_str).unwrap_or("unknown");
    let turn_id = params.get("turnId").and_then(Value::as_str);
    let completed_at = params
        .get("completedAtMs")
        .and_then(Value::as_i64)
        .and_then(timestamp_millis_to_iso);

    match item_type {
        "agentMessage" => Some(HarnessEventInput {
            kind: "message.completed".to_string(),
            source_event_id: format!(
                "codex:{}:{}:{}",
                context.provider_thread_id,
                turn_id.unwrap_or("turn"),
                item_id
            ),
            provider: "codex".to_string(),
            model: Some(context.model.clone()),
            queue_item_id: Some(context.queue_item_id.clone()),
            thread_id: Some(context.brain_thread_id.clone()),
            run_id: Some(context.provider_session_id.clone()),
            provider_session_id: Some(context.provider_session_id.clone()),
            provider_thread_id: Some(context.provider_thread_id.clone()),
            turn_id: turn_id.map(String::from),
            role: Some("agent".to_string()),
            title: Some("Codex".to_string()),
            body: item.get("text").and_then(Value::as_str).map(String::from),
            created_at: completed_at,
            metadata: BTreeMap::from([("itemId".to_string(), item_id.to_string())]),
        }),
        "userMessage" => {
            let body = codex_user_message_body(item)?;
            Some(HarnessEventInput {
                kind: "message.completed".to_string(),
                source_event_id: format!(
                    "codex:{}:{}:{}",
                    context.provider_thread_id,
                    turn_id.unwrap_or("turn"),
                    item_id
                ),
                provider: "codex".to_string(),
                model: Some(context.model.clone()),
                queue_item_id: Some(context.queue_item_id.clone()),
                thread_id: Some(context.brain_thread_id.clone()),
                run_id: Some(context.provider_session_id.clone()),
                provider_session_id: Some(context.provider_session_id.clone()),
                provider_thread_id: Some(context.provider_thread_id.clone()),
                turn_id: turn_id.map(String::from),
                role: Some("user".to_string()),
                title: Some("User".to_string()),
                body: Some(body),
                created_at: completed_at,
                metadata: BTreeMap::from([("itemId".to_string(), item_id.to_string())]),
            })
        }
        "commandExecution" => Some(HarnessEventInput {
            kind: "tool.completed".to_string(),
            source_event_id: format!(
                "codex:{}:{}:{}",
                context.provider_thread_id,
                turn_id.unwrap_or("turn"),
                item_id
            ),
            provider: "codex".to_string(),
            model: Some(context.model.clone()),
            queue_item_id: Some(context.queue_item_id.clone()),
            thread_id: Some(context.brain_thread_id.clone()),
            run_id: Some(context.provider_session_id.clone()),
            provider_session_id: Some(context.provider_session_id.clone()),
            provider_thread_id: Some(context.provider_thread_id.clone()),
            turn_id: turn_id.map(String::from),
            role: Some("system".to_string()),
            title: Some("Codex tool completed".to_string()),
            body: item.get("command").and_then(Value::as_str).map(String::from),
            created_at: completed_at,
            metadata: BTreeMap::from([("itemId".to_string(), item_id.to_string())]),
        }),
        "fileChange" => Some(HarnessEventInput {
            kind: "file.changed".to_string(),
            source_event_id: format!(
                "codex:{}:{}:{}",
                context.provider_thread_id,
                turn_id.unwrap_or("turn"),
                item_id
            ),
            provider: "codex".to_string(),
            model: Some(context.model.clone()),
            queue_item_id: Some(context.queue_item_id.clone()),
            thread_id: Some(context.brain_thread_id.clone()),
            run_id: Some(context.provider_session_id.clone()),
            provider_session_id: Some(context.provider_session_id.clone()),
            provider_thread_id: Some(context.provider_thread_id.clone()),
            turn_id: turn_id.map(String::from),
            role: Some("system".to_string()),
            title: Some("Codex file change".to_string()),
            body: Some("A provider file-change item completed.".to_string()),
            created_at: completed_at,
            metadata: BTreeMap::from([("itemId".to_string(), item_id.to_string())]),
        }),
        _ => None,
    }
}

fn base_codex_event(
    context: &CodexEventContext,
    params: &Value,
    kind: &str,
    title: &str,
    body: Option<String>,
) -> HarnessEventInput {
    let turn_id = params
        .get("turnId")
        .and_then(Value::as_str)
        .or_else(|| params.get("turn").and_then(|turn| turn.get("id")).and_then(Value::as_str));
    HarnessEventInput {
        kind: kind.to_string(),
        source_event_id: format!(
            "codex:{}:{}:{}",
            context.provider_thread_id,
            turn_id.unwrap_or("turn"),
            kind
        ),
        provider: "codex".to_string(),
        model: Some(context.model.clone()),
        queue_item_id: Some(context.queue_item_id.clone()),
        thread_id: Some(context.brain_thread_id.clone()),
        run_id: Some(context.provider_session_id.clone()),
        provider_session_id: Some(context.provider_session_id.clone()),
        provider_thread_id: Some(context.provider_thread_id.clone()),
        turn_id: turn_id.map(String::from),
        role: Some("system".to_string()),
        title: Some(title.to_string()),
        body,
        created_at: Some(crate::atomic::utc_now_iso()),
        metadata: BTreeMap::new(),
    }
}

fn codex_user_message_body(item: &Value) -> Option<String> {
    let content = item.get("content")?.as_array()?;
    let text = content
        .iter()
        .filter_map(|entry| {
            if entry.get("type").and_then(Value::as_str) == Some("text") {
                entry.get("text").and_then(Value::as_str)
            } else {
                None
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    if text.trim().is_empty() {
        None
    } else {
        Some(text)
    }
}

fn read_jsonrpc_response(
    reader: &mut BufReader<std::process::ChildStdout>,
    response_id: u64,
) -> Result<Value, String> {
    let mut line = String::new();
    loop {
        line.clear();
        let bytes = reader
            .read_line(&mut line)
            .map_err(|e| format!("Failed to read Codex app-server response: {}", e))?;
        if bytes == 0 {
            return Err("Codex app-server closed before responding.".to_string());
        }
        let value = serde_json::from_str::<Value>(line.trim())
            .map_err(|e| format!("Failed to parse Codex app-server JSON-RPC line: {}", e))?;
        if value.get("id").and_then(Value::as_u64) != Some(response_id) {
            continue;
        }
        if let Some(error) = value.get("error") {
            return Err(format!("Codex app-server request failed: {}", error));
        }
        return value
            .get("result")
            .cloned()
            .ok_or_else(|| "Codex app-server response did not include a result.".to_string());
    }
}

fn write_json_line(stdin: &Arc<Mutex<ChildStdin>>, value: Value) -> Result<(), String> {
    let mut stdin = stdin
        .lock()
        .map_err(|_| "Failed to lock Codex app-server stdin.".to_string())?;
    let line = serde_json::to_string(&value)
        .map_err(|e| format!("Failed to serialize Codex JSON-RPC request: {}", e))?;
    writeln!(stdin, "{}", line)
        .map_err(|e| format!("Failed to write Codex JSON-RPC request: {}", e))?;
    stdin
        .flush()
        .map_err(|e| format!("Failed to flush Codex JSON-RPC request: {}", e))
}

fn codex_executable() -> String {
    let bundled = "/Applications/Codex.app/Contents/Resources/codex";
    if Path::new(bundled).exists() {
        bundled.to_string()
    } else {
        "codex".to_string()
    }
}

fn timestamp_millis_to_iso(value: i64) -> Option<String> {
    let timestamp = chrono::DateTime::<chrono::Utc>::from_timestamp_millis(value)?;
    Some(timestamp.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
}

fn validate_event(event: &HarnessEventInput) -> Result<(), String> {
    if !STRUCTURED_EVENT_KINDS.contains(&event.kind.as_str()) {
        return Err(format!("Unsupported harness event kind: {}", event.kind));
    }
    if event.source_event_id.trim().is_empty() {
        return Err("Harness event sourceEventId is required.".to_string());
    }
    if event.provider.trim().is_empty() {
        return Err("Harness event provider is required.".to_string());
    }
    Ok(())
}

fn append_raw_event(event: &HarnessEventInput) -> Result<(), String> {
    let dir = crate::state::harness_events_dir();
    crate::state::ensure_dir(&dir)
        .map_err(|e| format!("Failed to create harness event dir: {}", e))?;
    let file_stem = event
        .queue_item_id
        .as_deref()
        .or(event.thread_id.as_deref())
        .or(event.provider_session_id.as_deref())
        .unwrap_or("unlinked");
    let path = dir.join(format!("{}.jsonl", sanitize_id(file_stem)));
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("Failed to open harness event log: {}", e))?;
    let line = serde_json::to_string(event)
        .map_err(|e| format!("Failed to serialize harness event: {}", e))?;
    writeln!(file, "{}", line)
        .map_err(|e| format!("Failed to append harness event: {}", e))
}

fn message_from_event(event: &HarnessEventInput) -> Result<crate::agent_thread::AgentThreadMessage, String> {
    let body = event
        .body
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("{} requires a non-empty body.", event.kind))?;
    let role = event
        .role
        .clone()
        .unwrap_or_else(|| {
            if event.kind == "approval.required" {
                "approval".to_string()
            } else {
                "agent".to_string()
            }
        });
    let title = event
        .title
        .clone()
        .unwrap_or_else(|| title_for_role(&role, &event.provider));
    let created_at = event
        .created_at
        .clone()
        .unwrap_or_else(crate::atomic::utc_now_iso);
    let mut metadata = event.metadata.clone();
    metadata.insert("provider".to_string(), event.provider.clone());
    metadata.insert("sourceEventId".to_string(), event.source_event_id.clone());
    if matches!(event.kind.as_str(), "message.completed" | "approval.required") {
        metadata.insert("isExactProviderMessage".to_string(), "true".to_string());
    }
    if let Some(model) = &event.model {
        metadata.insert("model".to_string(), model.clone());
    }
    if let Some(turn_id) = &event.turn_id {
        metadata.insert("turnId".to_string(), turn_id.clone());
    }
    if let Some(run_id) = &event.run_id {
        metadata.insert("runId".to_string(), run_id.clone());
    }
    if let Some(provider_session_id) = &event.provider_session_id {
        metadata.insert("providerSessionId".to_string(), provider_session_id.clone());
    }
    if let Some(provider_thread_id) = &event.provider_thread_id {
        metadata.insert("providerThreadId".to_string(), provider_thread_id.clone());
    }

    Ok(crate::agent_thread::AgentThreadMessage {
        id: format!("provider-{}", sanitize_id(&event.source_event_id)),
        role,
        kind: event.kind.replace('.', "-"),
        title,
        body: body.to_string(),
        created_at,
        metadata,
    })
}

fn title_for_role(role: &str, provider: &str) -> String {
    match role {
        "user" => "User".to_string(),
        "approval" => "Approval required".to_string(),
        "system" => "Harness".to_string(),
        _ => format!("{} agent", provider),
    }
}

fn queue_item_id_from_thread_id(thread_id: &str) -> Result<String, String> {
    queue_item_id_from_thread_id_value(thread_id)
        .ok_or_else(|| format!("Thread id is not queue-derived: {}", thread_id))
}

fn queue_item_id_from_thread_id_value(thread_id: &str) -> Option<String> {
    thread_id
        .strip_prefix("thread-")
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(String::from)
}

fn sanitize_id(id: &str) -> String {
    id.chars()
        .map(|ch| if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' { ch } else { '_' })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn context() -> CodexEventContext {
        CodexEventContext {
            queue_item_id: "queue-1".to_string(),
            brain_thread_id: "thread-queue-1".to_string(),
            provider_thread_id: "provider-thread-1".to_string(),
            provider_session_id: "provider-session-1".to_string(),
            model: "gpt-5-codex".to_string(),
        }
    }

    #[test]
    fn normalizes_codex_agent_message_completion() {
        let notification = json!({
            "method": "item/completed",
            "params": {
                "threadId": "provider-thread-1",
                "turnId": "turn-1",
                "completedAtMs": 1781548304000i64,
                "item": {
                    "type": "agentMessage",
                    "id": "item-1",
                    "text": "hello\nfrom codex",
                    "phase": null,
                    "memoryCitation": null
                }
            }
        });

        let event = codex_notification_to_harness_event(&context(), &notification)
            .expect("agent message completion should normalize");

        assert_eq!(event.kind, "message.completed");
        assert_eq!(event.source_event_id, "codex:provider-thread-1:turn-1:item-1");
        assert_eq!(event.provider, "codex");
        assert_eq!(event.model.as_deref(), Some("gpt-5-codex"));
        assert_eq!(event.queue_item_id.as_deref(), Some("queue-1"));
        assert_eq!(event.thread_id.as_deref(), Some("thread-queue-1"));
        assert_eq!(event.provider_session_id.as_deref(), Some("provider-session-1"));
        assert_eq!(event.provider_thread_id.as_deref(), Some("provider-thread-1"));
        assert_eq!(event.turn_id.as_deref(), Some("turn-1"));
        assert_eq!(event.role.as_deref(), Some("agent"));
        assert_eq!(event.body.as_deref(), Some("hello\nfrom codex"));
    }

    #[test]
    fn exact_provider_metadata_only_marks_message_events() {
        let message_event = HarnessEventInput {
            kind: "message.completed".to_string(),
            source_event_id: "provider:event:1".to_string(),
            provider: "codex".to_string(),
            model: Some("gpt-5-codex".to_string()),
            queue_item_id: Some("queue-1".to_string()),
            thread_id: Some("thread-queue-1".to_string()),
            run_id: Some("provider-session-1".to_string()),
            provider_session_id: Some("provider-session-1".to_string()),
            provider_thread_id: Some("provider-thread-1".to_string()),
            turn_id: Some("turn-1".to_string()),
            role: Some("agent".to_string()),
            title: Some("Codex".to_string()),
            body: Some("exact body".to_string()),
            created_at: Some("2026-06-15T00:00:00.000Z".to_string()),
            metadata: BTreeMap::new(),
        };
        let message = message_from_event(&message_event).expect("message event should render");
        assert_eq!(
            message.metadata.get("isExactProviderMessage").map(String::as_str),
            Some("true")
        );

        let mut lifecycle_event = message_event;
        lifecycle_event.kind = "session.completed".to_string();
        lifecycle_event.source_event_id = "provider:event:2".to_string();
        lifecycle_event.role = Some("system".to_string());
        lifecycle_event.title = Some("Harness".to_string());
        lifecycle_event.body = Some("stopped".to_string());
        let lifecycle_message = message_from_event(&lifecycle_event)
            .expect("lifecycle event should render");
        assert_eq!(
            lifecycle_message.metadata.get("isExactProviderMessage"),
            None
        );
    }

    #[test]
    fn extracts_codex_user_text_parts() {
        let item = json!({
            "type": "userMessage",
            "id": "user-1",
            "clientId": "client-1",
            "content": [
                { "type": "text", "text": "first", "text_elements": [] },
                { "type": "image", "url": "file:///tmp/a.png" },
                { "type": "text", "text": "second", "text_elements": [] }
            ]
        });

        assert_eq!(codex_user_message_body(&item).as_deref(), Some("first\nsecond"));
    }
}
