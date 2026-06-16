use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelProvider {
    pub runner_id: String,
    pub provider_id: String,
    pub api_style: String,
    pub api_key_env: String,
    pub default_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolSpec {
    pub name: String,
    pub title: String,
    pub description: String,
    pub approval_policy: String,
    pub input_schema: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelRuntimeContract {
    pub providers: Vec<DirectModelProvider>,
    pub request_shapes: Vec<DirectModelProviderRequestShape>,
    pub tools: Vec<DirectModelToolSpec>,
    pub event_kinds: Vec<String>,
    pub approval_required_tool_names: Vec<String>,
    pub pending_runtime: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelProviderRequestShape {
    pub runner_id: String,
    pub provider_id: String,
    pub api_style: String,
    pub method: String,
    pub endpoint_template: String,
    pub api_key_env: String,
    pub api_key_header: String,
    pub streaming: bool,
    pub tool_declaration_path: String,
    pub tool_result_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelProviderRequest {
    pub runner_id: String,
    pub provider_id: String,
    pub api_style: String,
    pub method: String,
    pub endpoint: String,
    pub api_key_env: String,
    pub headers: BTreeMap<String, String>,
    pub body: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelProviderStreamParseInput {
    pub runner_id: String,
    pub provider_id: String,
    pub api_style: String,
    pub model: String,
    pub raw_chunk: String,
    #[serde(default)]
    pub queue_item_id: Option<String>,
    #[serde(default)]
    pub thread_id: Option<String>,
    #[serde(default)]
    pub turn_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelProviderStreamParseResult {
    pub events: Vec<DirectModelTurnEvent>,
    pub done: bool,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub usage: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelHarnessEventPreview {
    pub events: Vec<crate::harness::HarnessEventInput>,
    pub skipped_events: usize,
    pub completed_messages: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelHarnessRecordResult {
    #[serde(default)]
    pub thread: Option<crate::agent_thread::AgentThread>,
    pub recorded_events: usize,
    pub skipped_events: usize,
    pub completed_messages: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelMessage {
    pub role: String,
    pub content: String,
    #[serde(default)]
    pub provider_message_id: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolCall {
    pub id: String,
    pub name: String,
    pub arguments: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolResult {
    pub tool_call_id: String,
    pub name: String,
    pub ok: bool,
    pub content: String,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolExecutionInput {
    pub execution_path: String,
    pub tool_call: DirectModelToolCall,
    #[serde(default)]
    pub approval_policy: Option<String>,
    #[serde(default)]
    pub queue_item_id: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub runner_id: Option<String>,
    #[serde(default)]
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolExecutionResult {
    pub tool_result: DirectModelToolResult,
    pub approval_required: bool,
    #[serde(default)]
    pub approval_kind: Option<String>,
    #[serde(default)]
    pub approval_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelToolApprovalResult {
    pub approval_request: crate::approval::ApprovalRequest,
    pub tool_execution_result: DirectModelToolExecutionResult,
    #[serde(default)]
    pub harness_event: Option<crate::harness::HarnessEventInput>,
    #[serde(default)]
    pub thread: Option<crate::agent_thread::AgentThread>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelTurnInput {
    pub runner_id: String,
    pub provider_id: String,
    pub api_style: String,
    pub model: String,
    pub queue_item_id: String,
    pub thread_id: String,
    pub execution_path: String,
    pub system_prompt: String,
    #[serde(default)]
    pub messages: Vec<DirectModelMessage>,
    #[serde(default)]
    pub tools: Vec<DirectModelToolSpec>,
    #[serde(default)]
    pub tool_results: Vec<DirectModelToolResult>,
    pub approval_policy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectModelTurnEvent {
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
    pub turn_id: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub tool_call: Option<DirectModelToolCall>,
    #[serde(default)]
    pub approval_request_id: Option<String>,
    #[serde(default)]
    pub metadata: BTreeMap<String, String>,
}

const DIRECT_MODEL_EVENT_KINDS: &[&str] = &[
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

pub fn is_direct_provider_runner(runner_id: &str) -> bool {
    matches!(runner_id, "direct-deepseek" | "direct-gemini")
}

pub fn pending_runtime_error(runner_id: &str) -> String {
    format!(
        "Direct model runner `{}` is cataloged, but the Brain Loop direct tool-loop runtime is not wired yet.",
        runner_id
    )
}

pub fn built_in_provider(runner_id: &str) -> Option<DirectModelProvider> {
    match runner_id {
        "direct-deepseek" => Some(DirectModelProvider {
            runner_id: runner_id.to_string(),
            provider_id: "deepseek".to_string(),
            api_style: "openai-chat".to_string(),
            api_key_env: "DEEPSEEK_API_KEY".to_string(),
            default_model: "deepseek-v4-pro".to_string(),
        }),
        "direct-gemini" => Some(DirectModelProvider {
            runner_id: runner_id.to_string(),
            provider_id: "gemini".to_string(),
            api_style: "gemini-generate-content".to_string(),
            api_key_env: "GEMINI_API_KEY".to_string(),
            default_model: "gemini-3.5-flash".to_string(),
        }),
        _ => None,
    }
}

pub fn built_in_providers() -> Vec<DirectModelProvider> {
    ["direct-deepseek", "direct-gemini"]
        .iter()
        .filter_map(|runner_id| built_in_provider(runner_id))
        .collect()
}

pub fn runtime_event_kinds() -> Vec<String> {
    DIRECT_MODEL_EVENT_KINDS
        .iter()
        .map(|kind| kind.to_string())
        .collect()
}

pub fn request_shapes() -> Vec<DirectModelProviderRequestShape> {
    vec![
        DirectModelProviderRequestShape {
            runner_id: "direct-deepseek".to_string(),
            provider_id: "deepseek".to_string(),
            api_style: "openai-chat".to_string(),
            method: "POST".to_string(),
            endpoint_template: "https://api.deepseek.com/chat/completions".to_string(),
            api_key_env: "DEEPSEEK_API_KEY".to_string(),
            api_key_header: "Authorization".to_string(),
            streaming: true,
            tool_declaration_path: "tools[].function".to_string(),
            tool_result_path: "messages[].tool_call_id".to_string(),
        },
        DirectModelProviderRequestShape {
            runner_id: "direct-gemini".to_string(),
            provider_id: "gemini".to_string(),
            api_style: "gemini-generate-content".to_string(),
            method: "POST".to_string(),
            endpoint_template: "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent".to_string(),
            api_key_env: "GEMINI_API_KEY".to_string(),
            api_key_header: "x-goog-api-key".to_string(),
            streaming: true,
            tool_declaration_path: "tools[].functionDeclarations".to_string(),
            tool_result_path: "contents[].parts[].functionResponse".to_string(),
        },
    ]
}

pub fn tool_specs() -> Vec<DirectModelToolSpec> {
    vec![
        DirectModelToolSpec {
            name: "read_file".to_string(),
            title: "Read file".to_string(),
            description: "Read a bounded UTF-8 text range from the task execution path.".to_string(),
            approval_policy: "never".to_string(),
            input_schema: json!({
                "type": "object",
                "required": ["path"],
                "properties": {
                    "path": { "type": "string" },
                    "startLine": { "type": "integer", "minimum": 1 },
                    "maxLines": { "type": "integer", "minimum": 1, "maximum": 400 }
                },
                "additionalProperties": false
            }),
        },
        DirectModelToolSpec {
            name: "search_text".to_string(),
            title: "Search text".to_string(),
            description: "Run a scoped text search under the task execution path.".to_string(),
            approval_policy: "never".to_string(),
            input_schema: json!({
                "type": "object",
                "required": ["pattern"],
                "properties": {
                    "pattern": { "type": "string" },
                    "path": { "type": "string" },
                    "literal": { "type": "boolean" },
                    "maxResults": { "type": "integer", "minimum": 1, "maximum": 200 }
                },
                "additionalProperties": false
            }),
        },
        DirectModelToolSpec {
            name: "apply_patch".to_string(),
            title: "Apply patch".to_string(),
            description: "Apply a unified patch inside the task execution path and record changed files.".to_string(),
            approval_policy: "on-risky-action".to_string(),
            input_schema: json!({
                "type": "object",
                "required": ["patch"],
                "properties": {
                    "patch": { "type": "string" },
                    "reason": { "type": "string" }
                },
                "additionalProperties": false
            }),
        },
        DirectModelToolSpec {
            name: "run_command".to_string(),
            title: "Run command".to_string(),
            description: "Run a bounded command from the task execution path through Brain Loop approvals.".to_string(),
            approval_policy: "always".to_string(),
            input_schema: json!({
                "type": "object",
                "required": ["command"],
                "properties": {
                    "command": { "type": "string" },
                    "timeoutSeconds": { "type": "integer", "minimum": 1, "maximum": 300 },
                    "reason": { "type": "string" }
                },
                "additionalProperties": false
            }),
        },
        DirectModelToolSpec {
            name: "finish_task".to_string(),
            title: "Finish task".to_string(),
            description: "End the direct model turn with a final summary and requested queue transition.".to_string(),
            approval_policy: "never".to_string(),
            input_schema: json!({
                "type": "object",
                "required": ["summary"],
                "properties": {
                    "summary": { "type": "string" },
                    "queueStatus": {
                        "type": "string",
                        "enum": ["submitted", "blocked", "reviewed-fix-request", "landing"]
                    },
                    "lastError": { "type": "string" }
                },
                "additionalProperties": false
            }),
        },
    ]
}

pub fn runtime_contract() -> DirectModelRuntimeContract {
    DirectModelRuntimeContract {
        providers: built_in_providers(),
        request_shapes: request_shapes(),
        tools: tool_specs(),
        event_kinds: runtime_event_kinds(),
        approval_required_tool_names: vec![
            "apply_patch".to_string(),
            "run_command".to_string(),
        ],
        pending_runtime: true,
    }
}

pub fn validate_turn_input(input: &DirectModelTurnInput) -> Result<DirectModelProvider, String> {
    let provider = built_in_provider(input.runner_id.as_str())
        .ok_or_else(|| format!("Unsupported direct model runner: {}", input.runner_id))?;
    if input.provider_id != provider.provider_id {
        return Err(format!(
            "Direct runner {} must use providerId {}.",
            input.runner_id, provider.provider_id
        ));
    }
    if input.api_style != provider.api_style {
        return Err(format!(
            "Direct runner {} must use apiStyle {}.",
            input.runner_id, provider.api_style
        ));
    }
    if input.model.trim().is_empty() {
        return Err("Direct model turn requires a model.".to_string());
    }
    if input.queue_item_id.trim().is_empty() {
        return Err("Direct model turn requires a queueItemId.".to_string());
    }
    if input.thread_id.trim().is_empty() {
        return Err("Direct model turn requires a threadId.".to_string());
    }
    if input.execution_path.trim().is_empty() {
        return Err("Direct model turn requires an executionPath.".to_string());
    }
    if input.system_prompt.trim().is_empty() {
        return Err("Direct model turn requires a systemPrompt.".to_string());
    }
    if !matches!(input.approval_policy.as_str(), "never" | "on-risky-action" | "always") {
        return Err(
            "Direct model approvalPolicy must be never, on-risky-action, or always.".to_string(),
        );
    }
    Ok(provider)
}

pub fn build_provider_request(
    input: &DirectModelTurnInput,
) -> Result<DirectModelProviderRequest, String> {
    let provider = validate_turn_input(input)?;
    match provider.api_style.as_str() {
        "openai-chat" => build_openai_chat_request(input, &provider),
        "gemini-generate-content" => build_gemini_generate_content_request(input, &provider),
        other => Err(format!("Direct model apiStyle is not implemented yet: {}", other)),
    }
}

pub fn parse_provider_stream_chunk(
    input: &DirectModelProviderStreamParseInput,
) -> Result<DirectModelProviderStreamParseResult, String> {
    let provider = validate_stream_parse_input(input)?;
    match provider.api_style.as_str() {
        "openai-chat" => parse_openai_chat_stream_chunk(input),
        "gemini-generate-content" => parse_gemini_generate_content_stream_chunk(input),
        other => Err(format!(
            "Direct model stream parsing is not implemented for apiStyle: {}",
            other
        )),
    }
}

pub fn preview_harness_events_from_direct_events(
    events: &[DirectModelTurnEvent],
) -> DirectModelHarnessEventPreview {
    let mut converted = Vec::new();
    let mut skipped_events = 0usize;
    let mut completed_messages = 0usize;
    let mut message_delta_body = String::new();
    let mut message_delta_count = 0usize;
    let mut last_message_delta: Option<DirectModelTurnEvent> = None;

    for event in events {
        if event.kind == "message.delta" {
            if let Some(body) = event.body.as_ref() {
                message_delta_body.push_str(body);
                message_delta_count += 1;
                last_message_delta = Some(event.clone());
            }
        }
        if event.kind == "turn.completed" && !message_delta_body.trim().is_empty() {
            let message_event = completed_message_event_from_deltas(
                &last_message_delta,
                event,
                &message_delta_body,
                message_delta_count,
            );
            converted.push(message_event);
            completed_messages += 1;
            message_delta_body.clear();
            message_delta_count = 0;
            last_message_delta = None;
        }
        match direct_turn_event_to_harness_event(event) {
            Some(harness_event) => {
                if harness_event.kind == "message.completed" {
                    completed_messages += 1;
                }
                converted.push(harness_event);
            }
            None => skipped_events += 1,
        }
    }

    DirectModelHarnessEventPreview {
        events: converted,
        skipped_events,
        completed_messages,
    }
}

pub fn record_harness_events_from_direct_events(
    app: AppHandle,
    events: &[DirectModelTurnEvent],
) -> Result<DirectModelHarnessRecordResult, String> {
    let preview = preview_harness_events_from_direct_events(events);
    let mut last_thread = None;
    let mut recorded_events = 0usize;

    for event in preview.events {
        let thread = crate::harness::record_harness_event(app.clone(), event)?;
        last_thread = Some(thread);
        recorded_events += 1;
    }

    Ok(DirectModelHarnessRecordResult {
        thread: last_thread,
        recorded_events,
        skipped_events: preview.skipped_events,
        completed_messages: preview.completed_messages,
    })
}

pub fn execute_tool(input: &DirectModelToolExecutionInput) -> DirectModelToolExecutionResult {
    match input.tool_call.name.as_str() {
        "read_file" => execute_read_file(input),
        "search_text" => execute_search_text(input),
        "finish_task" => execute_finish_task(input),
        "apply_patch" => approval_required_result(
            input,
            "destructive",
            "Applying patches requires Brain Loop approval before direct-provider tool execution.",
        ),
        "run_command" => approval_required_result(
            input,
            "command",
            "Running commands requires Brain Loop approval before direct-provider tool execution.",
        ),
        other => error_tool_result(input, format!("Unsupported direct model tool: {}", other)),
    }
}

pub fn request_tool_approval(
    app: AppHandle,
    input: DirectModelToolExecutionInput,
) -> Result<DirectModelToolApprovalResult, String> {
    let (kind, risk) = approval_kind_and_risk(&input.tool_call.name).ok_or_else(|| {
        format!(
            "Direct model tool {} does not require approval.",
            input.tool_call.name
        )
    })?;
    let state = app.state::<crate::approval::ApprovalState>();
    let reason = argument_string(&input.tool_call.arguments, "reason")
        .unwrap_or_else(|| format!("Direct model requested {}.", input.tool_call.name));
    let command = format!("direct-model:{}", input.tool_call.name);
    let approval_request = crate::approval::request_approval(
        app.clone(),
        state,
        crate::approval::ApprovalRequestInput {
            kind: kind.to_string(),
            title: format!("Approve direct model tool: {}", input.tool_call.name),
            description: format!(
                "{}\nTool call id: {}\nExecution path: {}",
                reason, input.tool_call.id, input.execution_path
            ),
            risk: risk.to_string(),
            command: Some(command),
            path: Some(input.execution_path.clone()),
            queue_item_id: input.queue_item_id.clone(),
            project_id: input.project_id.clone(),
            runner_id: input.runner_id.clone(),
            session_id: input.session_id.clone(),
            requested_by: Some("direct-model-runtime".to_string()),
        },
    )?;
    let mut tool_execution_result = approval_required_result(&input, kind, risk);
    tool_execution_result
        .tool_result
        .metadata
        .insert("approvalRequestId".to_string(), approval_request.id.clone());
    let harness_event = direct_tool_approval_harness_event(&input, &approval_request);
    let thread = if input.queue_item_id.is_some() {
        Some(crate::harness::record_harness_event(
            app,
            harness_event.clone(),
        )?)
    } else {
        None
    };

    Ok(DirectModelToolApprovalResult {
        approval_request,
        tool_execution_result,
        harness_event: Some(harness_event),
        thread,
    })
}

fn direct_tool_approval_harness_event(
    input: &DirectModelToolExecutionInput,
    approval_request: &crate::approval::ApprovalRequest,
) -> crate::harness::HarnessEventInput {
    let mut metadata = BTreeMap::new();
    metadata.insert("approvalRequestId".to_string(), approval_request.id.clone());
    metadata.insert("toolCallId".to_string(), input.tool_call.id.clone());
    metadata.insert("toolName".to_string(), input.tool_call.name.clone());
    metadata.insert("directProvider".to_string(), input.runner_id.clone().unwrap_or_else(|| "direct-model".to_string()));
    if let Ok(arguments) = serde_json::to_string(&input.tool_call.arguments) {
        metadata.insert("toolArguments".to_string(), arguments);
    }

    crate::harness::HarnessEventInput {
        kind: "approval.required".to_string(),
        source_event_id: format!("direct-model:{}:approval.required", approval_request.id),
        provider: input.runner_id.clone().unwrap_or_else(|| "direct-model".to_string()),
        model: None,
        queue_item_id: input.queue_item_id.clone(),
        thread_id: input.queue_item_id.as_ref().map(|id| format!("thread-{}", id)),
        run_id: None,
        provider_session_id: input.session_id.clone(),
        provider_thread_id: input.queue_item_id.as_ref().map(|id| format!("thread-{}", id)),
        turn_id: None,
        role: Some("approval".to_string()),
        title: Some(approval_request.title.clone()),
        body: Some(approval_request.description.clone()),
        created_at: Some(approval_request.requested_at.clone()),
        metadata,
    }
}

fn approval_kind_and_risk(tool_name: &str) -> Option<(&'static str, &'static str)> {
    match tool_name {
        "apply_patch" => Some((
            "destructive",
            "Approving allows the direct model runtime to apply file changes in the task execution path.",
        )),
        "run_command" => Some((
            "command",
            "Approving allows the direct model runtime to run a bounded command in the task execution path.",
        )),
        _ => None,
    }
}

fn execute_read_file(input: &DirectModelToolExecutionInput) -> DirectModelToolExecutionResult {
    let root = match canonical_execution_root(&input.execution_path) {
        Ok(root) => root,
        Err(error) => return error_tool_result(input, error),
    };
    let raw_path = match argument_string(&input.tool_call.arguments, "path") {
        Some(path) => path,
        None => return error_tool_result(input, "read_file requires path.".to_string()),
    };
    let path = match safe_existing_path(&root, &raw_path) {
        Ok(path) => path,
        Err(error) => return error_tool_result(input, error),
    };
    if !path.is_file() {
        return error_tool_result(input, format!("read_file path is not a file: {}", raw_path));
    }
    if let Ok(metadata) = fs::metadata(&path) {
        if metadata.len() > 2_000_000 {
            return error_tool_result(input, "read_file refuses files larger than 2MB.".to_string());
        }
    }
    let content = match fs::read_to_string(&path) {
        Ok(content) => content,
        Err(error) => return error_tool_result(input, format!("Failed to read file: {}", error)),
    };
    let start_line = argument_usize(&input.tool_call.arguments, "startLine")
        .unwrap_or(1)
        .max(1);
    let max_lines = argument_usize(&input.tool_call.arguments, "maxLines")
        .unwrap_or(200)
        .clamp(1, 400);
    let lines: Vec<String> = content
        .lines()
        .enumerate()
        .skip(start_line.saturating_sub(1))
        .take(max_lines)
        .map(|(index, line)| format!("{}: {}", index + 1, line))
        .collect();
    let mut metadata = BTreeMap::new();
    metadata.insert("path".to_string(), display_relative_path(&root, &path));
    metadata.insert("startLine".to_string(), start_line.to_string());
    metadata.insert("lineCount".to_string(), lines.len().to_string());
    ok_tool_result(input, lines.join("\n"), metadata)
}

fn execute_search_text(input: &DirectModelToolExecutionInput) -> DirectModelToolExecutionResult {
    let root = match canonical_execution_root(&input.execution_path) {
        Ok(root) => root,
        Err(error) => return error_tool_result(input, error),
    };
    let pattern = match argument_string(&input.tool_call.arguments, "pattern") {
        Some(pattern) if !pattern.is_empty() => pattern,
        _ => return error_tool_result(input, "search_text requires pattern.".to_string()),
    };
    let raw_path = argument_string(&input.tool_call.arguments, "path")
        .unwrap_or_else(|| ".".to_string());
    let search_root = match safe_existing_path(&root, &raw_path) {
        Ok(path) => path,
        Err(error) => return error_tool_result(input, error),
    };
    let max_results = argument_usize(&input.tool_call.arguments, "maxResults")
        .unwrap_or(50)
        .clamp(1, 200);
    let mut matches = Vec::new();
    search_path_for_pattern(&root, &search_root, &pattern, max_results, &mut matches);
    let mut metadata = BTreeMap::new();
    metadata.insert("path".to_string(), display_relative_path(&root, &search_root));
    metadata.insert("pattern".to_string(), pattern);
    metadata.insert("resultCount".to_string(), matches.len().to_string());
    metadata.insert("truncated".to_string(), (matches.len() >= max_results).to_string());
    ok_tool_result(input, matches.join("\n"), metadata)
}

fn execute_finish_task(input: &DirectModelToolExecutionInput) -> DirectModelToolExecutionResult {
    let summary = argument_string(&input.tool_call.arguments, "summary")
        .unwrap_or_else(|| "Direct model requested task completion.".to_string());
    let mut metadata = BTreeMap::new();
    if let Some(status) = argument_string(&input.tool_call.arguments, "queueStatus") {
        metadata.insert("requestedQueueStatus".to_string(), status);
    }
    ok_tool_result(input, summary, metadata)
}

fn search_path_for_pattern(
    root: &Path,
    path: &Path,
    pattern: &str,
    max_results: usize,
    matches: &mut Vec<String>,
) {
    if matches.len() >= max_results || should_skip_search_path(path) {
        return;
    }
    if path.is_file() {
        search_file_for_pattern(root, path, pattern, max_results, matches);
        return;
    }
    let Ok(entries) = fs::read_dir(path) else {
        return;
    };
    for entry in entries.flatten() {
        if matches.len() >= max_results {
            break;
        }
        search_path_for_pattern(root, &entry.path(), pattern, max_results, matches);
    }
}

fn search_file_for_pattern(
    root: &Path,
    path: &Path,
    pattern: &str,
    max_results: usize,
    matches: &mut Vec<String>,
) {
    if let Ok(metadata) = fs::metadata(path) {
        if metadata.len() > 1_000_000 {
            return;
        }
    }
    let Ok(content) = fs::read_to_string(path) else {
        return;
    };
    for (index, line) in content.lines().enumerate() {
        if matches.len() >= max_results {
            break;
        }
        if line.contains(pattern) {
            matches.push(format!(
                "{}:{}: {}",
                display_relative_path(root, path),
                index + 1,
                line
            ));
        }
    }
}

fn should_skip_search_path(path: &Path) -> bool {
    let Some(name) = path.file_name().and_then(|name| name.to_str()) else {
        return false;
    };
    matches!(
        name,
        ".git" | "node_modules" | "dist" | "build" | ".next" | "target" | "coverage"
    )
}

fn canonical_execution_root(execution_path: &str) -> Result<PathBuf, String> {
    let trimmed = execution_path.trim();
    if trimmed.is_empty() {
        return Err("Direct model tool execution requires executionPath.".to_string());
    }
    let root = PathBuf::from(trimmed)
        .canonicalize()
        .map_err(|e| format!("Failed to resolve executionPath: {}", e))?;
    if !root.is_dir() {
        return Err("Direct model executionPath must be a directory.".to_string());
    }
    Ok(root)
}

fn safe_existing_path(root: &Path, raw_path: &str) -> Result<PathBuf, String> {
    let relative = Path::new(raw_path);
    if relative.is_absolute() {
        return Err("Direct model tool paths must be relative to executionPath.".to_string());
    }
    let path = root
        .join(relative)
        .canonicalize()
        .map_err(|e| format!("Failed to resolve direct model tool path: {}", e))?;
    if !path.starts_with(root) {
        return Err("Direct model tool path escapes executionPath.".to_string());
    }
    Ok(path)
}

fn argument_string(arguments: &Value, key: &str) -> Option<String> {
    arguments
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(String::from)
}

fn argument_usize(arguments: &Value, key: &str) -> Option<usize> {
    arguments
        .get(key)
        .and_then(Value::as_u64)
        .and_then(|value| usize::try_from(value).ok())
}

fn display_relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string()
}

fn ok_tool_result(
    input: &DirectModelToolExecutionInput,
    content: String,
    metadata: BTreeMap<String, String>,
) -> DirectModelToolExecutionResult {
    DirectModelToolExecutionResult {
        tool_result: DirectModelToolResult {
            tool_call_id: input.tool_call.id.clone(),
            name: input.tool_call.name.clone(),
            ok: true,
            content,
            metadata,
        },
        approval_required: false,
        approval_kind: None,
        approval_reason: None,
    }
}

fn error_tool_result(
    input: &DirectModelToolExecutionInput,
    content: String,
) -> DirectModelToolExecutionResult {
    DirectModelToolExecutionResult {
        tool_result: DirectModelToolResult {
            tool_call_id: input.tool_call.id.clone(),
            name: input.tool_call.name.clone(),
            ok: false,
            content,
            metadata: BTreeMap::new(),
        },
        approval_required: false,
        approval_kind: None,
        approval_reason: None,
    }
}

fn approval_required_result(
    input: &DirectModelToolExecutionInput,
    approval_kind: &str,
    reason: &str,
) -> DirectModelToolExecutionResult {
    DirectModelToolExecutionResult {
        tool_result: DirectModelToolResult {
            tool_call_id: input.tool_call.id.clone(),
            name: input.tool_call.name.clone(),
            ok: false,
            content: reason.to_string(),
            metadata: BTreeMap::new(),
        },
        approval_required: true,
        approval_kind: Some(approval_kind.to_string()),
        approval_reason: Some(reason.to_string()),
    }
}

fn completed_message_event_from_deltas(
    last_delta: &Option<DirectModelTurnEvent>,
    completion_event: &DirectModelTurnEvent,
    body: &str,
    delta_count: usize,
) -> crate::harness::HarnessEventInput {
    let source = last_delta.as_ref().unwrap_or(completion_event);
    let mut metadata = completion_event.metadata.clone();
    metadata.insert("directProvider".to_string(), completion_event.provider.clone());
    metadata.insert("synthesizedFrom".to_string(), "message.delta".to_string());
    metadata.insert("deltaEventCount".to_string(), delta_count.to_string());
    crate::harness::HarnessEventInput {
        kind: "message.completed".to_string(),
        source_event_id: format!("{}:message.completed", completion_event.source_event_id),
        provider: completion_event.provider.clone(),
        model: completion_event.model.clone().or_else(|| source.model.clone()),
        queue_item_id: completion_event
            .queue_item_id
            .clone()
            .or_else(|| source.queue_item_id.clone()),
        thread_id: completion_event
            .thread_id
            .clone()
            .or_else(|| source.thread_id.clone()),
        run_id: None,
        provider_session_id: None,
        provider_thread_id: completion_event
            .thread_id
            .clone()
            .or_else(|| source.thread_id.clone()),
        turn_id: completion_event.turn_id.clone().or_else(|| source.turn_id.clone()),
        role: Some("agent".to_string()),
        title: Some("Direct model message".to_string()),
        body: Some(body.to_string()),
        created_at: None,
        metadata,
    }
}

fn direct_turn_event_to_harness_event(
    event: &DirectModelTurnEvent,
) -> Option<crate::harness::HarnessEventInput> {
    let kind = match event.kind.as_str() {
        "message.delta" => "message.delta",
        "message.completed" => "message.completed",
        "tool.started" => "tool.started",
        "tool.completed" => "tool.completed",
        "approval.required" => "approval.required",
        "file.changed" => "file.changed",
        "run.log" => "run.log",
        "turn.started" => "turn.started",
        "turn.completed" => "turn.completed",
        "session.failed" => "session.failed",
        "session.completed" => "session.completed",
        "session.started" => "session.started",
        _ => return None,
    };
    let mut metadata = event.metadata.clone();
    metadata.insert("directProvider".to_string(), event.provider.clone());
    if let Some(tool_call) = event.tool_call.as_ref() {
        metadata.insert("toolCallId".to_string(), tool_call.id.clone());
        metadata.insert("toolName".to_string(), tool_call.name.clone());
        if let Ok(arguments) = serde_json::to_string(&tool_call.arguments) {
            metadata.insert("toolArguments".to_string(), arguments);
        }
    }
    if let Some(approval_request_id) = event.approval_request_id.as_ref() {
        metadata.insert("approvalRequestId".to_string(), approval_request_id.clone());
    }

    Some(crate::harness::HarnessEventInput {
        kind: kind.to_string(),
        source_event_id: event.source_event_id.clone(),
        provider: event.provider.clone(),
        model: event.model.clone(),
        queue_item_id: event.queue_item_id.clone(),
        thread_id: event.thread_id.clone(),
        run_id: None,
        provider_session_id: None,
        provider_thread_id: event.thread_id.clone(),
        turn_id: event.turn_id.clone(),
        role: event.role.clone(),
        title: title_for_direct_event(event),
        body: body_for_direct_event(event),
        created_at: None,
        metadata,
    })
}

fn title_for_direct_event(event: &DirectModelTurnEvent) -> Option<String> {
    match event.kind.as_str() {
        "message.delta" => Some("Direct model message delta".to_string()),
        "message.completed" => Some("Direct model message".to_string()),
        "tool.started" => event
            .tool_call
            .as_ref()
            .map(|tool_call| format!("Tool call: {}", tool_call.name))
            .or_else(|| Some("Direct model tool call".to_string())),
        "tool.completed" => Some("Direct model tool completed".to_string()),
        "approval.required" => Some("Direct model approval required".to_string()),
        "turn.completed" => Some("Direct model turn completed".to_string()),
        "session.failed" => Some("Direct model session failed".to_string()),
        "session.completed" => Some("Direct model session completed".to_string()),
        "session.started" => Some("Direct model session started".to_string()),
        _ => None,
    }
}

fn body_for_direct_event(event: &DirectModelTurnEvent) -> Option<String> {
    event
        .body
        .clone()
        .or_else(|| event.tool_call.as_ref().map(|tool_call| tool_call.name.clone()))
        .or_else(|| event.metadata.get("finishReason").cloned())
}

fn validate_stream_parse_input(
    input: &DirectModelProviderStreamParseInput,
) -> Result<DirectModelProvider, String> {
    let provider = built_in_provider(input.runner_id.as_str())
        .ok_or_else(|| format!("Unsupported direct model runner: {}", input.runner_id))?;
    if input.provider_id != provider.provider_id {
        return Err(format!(
            "Direct runner {} must use providerId {}.",
            input.runner_id, provider.provider_id
        ));
    }
    if input.api_style != provider.api_style {
        return Err(format!(
            "Direct runner {} must use apiStyle {}.",
            input.runner_id, provider.api_style
        ));
    }
    if input.model.trim().is_empty() {
        return Err("Direct model stream parse requires a model.".to_string());
    }
    if input.raw_chunk.trim().is_empty() {
        return Err("Direct model stream parse requires a rawChunk.".to_string());
    }
    Ok(provider)
}

fn parse_openai_chat_stream_chunk(
    input: &DirectModelProviderStreamParseInput,
) -> Result<DirectModelProviderStreamParseResult, String> {
    let mut events = Vec::new();
    let mut done = false;
    let mut usage = BTreeMap::new();

    for payload in openai_sse_payloads(&input.raw_chunk) {
        if payload == "[DONE]" {
            done = true;
            continue;
        }
        let value = serde_json::from_str::<Value>(&payload)
            .map_err(|e| format!("Failed to parse OpenAI chat stream chunk: {}", e))?;
        if let Some(usage_value) = value.get("usage").filter(|value| !value.is_null()) {
            flatten_usage("", usage_value, &mut usage);
        }
        let source_prefix = value
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or("deepseek-stream");
        let model = value
            .get("model")
            .and_then(Value::as_str)
            .unwrap_or(input.model.as_str());

        for (choice_index, choice) in value
            .get("choices")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .enumerate()
        {
            let finish_reason = choice.get("finish_reason").and_then(Value::as_str);
            let delta = choice.get("delta").unwrap_or(&Value::Null);
            if let Some(content) = delta
                .get("content")
                .and_then(Value::as_str)
                .filter(|value| !value.is_empty())
            {
                let event_index = events.len();
                events.push(stream_event(
                    input,
                    "message.delta",
                    source_prefix,
                    event_index,
                    Some("agent"),
                    Some(content),
                    None,
                    model,
                    BTreeMap::new(),
                ));
            }
            if let Some(tool_calls) = delta.get("tool_calls").and_then(Value::as_array) {
                for (tool_index, tool_call) in tool_calls.iter().enumerate() {
                    let name = tool_call
                        .get("function")
                        .and_then(|function| function.get("name"))
                        .and_then(Value::as_str)
                        .unwrap_or("partial_tool_call");
                    let arguments_delta = tool_call
                        .get("function")
                        .and_then(|function| function.get("arguments"))
                        .and_then(Value::as_str)
                        .unwrap_or("");
                    let id = tool_call
                        .get("id")
                        .and_then(Value::as_str)
                        .map(str::to_string)
                        .unwrap_or_else(|| {
                            format!("{}-tool-{}-{}", source_prefix, choice_index, tool_index)
                        });
                    let mut metadata = BTreeMap::new();
                    metadata.insert("argumentsDelta".to_string(), arguments_delta.to_string());
                    metadata.insert("choiceIndex".to_string(), choice_index.to_string());
                    let event_index = events.len();
                    events.push(stream_event(
                        input,
                        "tool.started",
                        source_prefix,
                        event_index,
                        Some("agent"),
                        Some(name),
                        Some(DirectModelToolCall {
                            id,
                            name: name.to_string(),
                            arguments: json!({ "argumentsDelta": arguments_delta }),
                        }),
                        model,
                        metadata,
                    ));
                }
            }
            if let Some(reason) = finish_reason {
                let mut metadata = BTreeMap::new();
                metadata.insert("finishReason".to_string(), reason.to_string());
                let event_index = events.len();
                events.push(stream_event(
                    input,
                    if reason == "tool_calls" {
                        "tool.completed"
                    } else {
                        "turn.completed"
                    },
                    source_prefix,
                    event_index,
                    Some("agent"),
                    Some(reason),
                    None,
                    model,
                    metadata,
                ));
                done = true;
            }
        }
    }

    Ok(DirectModelProviderStreamParseResult { events, done, usage })
}

fn parse_gemini_generate_content_stream_chunk(
    input: &DirectModelProviderStreamParseInput,
) -> Result<DirectModelProviderStreamParseResult, String> {
    let value = serde_json::from_str::<Value>(input.raw_chunk.trim())
        .map_err(|e| format!("Failed to parse Gemini stream chunk: {}", e))?;
    let mut events = Vec::new();
    let mut done = false;
    let mut usage = BTreeMap::new();
    if let Some(usage_value) = value.get("usageMetadata") {
        flatten_usage("", usage_value, &mut usage);
    }

    for (candidate_index, candidate) in value
        .get("candidates")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .enumerate()
    {
        let source_prefix = format!(
            "gemini:{}:{}",
            input.turn_id.as_deref().unwrap_or("turn"),
            candidate_index
        );
        let parts = candidate
            .get("content")
            .and_then(|content| content.get("parts"))
            .and_then(Value::as_array);
        if let Some(parts) = parts {
            for (part_index, part) in parts.iter().enumerate() {
                if let Some(text) = part
                    .get("text")
                    .and_then(Value::as_str)
                    .filter(|value| !value.is_empty())
                {
                    let event_index = events.len();
                    events.push(stream_event(
                        input,
                        "message.delta",
                        &source_prefix,
                        event_index,
                        Some("agent"),
                        Some(text),
                        None,
                        input.model.as_str(),
                        BTreeMap::new(),
                    ));
                }
                if let Some(function_call) = part.get("functionCall") {
                    let name = function_call
                        .get("name")
                        .and_then(Value::as_str)
                        .unwrap_or("function_call");
                    let arguments = function_call
                        .get("args")
                        .cloned()
                        .unwrap_or_else(|| json!({}));
                    let id = function_call
                        .get("id")
                        .and_then(Value::as_str)
                        .map(str::to_string)
                        .unwrap_or_else(|| format!("{}-tool-{}", source_prefix, part_index));
                    let event_index = events.len();
                    events.push(stream_event(
                        input,
                        "tool.started",
                        &source_prefix,
                        event_index,
                        Some("agent"),
                        Some(name),
                        Some(DirectModelToolCall {
                            id,
                            name: name.to_string(),
                            arguments,
                        }),
                        input.model.as_str(),
                        BTreeMap::new(),
                    ));
                }
            }
        }
        if let Some(reason) = candidate.get("finishReason").and_then(Value::as_str) {
            let mut metadata = BTreeMap::new();
            metadata.insert("finishReason".to_string(), reason.to_string());
            let event_index = events.len();
            events.push(stream_event(
                input,
                "turn.completed",
                &source_prefix,
                event_index,
                Some("agent"),
                Some(reason),
                None,
                input.model.as_str(),
                metadata,
            ));
            done = reason != "FINISH_REASON_UNSPECIFIED";
        }
    }

    Ok(DirectModelProviderStreamParseResult { events, done, usage })
}

fn openai_sse_payloads(raw_chunk: &str) -> Vec<String> {
    let mut payloads = Vec::new();
    for line in raw_chunk.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with(':') {
            continue;
        }
        if let Some(data) = trimmed.strip_prefix("data:") {
            let payload = data.trim();
            if !payload.is_empty() {
                payloads.push(payload.to_string());
            }
        } else if trimmed.starts_with('{') || trimmed == "[DONE]" {
            payloads.push(trimmed.to_string());
        }
    }
    if payloads.is_empty() {
        let trimmed = raw_chunk.trim();
        if !trimmed.is_empty() {
            payloads.push(trimmed.to_string());
        }
    }
    payloads
}

fn stream_event(
    input: &DirectModelProviderStreamParseInput,
    kind: &str,
    source_prefix: &str,
    index: usize,
    role: Option<&str>,
    body: Option<&str>,
    tool_call: Option<DirectModelToolCall>,
    model: &str,
    mut metadata: BTreeMap<String, String>,
) -> DirectModelTurnEvent {
    metadata.insert("apiStyle".to_string(), input.api_style.clone());
    DirectModelTurnEvent {
        kind: kind.to_string(),
        source_event_id: format!("{}:{}:{}", input.provider_id, source_prefix, index),
        provider: input.runner_id.clone(),
        model: Some(model.to_string()),
        queue_item_id: input.queue_item_id.clone(),
        thread_id: input.thread_id.clone(),
        turn_id: input.turn_id.clone(),
        role: role.map(str::to_string),
        body: body.map(str::to_string),
        tool_call,
        approval_request_id: None,
        metadata,
    }
}

fn flatten_usage(prefix: &str, value: &Value, usage: &mut BTreeMap<String, String>) {
    match value {
        Value::Object(map) => {
            for (key, child) in map {
                let next_prefix = if prefix.is_empty() {
                    key.to_string()
                } else {
                    format!("{}.{}", prefix, key)
                };
                flatten_usage(&next_prefix, child, usage);
            }
        }
        Value::Array(values) => {
            usage.insert(prefix.to_string(), values.len().to_string());
        }
        Value::String(text) => {
            usage.insert(prefix.to_string(), text.clone());
        }
        Value::Number(number) => {
            usage.insert(prefix.to_string(), number.to_string());
        }
        Value::Bool(value) => {
            usage.insert(prefix.to_string(), value.to_string());
        }
        Value::Null => {}
    }
}

fn build_openai_chat_request(
    input: &DirectModelTurnInput,
    provider: &DirectModelProvider,
) -> Result<DirectModelProviderRequest, String> {
    let mut messages = Vec::new();
    messages.push(json!({
        "role": "system",
        "content": input.system_prompt.as_str(),
    }));
    for message in &input.messages {
        let role = normalize_openai_role(&message.role)?;
        messages.push(json!({
            "role": role,
            "content": message.content.as_str(),
        }));
    }
    for result in &input.tool_results {
        messages.push(json!({
            "role": "tool",
            "tool_call_id": result.tool_call_id.as_str(),
            "content": result.content.as_str(),
        }));
    }

    let tools: Vec<Value> = input
        .tools
        .iter()
        .map(|tool| {
            json!({
                "type": "function",
                "function": {
                    "name": tool.name.as_str(),
                    "description": tool.description.as_str(),
                    "parameters": tool.input_schema.clone(),
                },
            })
        })
        .collect();
    let tool_choice = if tools.is_empty() { "none" } else { "auto" };

    let mut headers = BTreeMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    headers.insert(
        "Authorization".to_string(),
        format!("Bearer ${{{}}}", provider.api_key_env),
    );

    Ok(DirectModelProviderRequest {
        runner_id: provider.runner_id.clone(),
        provider_id: provider.provider_id.clone(),
        api_style: provider.api_style.clone(),
        method: "POST".to_string(),
        endpoint: "https://api.deepseek.com/chat/completions".to_string(),
        api_key_env: provider.api_key_env.clone(),
        headers,
        body: json!({
            "model": input.model.as_str(),
            "messages": messages,
            "tools": tools,
            "tool_choice": tool_choice,
            "stream": true,
            "stream_options": { "include_usage": true },
        }),
    })
}

fn build_gemini_generate_content_request(
    input: &DirectModelTurnInput,
    provider: &DirectModelProvider,
) -> Result<DirectModelProviderRequest, String> {
    let mut contents = Vec::new();
    for message in &input.messages {
        if message.role == "system" {
            continue;
        }
        contents.push(gemini_content_from_message(message)?);
    }
    for result in &input.tool_results {
        contents.push(json!({
            "role": "user",
            "parts": [{
                "functionResponse": {
                    "name": result.name.as_str(),
                    "response": {
                        "ok": result.ok,
                        "content": result.content.as_str(),
                        "toolCallId": result.tool_call_id.as_str(),
                    },
                },
            }],
        }));
    }

    let function_declarations: Vec<Value> = input
        .tools
        .iter()
        .map(|tool| {
            json!({
                "name": tool.name.as_str(),
                "description": tool.description.as_str(),
                "parameters": tool.input_schema.clone(),
            })
        })
        .collect();
    let function_calling_mode = if function_declarations.is_empty() {
        "NONE"
    } else {
        "AUTO"
    };

    let mut headers = BTreeMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    headers.insert(
        "x-goog-api-key".to_string(),
        format!("${{{}}}", provider.api_key_env),
    );

    let endpoint = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent",
        input.model
    );

    Ok(DirectModelProviderRequest {
        runner_id: provider.runner_id.clone(),
        provider_id: provider.provider_id.clone(),
        api_style: provider.api_style.clone(),
        method: "POST".to_string(),
        endpoint,
        api_key_env: provider.api_key_env.clone(),
        headers,
        body: json!({
            "systemInstruction": {
                "parts": [{ "text": input.system_prompt.as_str() }],
            },
            "contents": contents,
            "tools": [{
                "functionDeclarations": function_declarations,
            }],
            "toolConfig": {
                "functionCallingConfig": {
                    "mode": function_calling_mode,
                },
            },
        }),
    })
}

fn normalize_openai_role(role: &str) -> Result<&'static str, String> {
    match role {
        "system" => Ok("system"),
        "user" => Ok("user"),
        "assistant" => Ok("assistant"),
        "tool" => Ok("tool"),
        other => Err(format!("Unsupported OpenAI chat message role: {}", other)),
    }
}

fn gemini_content_from_message(message: &DirectModelMessage) -> Result<Value, String> {
    let role = match message.role.as_str() {
        "user" | "tool" => "user",
        "assistant" => "model",
        other => return Err(format!("Unsupported Gemini content role: {}", other)),
    };
    Ok(json!({
        "role": role,
        "parts": [{ "text": message.content.as_str() }],
    }))
}

#[tauri::command]
pub fn list_direct_model_runtime_contract() -> DirectModelRuntimeContract {
    runtime_contract()
}

#[tauri::command]
pub fn preview_direct_model_provider_request(
    input: DirectModelTurnInput,
) -> Result<DirectModelProviderRequest, String> {
    build_provider_request(&input)
}

#[tauri::command]
pub fn preview_direct_model_stream_events(
    input: DirectModelProviderStreamParseInput,
) -> Result<DirectModelProviderStreamParseResult, String> {
    parse_provider_stream_chunk(&input)
}

#[tauri::command]
pub fn preview_direct_model_harness_events(
    events: Vec<DirectModelTurnEvent>,
) -> DirectModelHarnessEventPreview {
    preview_harness_events_from_direct_events(&events)
}

#[tauri::command]
pub fn record_direct_model_harness_events(
    app: AppHandle,
    events: Vec<DirectModelTurnEvent>,
) -> Result<DirectModelHarnessRecordResult, String> {
    record_harness_events_from_direct_events(app, &events)
}

#[tauri::command]
pub fn execute_direct_model_tool(
    input: DirectModelToolExecutionInput,
) -> DirectModelToolExecutionResult {
    execute_tool(&input)
}

#[tauri::command]
pub fn request_direct_model_tool_approval(
    app: AppHandle,
    input: DirectModelToolExecutionInput,
) -> Result<DirectModelToolApprovalResult, String> {
    request_tool_approval(app, input)
}
