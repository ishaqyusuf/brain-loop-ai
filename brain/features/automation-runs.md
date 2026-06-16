# Feature: Automation Runs

## Purpose

Control implementation and review runner execution while keeping every run traceable to queue items, logs, and Brain docs.

## Implemented Behavior

### Local Automation Triage

- The background automation loop uses local queue/project state before launching token-spending runners.
- Each loop calls a local automation triage helper every configured `capacityPollIntervalSeconds`. The helper attempts review dispatch before new implementation dispatch, so already-submitted work is handled before starting additional implementation agents.
- Empty queues, disabled projects, at-capacity pools, unsupported agents, stale active work, and launch failures are decided locally and recorded in scheduler logs without asking an agent to reason over ineligible work.
- Each helper pass writes a compact `TRIAGE:` scheduler-log entry summarizing the review and implementation dispatch results.
- Tray "Run Once" follows the same review-first then implementation order.

### Manual Implementation Dispatch (`run_implementation_once`)

- Activated from the desktop app "Run Implementation" button or tray menu.
- Requires scheduler to be `running` (not `stopped` or `paused`).
- Respects implementation capacity from `maxImplementationAgents`, falling back to legacy `maxRunningProcesses`.
- Reconciles stale active queue items before capacity is measured.
- Counts active implementation agents from queue items with `picked` or `started` status. `stale-started` is visible recovery state and does not consume an implementation slot.
- Selects eligible queue items where `status` is `queued` or `reviewed-fix-request`.
- Orders eligible implementation candidates by `settings.schedulingPolicy`: `fix-before-new-task` puts `reviewed-fix-request` before new queued work, while `fifo` sorts all eligible work by creation time.
- Dependency metadata is honored before capacity launch. `dependsOn` queue ids must be `approved`; missing, blocked, cyclic, self-referential, or not-yet-approved dependencies leave the candidate queued with `waitingReason`, `blockedBy`, and a `dependency_waiting` history entry.
- Filters by enabled project paths: disabled-project items are individually skipped with durable log entries.
- Prepares or updates durable agent thread metadata for each enabled eligible item under `settings.threadStorageRoot` (default `~/.brain-loop/threads`).
- Applies `settings.executionStrategy` before the item is considered ready for implementation dispatch. `worktree` creates or reuses a per-task Git worktree under `settings.worktreeStorageRoot`; `main-checkout` runs from the registered project checkout; `auto` tries the worktree path first and falls back to the main checkout when worktree prep fails. Queue items persist `executionPath`, `worktreePath`, and `executionStrategy`.
- If worktree preparation fails while `executionStrategy` is `worktree`, the item stays in its current status with `lastError` and a `worktree_prepare_failed` history entry.
- Fills open implementation slots in one tick: enabled eligible items are transitioned to `picked`, then `started`, receive a `runnerId`, and are launched through the auditable process runner.
- MaxLoop policy is evaluated for each enabled implementation candidate. Global, runner, project, and runner-project caps can block launch; blocked candidates keep their queue status and receive `waitingReason` plus a `maxloop_waiting` history event.
- Provider launch models resolve from queue `recommendedModel` first, then the persisted runner/model catalog in `settings.toml`, with backward-compatible built-in defaults for `open-code`, `antigravity`, and `codex` when settings are missing. The catalog also includes disabled direct-provider entries for DeepSeek and Gemini; those entries are settings-visible but require the direct Brain Loop tool-loop runtime before dispatch can use them.
- Implementation and review prompts include recommended runner/model metadata and the resolved execution strategy so launched agents can see the intended handoff and workspace context.
- Spawn failures and non-zero runner exits block the active queue item with a durable `lastError`.
- Successful implementation runner exits submit the queue item when it is still `started`, then immediately ask the review pool to fill if automation is running.
- Stale `picked` reservations older than `maxPickedMinutes` are returned to `queued`; stale `started` items are submitted or blocked from completed run metadata when possible, otherwise moved to `stale-started`.
- Every tick and skip decision is durably logged in `~/.brain-loop/logs/scheduler.log`.

### Manual Review Dispatch (`run_review_once`)

- Activated from the desktop app "Run Review" button.
- Requires scheduler to be `running` (not `stopped` or `paused`).
- Respects review capacity from `maxReviewAgents`.
- Reconciles stale active queue items before capacity is measured.
- Counts active review agents from queue items with `reviewing` status.
- Selects eligible queue items where `status` is `submitted` only. `reviewed-fix-request` items are implementation-owned and not counted as review-eligible.
- Filters by enabled project paths: disabled-project items are individually skipped with durable log entries.
- When the review pool is at capacity, enabled submitted items remain `submitted` and receive a durable `waitingReason` plus a `review_capacity_waiting` history event. The queue-linked agent thread mirrors the same waiting reason for the opened thread UI.
- Prepares or updates the same queue-linked durable agent thread metadata for each enabled submitted item.
- Reuses the queue item's existing execution/worktree context for review, or applies the configured execution strategy to older submitted items that do not yet have one.
- Fills open review slots in one tick: enabled submitted items are transitioned to `reviewing`, receive a `reviewRunnerId`, and are launched through the configured default review runner/model using the same execution strategy context.
- Review result transitions to `reviewed-fix-request` or `landing` stamp `reviewedAt`, giving review result telemetry independent of final approval time.
- When review passes and a queue item reaches `landing`, Brain Loop applies the registered project's landing policy. Projects with `autoMergeOnReviewPass` enabled attempt guarded landing immediately; projects without it create a pending destructive merge approval request and keep the queue item in `landing` with `waitingReason`.
- Guarded landing marks same-checkout work as `approved` with `landingStatus: not_needed`. Worktree-backed landing verifies both checkouts are git worktrees for the same repository, verifies the implementation checkout is a registered worktree, acquires a landing lock, preserves dirty project-checkout changes in a pre-landing commit, commits dirty implementation work, merges the implementation commit into local `main` or `master`, records landing metadata, and only then transitions `landing` to `approved`.
- Landing failures block the queue item with `landingStatus: blocked`, `landingError`, `lastError`, and a `landing_blocked` history event instead of approving review-passed work.
- Spawn failures and non-zero review runner exits block the active queue item with a durable `lastError`.
- If a review runner exits successfully but leaves its queue item in `reviewing`, Brain Loop immediately blocks the item with `lastError` and a `review_runner_missing_result` history entry. A clean process exit is not treated as review approval unless the review workflow writes a supported queue transition.
- Review transition stamps `agentStartedAt` so stale `reviewing` items can be detected. Stale `reviewing` items are blocked when they exceed `maxPickedMinutes` without a usable completion update.
- Every tick decision is durably logged.

### Run Logs and Transcripts

- `runner::run_process` pipes process `stdout`/`stderr` into `~/.brain-loop/logs/runs/` with collision-resistant naming.
- Each run persists a JSON metadata sidecar with `queueItemId`, `projectId`, `agent`, command, args, `cwd`, start/finish times, `status`, and exit code/signal.
- Queue-linked agent thread records are updated with the actual timestamped log path for implementation and review runs, including spawn-failure metadata paths, so thread lists can trace back to durable transcripts.
- If process spawn fails, the linked `queueItemId` is transitioned to `blocked` with error detail.
- If a launched runner exits non-zero while the queue item is still `started` or `reviewing`, the runner marks the queue item `blocked` with a `runner_exit_failed` history entry.
- If an implementation runner exits successfully while the queue item is still `started`, the runner marks it `submitted` with a `runner_completed` history entry before requesting review dispatch.
- If a review runner exits successfully while the queue item is still `reviewing`, the runner marks it `blocked` with a `review_runner_missing_result` history entry for manual reconciliation.
- Queue-linked agent thread records are refreshed after runner-driven queue mutations so sidebar/thread status, `lastError`, and `waitingReason` stay aligned with the queue item.
- Queue-linked agent thread records are refreshed when landing starts waiting for merge approval, succeeds, or blocks.
- The `LogsPanel` component renders live-tailing output and per-run metadata from the sidecar files.

### Structured Harness Events

- Brain Loop now has a structured harness ingestion path beside transcript capture. `HarnessEventInput` records provider-native session, turn, message, tool, approval, file, log, completion, and failure events.
- Normalized harness events append to `~/.brain-loop/harness/events/*.jsonl` for replay/audit. Normalized exact user/agent/approval messages append to the queue-linked durable thread, and duplicate provider events are ignored by `sourceEventId`.
- `list_harness_capabilities` reports provider message modes. Codex is marked as structured-provider-events capable for exact message ingestion through `codex app-server --stdio`. OpenCode and Antigravity remain transcript-only until stable structured session/event sources are verified.
- Direct DeepSeek and Gemini now expose a read-only direct runtime contract through `list_direct_model_runtime_contract`. The contract defines built-in direct providers, provider request shapes, tool schemas (`read_file`, `search_text`, `apply_patch`, `run_command`, `finish_task`), normalized structured event kinds, and approval-required tool names.
- `preview_direct_model_provider_request` validates a normalized direct-provider turn and builds the provider-specific JSON request envelope without sending it. DeepSeek previews use OpenAI-chat `/chat/completions`; Gemini previews use `streamGenerateContent` with function declarations and function-response content parts. Dispatch remains disabled for direct-provider runners until provider calls, tool execution, approval gating, and queue transitions are wired end to end.
- `preview_direct_model_stream_events` validates a raw provider stream chunk and maps it into normalized direct turn events without writing harness logs. DeepSeek previews handle SSE `choices[].delta` content/tool-call chunks plus usage; Gemini previews handle candidate content parts, `functionCall`, `finishReason`, and `usageMetadata`.
- `preview_direct_model_harness_events` converts normalized direct turn events into existing `HarnessEventInput` records without appending JSONL or mutating threads. Consecutive `message.delta` bodies are synthesized into `message.completed` when a turn completes, making direct-provider output compatible with the existing exact-message thread renderer once persistence is enabled. This bridges the direct-provider preview path to the durable harness contract while keeping persistence disabled until the live direct runtime is wired.
- `record_direct_model_harness_events` persists normalized direct turn events through the existing harness JSONL/thread ingestion path. It reuses the same conversion and completed-message synthesis as the preview command, but still does not call providers, read API keys, execute tools, or transition queues.
- `execute_direct_model_tool` provides the first bounded direct tool execution surface. `read_file` and `search_text` operate only on canonicalized relative paths inside the supplied execution path with line/result/file-size caps; `finish_task` returns the requested summary/status as a tool result. `apply_patch` and `run_command` return approval-required results and do not mutate files or launch commands yet.
- `request_direct_model_tool_approval` creates Brain Loop approval requests for gated direct tools. `apply_patch` requests a destructive approval and `run_command` requests a command approval, preserving queue/project/runner/session metadata when supplied. Approval resolution does not execute the gated tool yet.
- `start_harness_session`, `send_harness_message`, `stop_harness_session`, `record_harness_event`, and `replay_harness_events` provide the Tauri command surface for structured harness sessions. Existing process-runner dispatch remains the compatibility path for transcript-only runners.

### UI Controls

- App header displays start/pause toggle, Run Implementation, Run Review, and Terminal buttons.
- Settings > Automation exposes capacity poll interval, maximum implementation agents, maximum review agents, MaxLoop caps, and queue selection policy.
- Run results are displayed as shadcn Alert components (destructive for failures, default with CheckCircle2 for success).
- The run-log list uses shadcn Button and Empty primitives, while the bottom composer uses the shadcn Textarea primitive.
- Opened durable agent threads show transcript cards for linked implementation and review run logs; selecting a card reads through the safe log-file command and displays a bounded preview in the chat surface.
- Opened durable agent threads label their message provenance as exact provider messages, Brain timeline, or transcript-backed, and exact provider messages display provider/model metadata when present.
- Opened durable agent threads show a waiting alert when the thread metadata carries `waitingReason`, including review-capacity waits.
- Settings > Agents shows each runner's harness message capture mode and runner kind so exact-message support is not implied for transcript-only or planned direct-provider runtimes.
- Settings > Agents appends the direct runtime contract summary for planned direct providers so users can see the tool/event/request-shape boundary without enabling dispatch.
- Scheduler state badge reflects current state (running, paused, stopped, error).
- LaunchAgent tab provides helper status and install/load/unload/remove actions with confirmation.

### Notifications

- Overview notification preferences can enable or disable blocked, submitted/review-ready, approval-needed, and scheduler notification categories.
- Blocked item count increases and submitted/review-ready count increases trigger a single transition-based notification rather than repeating on every poll.
- Pending approval events trigger the approval notification category and, when Settings > Permissions & Approvals > Permission-required sound is enabled, a short deduplicated audible cue.
- Notifications use the WebView `Notification` API when permission is granted and fall back to the in-app last-notification display otherwise.

## Runner Boundaries

- Rust owns: process launch, lifecycle, output streaming, durable log writes, queue status updates, tick logging.
- Rust owns: Codex harness runtime lifecycle, direct-provider event-to-harness persistence, bounded safe direct tool execution, direct-provider gated-tool approval requests, structured harness event append, replay recovery, provider capability reporting, and normalized exact-message writes.
- React owns: status display, user actions, disabled states, output rendering.
- Queue status transitions remain inside the supported Brain queue status enum.

## Implementation Plans

- `brain/plans/2026-06-12-feature-manual-run-dispatch.md`
- `brain/plans/2026-06-12-feature-run-logs-transcripts.md`
- `brain/plans/2026-06-12-feature-notifications-packaging-release.md`

## Brain Docs To Keep Updated

- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/product/roadmap.md`
