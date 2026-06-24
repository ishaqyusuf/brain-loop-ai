# API Contracts

## Purpose

Tracks contracts between React, Rust, Brain state files, and runner CLIs.

## Contract Rules

- React calls Tauri commands.
- Rust returns typed JSON responses.
- Rust emits events for live state changes.
- Queue item JSON remains compatible with Brain project manager skills.
- Settings are stored on disk as TOML while Tauri command responses remain typed JSON over `invoke`.

## Global Brain State Contract

Brain Loop treats this directory as the durable workflow source of truth:

```text
~/.brain-loop/
  settings.toml
  projects.json
  approvals.json
  workspaces.json
  project-brains/<project-id>/brain/
  orchestrations/*.json
  queues/handoffs/*.json
  threads/*.json
  harness/events/*.jsonl
  worktrees/
  locks/
  logs/
```

On first use, Brain Loop prepares `~/.brain-loop` and copies missing non-worktree state from legacy `~/.codex/brain-project-manager`. Legacy `settings.json` is converted to `settings.toml`; legacy Git worktrees are not moved automatically.

Queue item statuses must remain compatible with the Brain handoff contract:

- `queued`
- `picked`
- `started`
- `stale-started`
- `submitted`
- `reviewing`
- `reviewed-fix-request`
- `landing`
- `blocked`
- `approved`

Runner agents must remain compatible with:

- `open-code`
- `antigravity`
- `codex`
- `direct-deepseek`
- `direct-gemini`

## Implemented Shared Contracts

### `@brain-loop/brain-core` (`packages/brain-core/src/`)

#### Types (`types.ts`)

| Type | Covers |
|------|--------|
| `Priority` | `"high" \| "medium" \| "low"` |
| `ProjectAgent` | `"open-code" \| "antigravity" \| "codex" \| "direct-deepseek" \| "direct-gemini"` |
| `QueueStatus` | `"queued" \| "picked" \| "started" \| "stale-started" \| "submitted" \| "reviewing" \| "blocked" \| "reviewed-fix-request" \| "landing" \| "approved"` |
| `DispatcherStatus` | `"running" \| "paused" \| "stopped" \| "missing" \| "unknown" \| "error"` |
| `CodexAutomationMode` | `"implementation-and-review" \| "implementation-only" \| "review-only"` |
| `SchedulingPolicy` | `"fix-before-new-task" \| "fifo"` |
| `ExecutionStrategy` | `"worktree" \| "main-checkout" \| "auto"` |
| `ImplementationDispatcher` | Compatibility fields retained for migrated external-dispatcher settings: jobName, desiredStatus, lastKnownStatus, lastCheckedAt, lastUpdatedBy, lastGatewayStatus, codexAutomationMode, lastError. Fresh defaults point at `brain-loop-app-scheduler`, `not-used` gateway status, and `implementation-and-review`; this object does not drive Brain Loop app-owned automation. |
| `RunnerCatalogEntry` | id, label, enabled state, model list, per-runner default model, optional runner kind (`cli` or `direct-provider`), provider id, API style, and API-key environment variable for a supported runner |
| `DirectModelRuntimeContract` | Direct-provider runtime surface: built-in direct providers, allowed tool specs, normalized harness event kinds, approval-required tool names, and `pendingRuntime` for whether the direct implementation runtime is still unavailable |
| `DirectModelProviderRequestShape` | Provider-specific request metadata for direct runners: method, endpoint template, API-key header, streaming support, tool declaration path, and tool-result path |
| `DirectModelProviderRequest` | Provider request envelope with method, endpoint, API-key env name, redacted/placeholder auth headers, and JSON body; direct execution uses the API key from the named environment variable without returning secrets |
| `DirectModelProviderStreamParseInput` | Raw provider stream chunk plus runner/provider/model/queue/thread context for dependency-free event parsing previews |
| `DirectModelProviderStreamParseResult` | Normalized direct-provider stream parse output: direct turn events, completion flag, and stringified usage metadata |
| `DirectModelHarnessEventPreview` | Preview-only conversion result from direct turn events into existing `HarnessEventInput` records, plus skipped-event and synthesized completed-message counts |
| `DirectModelHarnessRecordResult` | Direct-provider harness persistence result with the last updated thread, recorded event count, skipped-event count, and synthesized completed-message count |
| `DirectModelTurnExecutionResult` | Manual direct-provider turn execution result with the redacted provider request, generated turn id, parsed direct events, optional harness record, usage metadata, completion flag, and raw response byte count |
| `DirectModelToolLoopInput` | Bounded direct-provider tool-loop request containing a normalized turn input and optional max iteration cap |
| `DirectModelToolLoopResult` | Bounded direct-provider tool-loop response with provider turns, tool execution results, approval requests, completion flag, stop reason, and iteration count |
| `DirectModelToolSpec` | Tool name, display metadata, approval policy, and JSON input schema for direct provider tool-loop execution (`read_file`, `search_text`, `apply_patch`, `run_command`, `finish_task`) |
| `DirectModelToolExecutionInput` | Direct tool execution request with execution path, provider tool call, and optional approval policy |
| `DirectModelToolExecutionResult` | Direct tool execution response containing a normal tool result plus approval-required metadata for gated tools |
| `DirectModelToolApprovalResult` | Approval request, matching direct tool execution result, and optional harness/thread record for gated direct-provider tools |
| `DirectModelApprovedToolExecutionInput` | Approved mutating direct-tool request containing an approval request id and the original direct tool execution input |
| `DirectModelApprovedToolExecutionResult` | Approved mutating direct-tool response with the approval request, tool execution result, and optional harness/thread record |
| `DirectModelTurnInput` | Normalized direct-provider turn request with runner/provider/API/model identifiers, queue/thread ids, execution path, system prompt, messages, available tools, tool results, and approval policy |
| `DirectModelTurnEvent` | Normalized direct-provider output event aligned to the structured harness event vocabulary, including optional role/body/tool-call/approval metadata |
| `MaxLoopConcurrencyPolicy` | global implementation hard cap, optional runner caps, optional project caps, and optional runner-project caps |
| `Settings` | defaultReviewIntervalMinutes, defaultImplementationIntervalMinutes, capacityPollIntervalSeconds, maxRunningProcesses, optional maxImplementationAgents, optional maxReviewAgents, maxPickedMinutes, maxLoopPolicy, schedulingPolicy, threadStorageRoot, worktreeStorageRoot, executionStrategy, runnerCatalog, defaultImplementationRunner/defaultImplementationModel, defaultReviewRunner/defaultReviewModel, implementationDispatcher |
| `BrainProject` | id, name, path, enabled, defaultAgent, reviewIntervalMinutes, implementationIntervalMinutes, priority, optional autoMergeOnReviewPass, optional brainPath, optional brainStorage (`project` or `external`), pathExists (read-only hint from `list_projects`), brainPathExists (read-only hint from `list_projects`) |
| `ProjectFolderInspectionInput` | selected folder path plus optional existingProjectIds for collision-safe generated ids |
| `ProjectFolderInspection` | resolved path, inferred name/id, whether project-local `brain/` exists, proposed brainPath, brainStorage, and instruction file targets |
| `QueueHistoryEntry` | `at`, `by` (required); optional: `status`, `note`, `event`, `detail`, `reviewPath`, `activeHandoffPath`, `handoffPath`, `agent` — tolerates both status/note and event/detail audit entries |
| `QueueItem` | Full queue item schema with all status timestamps and history. Optional `orchestrationId` and `orchestrationTitle` link queued worker tasks back to their parent orchestration chat. Optional `threadTitle` is the canonical user-facing thread/list title for queue-backed work; readers accept legacy alias `threadName`, then `taskName`, then derive a fallback by removing date/project prefixes, suffixes, and hyphens from handoff/plan paths or id. Optional `taskName` remains a backward-compatible task-list name. Optional `recommendedModel` and `modelRecommendationReason` extend existing runner recommendation metadata while older `recommendedAgent`-only items remain valid. Optional `dependsOn` declares queue ids that must be approved before launch. Optional `blockedBy` stores queue ids currently blocking launch. Optional `waitingReason` explains capacity/dependency/merge-approval waits without changing queue status. Optional `executionStrategy` records `worktree`, `main-checkout`, or `auto` once dispatch prepares the item. Landing metadata may include `landingStatus`, `landingBranch`, `landedAt`, `landedBy`, `landedCommit`, `landingError`, `preLandingStatus`, `preLandingCommit`, `preLandingCommittedAt`, and `preLandingCommitMessage`. `reviewedAt` is stamped when review produces `reviewed-fix-request` or `landing`; `approvedAt` remains the final approval timestamp after landing succeeds. `executionPath` is `string \| null` (tolerates legacy nulls). `runnerId`, `reviewRunnerId`, and `sessionId` are optional (absent in older queue files). |
| `QueueReadError` | fileName, path, message for malformed or unreadable queue files |
| `QueueListResponse` | items, errors |
| `AgentThreadStatus` | `"waiting" \| "implementing" \| "waiting-review" \| "reviewing" \| "landing" \| "done" \| "blocked" \| "unknown"` |
| `AgentThreadMessageRole` | `"system" \| "user" \| "agent" \| "approval" \| "artifact"` |
| `AgentThreadMessageSource` | `"structured-provider-events" \| "brain-timeline" \| "transcript-only"` |
| `HarnessEventKind` | `"session.started" \| "turn.started" \| "message.delta" \| "message.completed" \| "tool.started" \| "tool.completed" \| "approval.required" \| "file.changed" \| "run.log" \| "turn.completed" \| "session.failed" \| "session.completed"` |
| `HarnessProviderCapability` | provider, label, capability mode, exact-message flag, details, and supported event kinds |
| `HarnessEventInput` | Provider event input with kind, sourceEventId, provider, optional model/queue/thread/run/session/turn ids, optional role/title/body/createdAt, and string metadata |
| `OrchestrationThread` | Parent intake/planning or Brain handoff-session chat stored under `~/.brain-loop/orchestrations/*.json`; includes project identity, origin agent, status, optional model, messages, linked queue item ids, linked worker thread ids, linked handoff paths, and timestamps. Intake-derived handoff threads use compact summary messages and task tables rather than full external-agent transcripts. |
| `OrchestrationMessage` | Persisted orchestration chat message with id, role, body, timestamp, optional agent/model, and metadata. |
| `OrchestrationHandoffInput` | Request to create queue handoffs from an orchestration. Contains `orchestrationId`, task list, source agent, and flags for registering a missing project. Missing imported projects default to `enabled: false`. |
| `OrchestrationHandoffResult` | Returns the updated orchestration, created queue items, the project record used, and whether the project was created. |
| `AgentThreadMessage` | Durable compact timeline message with id, role, kind, title, body, createdAt, and optional string metadata. Queue state, waiting reasons, artifact links, transcript links, approval-state changes, and exact provider messages append these records while full runner output remains in logs. Exact provider messages carry `isExactProviderMessage=true` and a stable `sourceEventId`. |
| `AgentThread` | Durable thread metadata with queueItemId, optional orchestrationId, project fields, optional worktree/execution paths, optional executionStrategy, optional planPath/handoffPath/activeHandoffPath/reviewPath artifact links, title, implementation/review status, runner IDs, optional messageSource/providerSessionId/providerThreadId, actual timestamped log paths when available, approvalRequestIds, pendingApprovalCount, persisted `messages`, timestamps, lastError, optional waitingReason mirrored from the queue item, and optional archive metadata (`archivedAt`, `archivedBy`, `archiveReason`) |
| `BrainStatus` | implementationStatus, reviewStatus, activeRuns, queuedItems, submittedItems, blockedItems |
| `LogSummary` | fileName, lastModified, sizeBytes, queueItemId (optional), projectId (optional), status (optional) |
| `LockFile` | id, type (`"implementation" \| "review" \| "mutation"`), holder, heldSince, expiresAt, metadata |
| `LogLevel` | `"debug" \| "info" \| "warn" \| "error"` |
| `LogCategory` | `"implementation" \| "review" \| "dispatch" \| "lock" \| "scheduler" \| "system"` |
| `LogEntry` | id, timestamp, level, category, message, runnerId, projectId, queueItemId, metadata |
| `RunnerMetadata` | agent, command, args, cwd, env, timeoutMs |
| `RunResult` | runnerId, queueItemId, agent, exitCode, signal, stdout, stderr, startedAt, finishedAt, durationMs |
| `LogEvent` | line, stream (`"stdout" \| "stderr"`), runId |
| `ApprovalKind` | `"command" \| "permission" \| "destructive"` |
| `ApprovalStatus` | `"pending" \| "approved" \| "denied" \| "expired"` |
| `ApprovalRequest` | id, kind, status, title, description, risk, requestedAt, requestedBy, history, optional queue/run/session/command/path/project fields, and optional string metadata used by direct-model approvals to persist tool-call context |
| `ApprovalRequestInput` | New approval request payload without server-owned id, status, timestamps, or history; may include string metadata for approval-specific execution context |

#### Tauri Commands (`desktop-client`)

- `spawn_pty(run_id, queueItemId, executionPath, command, args, rows, cols)` -> `Result<PtySessionMetadata, String>`: Spawns PTY session, streams output to durable logs with a JSON metadata sidecar, returns metadata including PID and session ID.
- `write_pty(pid, data)` -> `Result<(), String>`: Writes string to PTY stdin.
- `resize_pty(pid, rows, cols)` -> `Result<(), String>`: Resizes PTY window.
- `close_pty(pid)` -> `Result<(), String>`: Removes backend session state and attempts to terminate the child process.
  - `run_process(command, args, cwd, queueItemId, projectId, agent, runId)` -> `Result<String, String>`: Spawns process, streams output to durable log under `logs/runs/`, emits `process-log` events. Log filename is collision-resistant: `{timestamp}_{sanitizedRunId}[_{queueItemId}][_{projectId}][_{agent}].log`. Metadata sidecar `{name}.json` captures RunMetadata. Spawn failures block the queue item and write a durable error record.
  - `read_log_file(file_name)` -> `Result<String, String>`: Returns full text of a durable `.log` file. Safe filename rules enforced: rejects path separators (`/`, `\`), parent traversal (`..`), absolute paths, non-`.log` extensions, and empty names. Validates canonical path is within `logs/runs/`.
  - `list_recent_logs()` -> `Result<Vec<LogSummary>, String>`
- `get_brain_status()`, `list_projects()`
- `get_settings()` -> `Result<Settings, String>`: Reads `settings.toml`, returning defaults when missing and normalizing older settings files that do not include runner catalog, storage root, or execution strategy fields. Legacy `~/.codex/brain-project-manager/settings.json` is migrated to TOML when the new state root is prepared.
- `update_settings(settings)` -> `Result<Settings, String>`: Validates and atomically writes settings. Runner catalog validation requires supported unique runner ids, non-empty model lists, default models present in each runner's model list, and enabled role-default runners. MaxLoop validation requires positive caps and supported runner ids. `capacityPollIntervalSeconds` must be between 1 and 60 seconds. The persisted `schedulingPolicy` field must be `fix-before-new-task` or `fifo` and is shown in Settings as `Implementation queue order`. Storage roots must be non-empty strings. Execution strategy must be `worktree`, `main-checkout`, or `auto`.
- Review role defaults may be CLI or direct-provider runners. Direct-provider review runners use Brain Loop's read-only direct review loop rather than a CLI process.
- `list_queue()` -> `Result<QueueListResponse, String>`: Returns valid queue items and per-file read/parse errors without failing the whole list. Items without `threadTitle` are returned with a generated display fallback derived from `threadName`, `taskName`, handoff/plan paths, or id. Items without `recommendedModel` are returned with a display fallback derived from runner/model settings.
- `list_agent_threads()` -> `Result<Vec<AgentThread>, String>`: Reads non-archived durable agent thread records from `settings.threadStorageRoot` (default `~/.brain-loop/threads/*.json`), newest updated first. Malformed thread files are skipped for now.
- `list_archived_agent_threads()` -> `Result<Vec<AgentThread>, String>`: Reads archived durable agent thread records from the configured thread storage root, newest updated first.
- `archive_agent_thread(threadId, by, reason)` -> `Result<AgentThread, String>`: Marks a terminal thread record archived with `archivedAt`, `archivedBy`, and optional `archiveReason`. Supported archivable statuses are `done`, `landing`, `blocked`, and `unknown`. The command does not delete worktrees, logs, queue files, or artifacts.
- `list_orchestrations()` -> `Result<Vec<OrchestrationThread>, String>`: Reads non-archived orchestration chat records from `~/.brain-loop/orchestrations/*.json`, newest updated first.
- `create_orchestration(input)` -> `Result<OrchestrationThread, String>`: Creates a draft orchestration chat record with project identity, origin agent, optional model, and optional initial message.
- `append_orchestration_message(input)` -> `Result<OrchestrationThread, String>`: Appends a persisted message and moves a draft orchestration to refining.
- `run_orchestration_turn(input)` -> `Result<OrchestrationThread, String>`: Runs the selected local orchestrator runtime for the orchestration and appends the assistant response. Codex uses local `codex exec` in read-only sandbox mode; Claude uses local `claude --print` in plan mode with tools disabled.
- `update_orchestration_project(input)` -> `Result<OrchestrationThread, String>`: Updates an orchestration's project id/name/path from a registered project record so the Orchestrator project selector persists durable project context before handoff.
- `handoff_orchestration(input)` -> `Result<OrchestrationHandoffResult, String>`: Creates one queued handoff item per task, writes plan/handoff markdown artifacts under the orchestration folder, sets `orchestrationId`/`orchestrationTitle` on queue items, links queue/thread/handoff ids back to the orchestration, and registers missing projects disabled by default unless explicitly overridden. Brain skill handoffs that bypass this command must still follow the same persisted link fields when writing queue and orchestration JSON directly.
- `list_harness_capabilities()` -> `Result<Vec<HarnessProviderCapability>, String>`: Reports provider message capture modes. Codex currently reports `structured-provider-events`; OpenCode and Antigravity report `transcript-only` until stable structured APIs are verified.
- `list_direct_model_runtime_contract()` -> `DirectModelRuntimeContract`: Reports the direct DeepSeek/Gemini runtime contract, including tool schemas, request-shape metadata, structured event kinds, and `pendingRuntime: false` once implementation and review dispatch are wired.
- `preview_direct_model_provider_request(input)` -> `Result<DirectModelProviderRequest, String>`: Validates a normalized direct-provider turn and builds the provider-specific JSON request envelope. DeepSeek uses OpenAI-chat `/chat/completions` with `tools[].function` when tools are present; Gemini uses `streamGenerateContent` with `systemInstruction`, optional `tools[].functionDeclarations`/`toolConfig`, and function-response content parts. This command does not send network requests or read API keys.
- `preview_direct_model_stream_events(input)` -> `Result<DirectModelProviderStreamParseResult, String>`: Validates raw direct-provider stream chunks and maps them into normalized direct turn events without appending harness logs. DeepSeek previews parse SSE `choices[].delta` content/tool-call chunks and preserve a stream key from the provider tool-call index when present for id-less partial argument deltas; Gemini previews parse `candidates[].content.parts[]` text/function-call chunks plus `finishReason` and usage metadata, with chunk sequence included in generated source event ids for harness dedupe safety.
- `preview_direct_model_harness_events(events)` -> `DirectModelHarnessEventPreview`: Converts normalized direct turn events into existing `HarnessEventInput` records without appending JSONL, mutating thread records, or emitting Tauri events. Tool call ids, tool names, serialized arguments, approval ids, and direct-provider metadata are preserved in harness event metadata. Consecutive `message.delta` bodies are synthesized into a `message.completed` harness event when the direct turn reaches `turn.completed`, so the existing exact-message thread renderer can consume the result once persistence is enabled.
- `record_direct_model_harness_events(events)` -> `Result<DirectModelHarnessRecordResult, String>`: Converts normalized direct turn events into harness events, synthesizes completed messages from deltas, and records them through the existing harness JSONL/thread ingestion path. This command persists provided direct events only; it does not call providers, read API keys, execute tools, or transition queues.
- `execute_direct_model_turn(input)` -> `Result<DirectModelTurnExecutionResult, String>`: Executes one normalized direct-provider turn against DeepSeek or Gemini using the provider API key from `DEEPSEEK_API_KEY` or `GEMINI_API_KEY`. It returns the redacted provider request, generated turn id, parsed direct events, usage metadata, response byte count, and optional harness persistence result. It records `turn.started` before API-key lookup/provider HTTP work and records `session.failed` on missing/empty API keys, provider setup, request, response-read, HTTP-status, or parse failures. It does not execute provider tool calls, apply patches, run commands, or transition queues by itself.
- `execute_direct_model_tool_loop(input)` -> `Result<DirectModelToolLoopResult, String>`: Runs a bounded direct-provider safe-tool loop. Each iteration executes one provider turn, collects model-requested tool calls, executes safe tools (`read_file`, `search_text`, `finish_task`), records `tool.completed` harness events, and feeds cumulative tool results into the next provider turn. Gemini continuation requests include the original tool-call id on both synthetic `functionCall` bridge parts and matching `functionResponse` parts. If the model requests `apply_patch` or `run_command`, the command creates the Brain Loop approval request and stops with `stoppedReason: "approval_required"`. Iterations are capped between 1 and 8. Approved mutations require a separate explicit `execute_approved_direct_model_tool` call. The standalone command does not transition queues; implementation dispatch wraps it and reconciles direct completion/approval/failure states.
- `execute_direct_model_tool(input)` -> `DirectModelToolExecutionResult`: Executes bounded direct-provider tools against an explicit execution path. `read_file` reads a canonicalized relative file path with line/range caps. `search_text` performs a bounded substring search under a canonicalized relative path while skipping common generated directories and large files. `finish_task` echoes the requested summary/status as a tool result and its tool schema advertises dispatcher-supported implementation/review statuses: `submitted`, `reviewed-fix-request`, `landing`, and `blocked`. `apply_patch` and `run_command` return approval-required results and do not mutate files or launch commands.
- `request_direct_model_tool_approval(input)` -> `Result<DirectModelToolApprovalResult, String>`: Creates a Brain Loop approval request for gated direct-provider tools. `apply_patch` creates a destructive approval; `run_command` creates a command approval. Queue/project/runner/session metadata from the tool input is preserved on the approval request when present. When a queue item id is supplied, the command also records an `approval.required` harness event so the queue-linked thread can show the pending permission inline. This command creates the approval and visibility event only; approval resolution by itself does not execute the tool.
- `execute_approved_direct_model_tool(input)` -> `Result<DirectModelApprovedToolExecutionResult, String>`: Verifies that the supplied approval request exists, is `approved`, matches `direct-model:<tool>`, and matches the approved execution path/queue context. Callers may pass only `approvalRequestId` when the approval contains direct tool metadata. `apply_patch` runs `git apply --whitespace=nowarn` inside the canonical execution path with the patch piped on stdin. `run_command` runs `/bin/sh -lc` inside the canonical execution path with a 1-300 second timeout. The command captures stdout/stderr/exit metadata and records a queue-linked `tool.completed` harness event when possible. For a started direct-provider implementation item, it clears the approval waiting reason and resumes the provider loop in the background with preserved prior safe-tool results plus the approved tool result. Queue transitions stay with the implementation dispatch wrapper.
- `start_harness_session(input)` -> `Result<HarnessSession, String>`: Starts a live Codex `app-server --stdio` runtime for `provider: "codex"`, creates a provider thread over newline-delimited JSON-RPC, records `session.started`, marks the queue-linked thread as `structured-provider-events`, and sends the initial prompt as a provider turn when provided. Returns Brain thread id plus provider thread/session ids.
- `send_harness_message(threadId, message)` -> `Result<AgentThread, String>`: Sends `turn/start` to the live Codex runtime for a queue-derived thread id. If the app restarted and no runtime is attached, starts a fresh Codex runtime for the queue item, records recovery session metadata, then sends the message.
- `stop_harness_session(threadId)` -> `Result<AgentThread, String>`: Unsubscribes/kills the live Codex runtime when present and records a structured `session.completed` event against a queue-derived thread id.
- `record_harness_event(event)` -> `Result<AgentThread, String>`: Appends the normalized event to `~/.brain-loop/harness/events/*.jsonl`, emits `harness-event`, updates provider session metadata, and normalizes supported message events into durable `AgentThread.messages`. Message writes are idempotent by `sourceEventId`.
- `replay_harness_events(queueItemId)` -> `Result<AgentThread, String>`: Replays `~/.brain-loop/harness/events/<queueItemId>.jsonl` into the durable thread read model without appending duplicate JSONL entries. Existing provider messages remain idempotent by `sourceEventId`.
- `inspect_project_folder(input)` -> `Result<ProjectFolderInspection, String>`: Canonicalizes a user-selected project folder, infers project name/id from `package.json`, `Cargo.toml`, or folder basename, detects project-local `brain/`, and returns the Brain setup preview used by the create form.
- `create_project(project)` -> `Result<BrainProject, String>`: Validates required fields, agent, priority, and positive intervals, prepares project Brain setup, then atomically appends to `projects.json`. If `<project>/brain/` exists, `brainPath` points there and `brainStorage` is `project`. If not, Brain Loop creates `~/.brain-loop/project-brains/<project-id>/brain/`, seeds minimal Brain/task docs, sets `brainStorage` to `external`, and upserts managed Brain Loop blocks into `AGENTS.md` or `AGENT.md` plus `CLAUDE.md`.
- `update_project(project)` -> `Result<BrainProject, String>`: Validates and atomically replaces an existing project by id.
- `set_project_enabled(projectId, enabled)` -> `Result<BrainProject, String>`: Atomically toggles project eligibility for automation.
- Project mutations preserve optional `autoMergeOnReviewPass`, `brainPath`, and `brainStorage`; absent `autoMergeOnReviewPass` values default to `false` so review-passed items request merge approval instead of auto-landing.
- `update_queue_item_status(itemId, newStatus, by, ...)`
- `list_approval_requests()` -> `Result<Vec<ApprovalRequest>, String>`: Returns durable approval requests from `~/.brain-loop/approvals.json` newest first and refreshes queue-linked thread approval metadata.
- `request_approval(request)` -> `Result<ApprovalRequest, String>`: Creates a pending approval request, records initial history, atomically persists `approvals.json`, refreshes queue-linked agent thread approval metadata when `queueItemId` is present, and emits `approval-requested`.
- `approve_request(id, by)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as approved, atomically persists `approvals.json`, refreshes queue-linked thread approval metadata, and emits `approval-approved` plus `approval-resolved`.
- `deny_request(id, by, reason)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as denied, atomically persists `approvals.json`, refreshes queue-linked thread approval metadata, emits `approval-denied` plus `approval-resolved`, and attempts to block the linked queue item with an `approval_denied` audit event.
- `expire_request(id, by, reason)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as expired, atomically persists `approvals.json`, refreshes queue-linked thread approval metadata, emits `approval-expired` plus `approval-resolved`, and attempts to block the linked queue item with an `approval_expired` audit event.
- Merge approval requests use command `brain-loop:land-approved-work`. Approving one records the approval, then attempts guarded landing for the linked `landing` queue item. If landing fails, the queue item is blocked with landing error metadata and the command returns an error explaining that approval was recorded but landing failed.
- `acquire_brain_lock(lockId, lockType, holder)`, `release_brain_lock(lockId)`, `check_brain_lock(lockId)`
- Scheduler: `start_automation()`, `pause_automation()`, `stop_automation()`, `get_scheduler_status()`, `run_queue_item_once(queueItemId)`, `run_implementation_once()`, `run_review_once()`
  - `start_automation()` is the authoritative automation kick-off. It sets scheduler state to running and ensures one Brain Loop-owned background capacity loop is active. The loop calls the internal local automation triage helper every `capacityPollIntervalSeconds` while running, idles while paused, and exits when stopped or errored. It does not require Hermes cron, Hermes gateway, or any external automation job.
  - `pause_automation()` stops new dispatch and follow-up dispatch but does not terminate already-running implementation or review processes; those finish naturally and leave any next step for resume/tick handling.

#### Dispatch Contract

- Background automation/tray `Run Once`:
  - Reads local queue/project state before launching token-spending runners.
  - Attempts submitted review work before new queued implementation work.
  - Records no-work, disabled-project, capacity, stale-run, and launch-error decisions to durable scheduler logs.
  - Writes a compact `TRIAGE:` summary for each automation loop or tray pass.
  - Runner-completion callbacks may request immediate review or fix dispatch, but only while scheduler state is still `running`.

- `run_queue_item_once(queueItemId)`:
  - Does not require scheduler state to be `running` and does not call `start_automation`.
  - Reconciles stale active work before reading the requested queue item.
  - Launches exactly the requested item: `queued`/`reviewed-fix-request` starts implementation, and `submitted` starts review.
  - Applies the same enabled-project, enabled-runner, dependency, capacity, MaxLoop, worktree/execution strategy, direct-provider, process-runner, and durable logging gates as the matching dispatch path.
  - Refuses active, landing/approval-owned, blocked, stale-started, approved, or unsupported statuses without launching other queue work.

- `run_implementation_once`:
  - Rejected if scheduler state is `stopped` or `paused`.
  - Reconciles stale active queue items before capacity is measured.
  - Respects implementation capacity from `maxImplementationAgents`, falling back to legacy `maxRunningProcesses`, and applies `maxLoopPolicy.globalMax` as a hard ceiling when lower; active implementation agents count from queue items with `picked`/`started` status. `stale-started` remains visible for recovery but does not consume an implementation slot.
  - Eligible queue items: `status` is `queued` or `reviewed-fix-request`.
  - Candidate ordering follows `settings.schedulingPolicy`: `fix-before-new-task` sorts reviewed fix requests first, then priority, then creation time; `fifo` sorts all eligible implementation work by creation time.
  - Dependencies are checked before MaxLoop caps. Items with unsatisfied, missing, blocked, self-referential, or cyclic dependencies keep their current status and receive `waitingReason`, `blockedBy`, and a `dependency_waiting` history event. A dependency is satisfied only when the referenced queue item is `approved`.
  - Per-item disabled-project filtering: items whose `project_path` does not match an enabled project are individually skipped and logged.
  - Per-item disabled-runner filtering: items whose `agent` is missing from `settings.runnerCatalog` or whose runner catalog entry is disabled remain in their current queue status with `waitingReason` and a `runner_disabled_waiting` history event. Direct-provider queue items therefore require the matching direct runner to be enabled before dispatch.
  - Enabled eligible items get durable agent thread metadata created or updated before the tick result is recorded.
  - Enabled eligible items apply `settings.executionStrategy`: `worktree` prepares or reuses a per-task Git worktree under `settings.worktreeStorageRoot`, `main-checkout` runs from the registered project checkout, and `auto` attempts worktree preparation before falling back to the main checkout when the project path exists. `worktreePath`, `executionPath`, and `executionStrategy` are persisted on the queue item. Worktree preparation failures under the `worktree` strategy leave the item in its current status and persist `lastError` plus a `worktree_prepare_failed` history entry.
  - Open capacity slots are filled in priority/order by transitioning items to `picked`, then `started`, assigning `runnerId`, and launching either a provider process via `runner::run_process` for CLI runners or a Brain Loop-owned direct-provider background runtime for `direct-deepseek`/`direct-gemini`.
  - Direct-provider implementation dispatch uses a direct-native user prompt that embeds queue context and active handoff content instead of CLI-only global skill-file instructions, executes the bounded direct tool loop, persists exact provider events through harness ingestion, leaves approval-required tool requests as `started` with `waitingReason`, submits on `finish_task` by default, blocks on provider failure/max iterations, and immediately gives review dispatch a chance to run after a direct item is submitted.
  - Runner, project, and runner-project MaxLoop caps are evaluated per candidate. Items blocked by active caps are not launched; they receive `waitingReason` and a `maxloop_waiting` history event, and the dispatcher continues scanning for later eligible items that fit the remaining caps.
  - Launch model is resolved from queue `recommendedModel` first, then `settings.runnerCatalog` and `settings.defaultImplementationModel` when the queue item's runner matches the default implementation runner. Backward-compatible built-in defaults remain `open-code`/`deepseek v4 pro`, `antigravity`/`3.1 pro`, `codex`/`gpt-5-codex`, `direct-deepseek`/`deepseek-v4-pro`, and `direct-gemini`/`gemini-3.5-flash` when settings are missing.
  - If a launched implementation runner exits successfully while its queue item is still `started`, the runner transitions the item to `submitted` and immediately asks the review pool to fill only while automation is still `running`. If automation is paused first, the item remains `submitted` for the next resume/tick.
  - Stale reconciliation uses `maxPickedMinutes`: stale `picked` items transition back to `queued`; stale `started` items transition to `submitted` or `blocked` when completed run metadata proves the runner result, otherwise to `stale-started`.
  - Every tick and skip decision is durably written to `scheduler.log`.

- `run_review_once`:
  - Rejected if scheduler state is `stopped` or `paused`.
  - Reconciles stale active queue items before capacity is measured.
  - Respects review capacity from `maxReviewAgents`; active review agents count from queue items with `reviewing` status.
  - Eligible queue items: `status` is `submitted` only. `reviewed-fix-request` is implementation-owned and not review-eligible.
  - Per-item disabled-project filtering (same as implementation dispatch).
  - Enabled submitted items that cannot launch because `maxReviewAgents` is already full remain `submitted`; they receive `waitingReason`, a `review_capacity_waiting` history event, and matching queue-linked `AgentThread.waitingReason`.
  - Enabled submitted items get the same queue-linked durable agent thread metadata created or updated before the tick result is recorded.
  - Review preparation reuses the queue item's `worktreePath`/`executionPath`/`executionStrategy` when present so review and implementation share the same task context; older submitted items without a path apply the configured execution strategy before launch.
  - Open review slots are filled by transitioning submitted items to `reviewing`, stamping `agentStartedAt`, assigning `reviewRunnerId`, and launching the configured default review runner/model via `runner::run_process` for CLI runners or Brain Loop's direct review runtime for enabled direct providers.
  - Review result transitions to `reviewed-fix-request` or `landing` stamp `reviewedAt`.
  - Direct-provider review uses read/search/finish tools only. Its `finish_task.queueStatus` may request `reviewed-fix-request`, `landing`, or `blocked`; unsupported statuses block the item with a durable error.
  - If a review result transitions the item to `reviewed-fix-request`, the review runner completion asks the implementation pool to run the fix while automation is still `running`. The same queue-linked worker thread remains open until the item eventually reaches `approved` or terminal failure.
  - A queue item that reaches `landing` is finalized by project landing policy. When `autoMergeOnReviewPass` is true, Brain Loop attempts guarded landing immediately. Otherwise it creates or reuses a pending destructive merge approval request and records `waitingReason`.
  - Guarded landing approves only after landing succeeds. Same-checkout work records `landingStatus: not_needed`; worktree-backed landing verifies repository/worktree identity, acquires a landing lock, preserves dirty project-checkout changes in a pre-landing commit, commits dirty implementation work, merges into local `main` or `master`, records landing metadata, then transitions `landing` to `approved`.
  - Landing failures transition `landing` to `blocked` with `landingStatus: blocked`, `landingError`, `lastError`, and audit history.
  - A clean review process exit is not enough to approve or land work. If the review runner exits successfully while the queue item is still `reviewing`, `runner::run_process` transitions the item to `blocked` with `lastError` and a `review_runner_missing_result` history event.
  - Review runner completion frees review capacity and asks the review pool to fill while automation is still `running`; paused automation drains the current review without launching the next review.
  - Stale `reviewing` items older than `maxPickedMinutes` are blocked when no usable completion update exists or when the runner fails.
  - Every tick decision is durably logged.

- `get_scheduler_status` returns scheduler state plus capacity fields:
  - `activeImplementationAgents`
  - `maxImplementationAgents`
  - `waitingImplementationItems`
  - `activeReviewAgents`
  - `maxReviewAgents`
  - `waitingReviewItems`

#### Tauri Events

- `"process-log"`: Emits `LogEvent` with streaming stdout/stderr lines.
  - `"process-complete"`: Emits `{ runId: string, exitCode: number | null, signal: string | null }` when the process exits.
- `"approval-requested"`: Emits a new `ApprovalRequest`.
- `"approval-approved"`: Emits the resolved approved `ApprovalRequest`.
- `"approval-denied"`: Emits the resolved denied `ApprovalRequest`.
- `"approval-expired"`: Emits the resolved expired `ApprovalRequest`.
- `"approval-resolved"`: Emits any non-pending `ApprovalRequest` after approve, deny, or expire.
- `"harness-event"`: Emits the structured harness event accepted by `record_harness_event`.
#### Constants (`constants.ts`)

- `brainProjectManagerRoot`: `"~/.brain-loop"`
- `VALID_PRIORITIES`, `VALID_PROJECT_AGENTS`, `VALID_QUEUE_STATUSES`, `VALID_DISPATCHER_STATUSES`, `VALID_CODEX_AUTOMATION_MODES`, `VALID_EXECUTION_STRATEGIES`, `VALID_LOG_LEVELS`, `VALID_LOG_CATEGORIES`
- `QUEUE_STATUS_TRANSITIONS`: Valid state machine transitions for every queue status
- `TILDE_PREFIX`, `DEFAULT_HOME_DIR`: Path normalization constants
- `DEFAULT_SETTINGS`: Safe default Settings object
  - Runner/model defaults: `runnerCatalog` contains CLI runners `open-code`, `antigravity`, and `codex`, plus direct-provider entries `direct-deepseek` and `direct-gemini`; role defaults remain `open-code`/`deepseek v4 pro` for implementation and `codex`/`gpt-5-codex` for review.
  - MaxLoop defaults: `maxLoopPolicy.globalMax` is `1`; runner, project, and runner-project caps are empty until configured.
  - Scheduling default: `schedulingPolicy` is `fix-before-new-task`.
  - Capacity loop cadence default: `capacityPollIntervalSeconds` is `60`.
  - Thread/worktree defaults: `threadStorageRoot` is `~/.brain-loop/threads`, `worktreeStorageRoot` is `~/.brain-loop/worktrees`, and `executionStrategy` is `worktree`.

#### Validation (`validation.ts`)

- Type guards: `isValidPriority`, `isValidProjectAgent`, `isValidQueueStatus`, `isValidDispatcherStatus`, `isValidCodexAutomationMode`, `isValidLogLevel`, `isValidLogCategory`
- Assertions: `assertPriority`, `assertProjectAgent`, `assertQueueStatus`, `assertDispatcherStatus`, `assertCodexAutomationMode`
- Queue transitions: `isValidQueueTransition`, `assertQueueTransition`
- Path normalization: `normalizePath(raw, homeDir?)`
- Safe parsing: `parseBoolean(value, fallback)`, `parseIntSafe(value, fallback)`

#### Examples (`examples.ts`)

Type-level examples prove that real Brain handoff queue shapes compile without casts. Sampled from live GND and school-clerk queue files.

### Queue History Entry Shapes

Global queue files use two distinct history entry shapes:

1. **Status/Note entries** (used by older handoff workflows):
   ```json
   { "status": "picked", "at": "...", "by": "...", "note": "..." }
   ```

2. **Event/Detail entries** (used by newer audit workflows):
   ```json
   { "at": "...", "by": "...", "event": "blocked_macos_tcc", "detail": "...", "agent": "open-code" }
   ```
   Event entries may carry optional `reviewPath`, `activeHandoffPath`, `handoffPath`, and `agent` metadata.

The `QueueHistoryEntry` type accepts both shapes by making all non-essential fields optional. Only `at` and `by` are required.

### Nullable Execution Path

`QueueItem.executionPath` is `string | null`. Legacy queue files (e.g., GND approved items) carry `executionPath: null` when worktree isolation was unavailable or the executing agent ran from the project root.

### Contract Compatibility

- Queue item statuses match the Brain handoff contract (`brain-handoff` skill).
- Runner agents match `open-code`, `antigravity`, `codex`.
- Path normalization supports tilde-expansion with configurable home directory.
- All constants are aligned with global Brain queue file schemas.
- `assertQueueTransition` enforces valid status state machine transitions.

### Run Metadata and Events

  - **RunMetadata** (`runner.rs`): Persisted as `logs/runs/<name>.json` alongside the `.log` file. Fields: `queueItemId`, `projectId`, `agent`, `command`, `args`, `cwd`, `startedAt`, `finishedAt`, `exitCode`, `signal`, `logFilePath`, `status` (`"started" | "completed" | "blocked"`), `error`.
  - **Safe filename rules**: `read_log_file` rejects path separators, `..`, absolute paths, non-`.log` files, and empty names. Canonical path must resolve within the `logs/runs/` directory.
- **Log naming**: Collision-resistant format `{timestamp}_{runId}[_{queueItemId}][_{projectId}][_{agent}].log` with all segments sanitized to alphanumeric + hyphen. Empty `runId` falls back to `"unknown"`.
- **Agent thread log links and status refresh**: `runner::run_process` updates the queue-linked agent thread's `logFilePath` or `reviewLogFilePath` with the actual timestamped log file path when the process starts or when spawn-failure metadata is written. Runner-driven queue mutations refresh the thread record so status, `lastError`, and `waitingReason` stay aligned. Queue-to-thread refreshes preserve existing log paths while the matching runner ID remains unchanged.
- **Structured harness events**: Normalized provider events append as JSONL under `~/.brain-loop/harness/events/`. Codex events originate from `codex app-server --stdio` JSON-RPC notifications. `message.completed`, `approval.required`, `session.failed`, and `session.completed` can normalize to `AgentThreadMessage` records. `sourceEventId` is the replay/idempotency key.
- **PTY Session Contract**: `spawn_pty` returns `PtySessionMetadata` containing `pid`, `sessionId`, `runId`, `queueItemId`, `executionPath`, and `logFilePath`. Output is durably streamed to `logs/runs/<sessionId>.log` while emitting `pty-data`.
- **ProcessEvents**: `process-log` includes `line`, `stream`, and `runId`. `pty-data` includes `pid` and `chunk`. `process-complete` includes `runId`, `exitCode`, and `signal`.
- **LogSummary**: UI reads combine the `.log` and `.json` sidecars to return `LogSummary` enhanced with `queueItemId`, `projectId`, and `status`.

## Mutation Rules

- Every JSON mutation must be atomic.
- Queue status transitions must be validated before writing.
- Every runner or scheduler decision that changes state must append an audit history or durable log entry.
- Missing optional files may produce safe defaults; malformed durable state should be surfaced, not silently discarded.
