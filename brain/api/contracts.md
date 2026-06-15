# API Contracts

## Purpose

Tracks contracts between React, Rust, Brain JSON, and runner CLIs.

## Contract Rules

- React calls Tauri commands.
- Rust returns typed JSON responses.
- Rust emits events for live state changes.
- Queue item JSON remains compatible with Brain project manager skills.

## Global Brain JSON Contract

Brain Loop treats this directory as the durable workflow source of truth:

```text
~/.codex/brain-project-manager/
  settings.json
  projects.json
  queues/handoffs/*.json
  locks/
  logs/
```

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

## Implemented Shared Contracts

### `@brain-loop/brain-core` (`packages/brain-core/src/`)

#### Types (`types.ts`)

| Type | Covers |
|------|--------|
| `Priority` | `"high" \| "medium" \| "low"` |
| `ProjectAgent` | `"open-code" \| "antigravity" \| "codex"` |
| `QueueStatus` | `"queued" \| "picked" \| "started" \| "stale-started" \| "submitted" \| "reviewing" \| "blocked" \| "reviewed-fix-request" \| "landing" \| "approved"` |
| `DispatcherStatus` | `"running" \| "paused" \| "stopped" \| "missing" \| "unknown" \| "error"` |
| `CodexAutomationMode` | `"implementation-and-review" \| "implementation-only" \| "review-only"` |
| `ImplementationDispatcher` | jobName, desiredStatus, lastKnownStatus, lastCheckedAt, lastUpdatedBy, lastGatewayStatus, codexAutomationMode, lastError |
| `Settings` | defaultReviewIntervalMinutes, defaultImplementationIntervalMinutes, maxRunningProcesses, maxPickedMinutes, implementationDispatcher |
| `BrainProject` | id, name, path, enabled, defaultAgent, reviewIntervalMinutes, implementationIntervalMinutes, priority, pathExists (read-only hint from `list_projects`) |
| `QueueHistoryEntry` | `at`, `by` (required); optional: `status`, `note`, `event`, `detail`, `reviewPath`, `activeHandoffPath`, `handoffPath`, `agent` — tolerates both status/note and event/detail audit entries |
| `QueueItem` | Full queue item schema with all status timestamps and history. `executionPath` is `string \| null` (tolerates legacy nulls). `runnerId` and `sessionId` are optional (absent in older queue files). |
| `QueueReadError` | fileName, path, message for malformed or unreadable queue files |
| `QueueListResponse` | items, errors |
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
| `ApprovalRequest` | id, kind, status, title, description, risk, requestedAt, requestedBy, history, and optional queue/run/session/command/path/project metadata |
| `ApprovalRequestInput` | New approval request payload without server-owned id, status, timestamps, or history |

#### Tauri Commands (`desktop-client`)

- `spawn_pty(run_id, queueItemId, executionPath, command, args, rows, cols)` -> `Result<PtySessionMetadata, String>`: Spawns PTY session, streams output to durable logs with a JSON metadata sidecar, returns metadata including PID and session ID.
- `write_pty(pid, data)` -> `Result<(), String>`: Writes string to PTY stdin.
- `resize_pty(pid, rows, cols)` -> `Result<(), String>`: Resizes PTY window.
- `close_pty(pid)` -> `Result<(), String>`: Removes backend session state and attempts to terminate the child process.
  - `run_process(command, args, cwd, queueItemId, projectId, agent, runId)` -> `Result<String, String>`: Spawns process, streams output to durable log under `logs/runs/`, emits `process-log` events. Log filename is collision-resistant: `{timestamp}_{sanitizedRunId}[_{queueItemId}][_{projectId}][_{agent}].log`. Metadata sidecar `{name}.json` captures RunMetadata. Spawn failures block the queue item and write a durable error record.
  - `read_log_file(file_name)` -> `Result<String, String>`: Returns full text of a durable `.log` file. Safe filename rules enforced: rejects path separators (`/`, `\`), parent traversal (`..`), absolute paths, non-`.log` extensions, and empty names. Validates canonical path is within `logs/runs/`.
  - `list_recent_logs()` -> `Result<Vec<LogSummary>, String>`
- `get_brain_status()`, `list_projects()`
- `list_queue()` -> `Result<QueueListResponse, String>`: Returns valid queue items and per-file read/parse errors without failing the whole list.
- `create_project(project)` -> `Result<BrainProject, String>`: Validates required fields, agent, priority, and positive intervals, then atomically appends to `projects.json`.
- `update_project(project)` -> `Result<BrainProject, String>`: Validates and atomically replaces an existing project by id.
- `set_project_enabled(projectId, enabled)` -> `Result<BrainProject, String>`: Atomically toggles project eligibility for automation.
- `update_queue_item_status(itemId, newStatus, by, ...)`
- `list_approval_requests()` -> `Result<Vec<ApprovalRequest>, String>`: Returns in-memory approval requests newest first.
- `request_approval(request)` -> `Result<ApprovalRequest, String>`: Creates a pending approval request, records initial history, and emits `approval-requested`.
- `approve_request(id, by)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as approved and emits `approval-approved` plus `approval-resolved`.
- `deny_request(id, by, reason)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as denied, emits `approval-denied` plus `approval-resolved`, and attempts to block the linked queue item with an `approval_denied` audit event.
- `expire_request(id, by, reason)` -> `Result<ApprovalRequest, String>`: Resolves a pending approval as expired, emits `approval-expired` plus `approval-resolved`, and attempts to block the linked queue item with an `approval_expired` audit event.
- `acquire_brain_lock(lockId, lockType, holder)`, `release_brain_lock(lockId)`, `check_brain_lock(lockId)`
- Scheduler: `start_automation()`, `pause_automation()`, `stop_automation()`, `get_scheduler_status()`, `run_implementation_once()`, `run_review_once()`

#### Dispatch Contract

- `run_implementation_once`:
  - Rejected if scheduler state is `stopped` or `paused`.
  - Respects `maxRunningProcesses` from settings; active processes count from queue items with `picked`/`started` status.
  - Eligible queue items: `status` is `queued` or `reviewed-fix-request`.
  - Per-item disabled-project filtering: items whose `project_path` does not match an enabled project are individually skipped and logged.
  - Every tick and skip decision is durably written to `scheduler.log`.

- `run_review_once`:
  - Rejected if scheduler state is `stopped` or `paused`.
  - No capacity check (review ticks do not spawn processes).
  - Eligible queue items: `status` is `submitted` only. `reviewed-fix-request` is implementation-owned and not review-eligible.
  - Per-item disabled-project filtering (same as implementation dispatch).
  - Every tick decision is durably logged.

#### Tauri Events

- `"process-log"`: Emits `LogEvent` with streaming stdout/stderr lines.
  - `"process-complete"`: Emits `{ runId: string, exitCode: number | null, signal: string | null }` when the process exits.
- `"approval-requested"`: Emits a new `ApprovalRequest`.
- `"approval-approved"`: Emits the resolved approved `ApprovalRequest`.
- `"approval-denied"`: Emits the resolved denied `ApprovalRequest`.
- `"approval-expired"`: Emits the resolved expired `ApprovalRequest`.
- `"approval-resolved"`: Emits any non-pending `ApprovalRequest` after approve, deny, or expire.
#### Constants (`constants.ts`)

- `brainProjectManagerRoot`: `"~/.codex/brain-project-manager"`
- `VALID_PRIORITIES`, `VALID_PROJECT_AGENTS`, `VALID_QUEUE_STATUSES`, `VALID_DISPATCHER_STATUSES`, `VALID_CODEX_AUTOMATION_MODES`, `VALID_LOG_LEVELS`, `VALID_LOG_CATEGORIES`
- `QUEUE_STATUS_TRANSITIONS`: Valid state machine transitions for every queue status
- `TILDE_PREFIX`, `DEFAULT_HOME_DIR`: Path normalization constants
- `DEFAULT_SETTINGS`: Safe default Settings object

#### Validation (`validation.ts`)

- Type guards: `isValidPriority`, `isValidProjectAgent`, `isValidQueueStatus`, `isValidDispatcherStatus`, `isValidCodexAutomationMode`, `isValidLogLevel`, `isValidLogCategory`
- Assertions: `assertPriority`, `assertProjectAgent`, `assertQueueStatus`, `assertDispatcherStatus`, `assertCodexAutomationMode`
- Queue transitions: `isValidQueueTransition`, `assertQueueTransition`
- Path normalization: `normalizePath(raw, homeDir?)`
- Safe parsing: `parseBoolean(value, fallback)`, `parseIntSafe(value, fallback)`

#### Examples (`examples.ts`)

Type-level examples prove that real queue shapes from `~/.codex/brain-project-manager/queues/handoffs/` compile without casts. Sampled from live GND and school-clerk queue files.

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
- **PTY Session Contract**: `spawn_pty` returns `PtySessionMetadata` containing `pid`, `sessionId`, `runId`, `queueItemId`, `executionPath`, and `logFilePath`. Output is durably streamed to `logs/runs/<sessionId>.log` while emitting `pty-data`.
- **ProcessEvents**: `process-log` includes `line`, `stream`, and `runId`. `pty-data` includes `pid` and `chunk`. `process-complete` includes `runId`, `exitCode`, and `signal`.
- **LogSummary**: UI reads combine the `.log` and `.json` sidecars to return `LogSummary` enhanced with `queueItemId`, `projectId`, and `status`.

## Mutation Rules

- Every JSON mutation must be atomic.
- Queue status transitions must be validated before writing.
- Every runner or scheduler decision that changes state must append an audit history or durable log entry.
- Missing optional files may produce safe defaults; malformed durable state should be surfaced, not silently discarded.
