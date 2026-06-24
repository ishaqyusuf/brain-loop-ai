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
- Orchestration-linked queue items are normal implementation candidates. They may carry `orchestrationId` and `orchestrationTitle`, but dispatch eligibility still follows the registered project's enabled state; externally imported projects are registered disabled by default.
- Filters by enabled runner catalog entries: items whose configured runner is disabled or missing are skipped with durable `waitingReason` and a `runner_disabled_waiting` history entry. This includes direct DeepSeek/Gemini entries, which are dispatch-capable only after they are enabled in Settings > Agents or selected as an enabled role default.
- Prepares or updates durable agent thread metadata for each enabled eligible item under `settings.threadStorageRoot` (default `~/.brain-loop/threads`).
- Applies `settings.executionStrategy` before the item is considered ready for implementation dispatch. `worktree` creates or reuses a per-task Git worktree under `settings.worktreeStorageRoot`; `main-checkout` runs from the registered project checkout; `auto` tries the worktree path first and falls back to the main checkout when worktree prep fails. Queue items persist `executionPath`, `worktreePath`, and `executionStrategy`.
- If worktree preparation fails while `executionStrategy` is `worktree`, the item stays in its current status with `lastError` and a `worktree_prepare_failed` history entry.
- Fills open implementation slots in one tick: enabled eligible items are transitioned to `picked`, then `started`, receive a `runnerId`, and are launched through either the auditable process runner for CLI agents or the Brain Loop-owned direct runtime for DeepSeek/Gemini direct providers.
- Direct-provider implementation items use a direct-native prompt that embeds queue context and active handoff content, and explicitly avoids asking the model to read global skill files because direct tools are scoped to the execution path.
- A direct implementation run that reaches `finish_task` transitions the queue item from `started` to `submitted` by default, or to `blocked` when the tool reports `queueStatus: "blocked"`. Unsupported finish statuses block the item with a durable error.
- A direct implementation run that requests `apply_patch` or `run_command` creates a Brain Loop approval request, records the approval event in the thread, preserves prior safe-tool context on the approval, and leaves the queue item `started` with `waitingReason` until the approval flow is resolved. Approval-waiting direct runs are not stale-reconciled as missing process sidecars. When `execute_approved_direct_model_tool` runs an approved direct tool for that started item, Brain Loop clears the waiting reason and resumes the provider loop in the background with the prior safe-tool context plus the approved tool result.
- Direct provider failures or max-iteration stops block the queue item because no process metadata sidecar exists for later recovery.
- MaxLoop policy is evaluated for each enabled implementation candidate. Global, runner, project, and runner-project caps can block launch; blocked candidates keep their queue status and receive `waitingReason` plus a `maxloop_waiting` history event.
- Provider launch models resolve from queue `recommendedModel` first, then the persisted runner/model catalog in `settings.toml`, with backward-compatible built-in defaults for `open-code`, `antigravity`, `codex`, `direct-deepseek`, and `direct-gemini` when settings are missing. Direct DeepSeek/Gemini entries use the Brain Loop direct runtime for implementation dispatch instead of a CLI process.
- Implementation and review prompts include recommended runner/model metadata and the resolved execution strategy so launched agents can see the intended handoff and workspace context.
- Spawn failures and non-zero runner exits block the active queue item with a durable `lastError`.
- Successful implementation runner exits submit the queue item when it is still `started`, then immediately ask the review pool to fill only when automation is still `running`. If automation was paused while the worker was running, the worker finishes and the queue remains `submitted` until automation resumes.
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
- When a review runner exits successfully and the review result requests fixes, the same queue-linked worker thread remains open (`reviewed-fix-request`) and Brain Loop asks the implementation pool to run the fix while automation is still `running`. After the fix runner submits again, review is requested again, creating the implementation -> review -> fix loop until the item lands/approves or blocks.
- When a review runner exits successfully, Brain Loop immediately asks the review pool to fill again while automation is running, so submitted items waiting on review capacity can start as soon as a slot is freed. Paused automation allows the current review to finish but prevents new review or fix follow-up dispatch.
- Review transition stamps `agentStartedAt` so stale `reviewing` items can be detected. Stale `reviewing` items are blocked when they exceed `maxPickedMinutes` without a usable completion update.
- Every tick decision is durably logged.

### Per-Task Manual Dispatch (`run_queue_item_once`)

- Activated from row-level `Start` actions in task/queue surfaces.
- Does not start or resume the global scheduler loop; it launches only the requested queue item.
- Reconciles stale active queue items before reading the requested item.
- For `queued` and `reviewed-fix-request`, applies the same enabled-project, enabled-runner, dependency, capacity, MaxLoop, worktree/execution strategy, and implementation launch path used by implementation dispatch.
- For `submitted`, applies the same enabled-project, review-runner, review-capacity, execution-context, and review launch path used by review dispatch.
- Refuses active, landing/approval-owned, blocked, stale-started, approved, or unsupported statuses without launching other work.
- Records manual dispatch, waiting, and capacity decisions in scheduler logs while preserving runner stdout/stderr logs and queue-linked thread updates.

### Run Logs and Transcripts

- `runner::run_process` pipes process `stdout`/`stderr` into `~/.brain-loop/logs/runs/` with collision-resistant naming.
- Each run persists a JSON metadata sidecar with `queueItemId`, `projectId`, `agent`, command, args, `cwd`, start/finish times, `status`, and exit code/signal.
- Queue-linked agent thread records are updated with the actual timestamped log path for implementation and review runs, including spawn-failure metadata paths, so thread lists can trace back to durable transcripts.
- If process spawn fails, the linked `queueItemId` is transitioned to `blocked` with error detail.
- If a launched runner exits non-zero while the queue item is still `started` or `reviewing`, the runner marks the queue item `blocked` with a `runner_exit_failed` history entry.
- If an implementation runner exits successfully while the queue item is still `started`, the runner marks it `submitted` with a `runner_completed` history entry before requesting review dispatch.
- If a review runner exits successfully while the queue item is still `reviewing`, the runner marks it `blocked` with a `review_runner_missing_result` history entry for manual reconciliation.
- Queue-linked worker threads are not considered done when implementation work merely submits. They stay waiting during `submitted` and `reviewed-fix-request`, stay active during `reviewing`/`landing`, and only become done once the queue item reaches `approved`.
- Queue-linked agent thread records are refreshed after runner-driven queue mutations so sidebar/thread status, `lastError`, and `waitingReason` stay aligned with the queue item.
- Queue-linked agent thread records are refreshed when landing starts waiting for merge approval, succeeds, or blocks.
- The `LogsPanel` component renders live-tailing output and per-run metadata from the sidecar files.

### Structured Harness Events

- Brain Loop now has a structured harness ingestion path beside transcript capture. `HarnessEventInput` records provider-native session, turn, message, tool, approval, file, log, completion, and failure events.
- Normalized harness events append to `~/.brain-loop/harness/events/*.jsonl` for replay/audit. Normalized exact user/agent/approval messages append to the queue-linked durable thread, and duplicate provider events are ignored by `sourceEventId`.
- `list_harness_capabilities` reports provider message modes. Codex is marked as structured-provider-events capable for exact message ingestion through `codex app-server --stdio`. OpenCode and Antigravity remain transcript-only until stable structured session/event sources are verified.
- Direct DeepSeek and Gemini expose the direct runtime contract through `list_direct_model_runtime_contract`. The contract defines built-in direct providers, provider request shapes, tool schemas (`read_file`, `search_text`, `apply_patch`, `run_command`, `finish_task`), normalized structured event kinds, approval-required tool names, and that implementation and review dispatch are wired.
- `preview_direct_model_provider_request` validates a normalized direct-provider turn and builds the provider-specific JSON request envelope without sending it. DeepSeek previews use OpenAI-chat `/chat/completions`; Gemini previews use `streamGenerateContent` with function declarations and function-response content parts.
- `preview_direct_model_stream_events` validates a raw provider stream chunk and maps it into normalized direct turn events without writing harness logs. DeepSeek previews handle SSE `choices[].delta` content/tool-call chunks plus usage, preserving a stream key based on provider tool-call index when present so partial argument deltas can be reassembled even when later chunks omit the provider tool id. Gemini previews handle candidate content parts, `functionCall`, `finishReason`, and `usageMetadata`, and include stream-array/payload sequence in generated event ids so harness dedupe does not drop later chunks.
- `preview_direct_model_harness_events` converts normalized direct turn events into existing `HarnessEventInput` records without appending JSONL or mutating threads. Consecutive `message.delta` bodies are synthesized into `message.completed` when a turn completes, making direct-provider output compatible with the existing exact-message thread renderer.
- `record_direct_model_harness_events` persists normalized direct turn events through the existing harness JSONL/thread ingestion path. It reuses the same conversion and completed-message synthesis as the preview command, but still does not call providers, read API keys, execute tools, or transition queues.
- `execute_direct_model_turn` executes one direct-provider turn for DeepSeek or Gemini using `DEEPSEEK_API_KEY` or `GEMINI_API_KEY`, parses the full provider response through the same normalized stream parser, and records resulting harness events. It records `turn.started` before API-key lookup/provider HTTP work and records `session.failed` when the API key is missing/empty or provider setup, request, response-read, HTTP-status, or response parsing fails. The standalone command does not execute provider tool calls, apply patches, run commands, or transition queues.
- `execute_direct_model_tool_loop` runs a bounded direct-provider safe-tool loop for DeepSeek or Gemini. Each iteration executes one provider turn, collects model-requested tool calls, executes safe tools (`read_file`, `search_text`, `finish_task`), records `tool.completed` harness events, and feeds the cumulative tool-result context into the next provider turn. If the model requests `apply_patch` or `run_command`, Brain Loop creates the approval request and stops the loop without mutating files or launching commands. The standalone command does not transition queues; implementation dispatch wraps it with queue reconciliation.
- Gemini continuation turns preserve the provider tool-call id on both synthetic `functionCall` bridge parts and the matching `functionResponse` parts so Gemini 3 function-response history can correlate tool results to model calls.
- `execute_direct_model_tool` provides the first bounded direct tool execution surface. `read_file` and `search_text` operate only on canonicalized relative paths inside the supplied execution path with line/result/file-size caps; `finish_task` returns the requested summary/status as a tool result. `apply_patch` and `run_command` return approval-required results and do not mutate files or launch commands yet.
- `request_direct_model_tool_approval` creates Brain Loop approval requests for gated direct tools. `apply_patch` requests a destructive approval and `run_command` requests a command approval, preserving queue/project/runner/session metadata when supplied. When queue context is present, Brain Loop also records an `approval.required` harness event so the pending permission appears in the queue-linked thread. Approval resolution by itself does not execute the gated tool; an explicit approved-tool execution command is required.
- `execute_approved_direct_model_tool` verifies an approved direct-model approval request before running gated tools. Approved `apply_patch` runs `git apply --whitespace=nowarn` inside the canonical execution path. Approved `run_command` runs `/bin/sh -lc` inside the canonical execution path with a bounded timeout. Both paths capture output/exit metadata and record `tool.completed` harness events when queue context is present. For started direct-provider implementation items, the command also resumes the provider loop with preserved prior safe-tool results plus the approved tool result; queue transitions remain owned by the implementation dispatch wrapper.
- Direct-provider review dispatch can use enabled DeepSeek/Gemini runners as the default review runner. Review runs use read-only direct tools (`read_file`, `search_text`, `finish_task`) and reconcile `finish_task.queueStatus` to `reviewed-fix-request`, `landing`, or `blocked`. Review-requested fixes return to implementation capacity; landing results use the same project landing policy as CLI review.
- `start_harness_session`, `send_harness_message`, `stop_harness_session`, `record_harness_event`, and `replay_harness_events` provide the Tauri command surface for structured harness sessions. Existing process-runner dispatch remains the compatibility path for transcript-only runners.

### UI Controls

- App header displays start/pause toggle, Run Implementation, Run Review, and Terminal buttons.
- Settings > Automation exposes runtime controls and poll cadence under `Automation runtime`, implementation/review concurrency under `Agent pools`, the persisted `schedulingPolicy` under `Implementation queue order`, and MaxLoop global plus explicit override caps under `Fairness limits`.
- Settings > Agents allows direct DeepSeek/Gemini runners as implementation and review defaults when enabled. Direct review uses a read-only tool subset and the same queue transition contract as CLI review.
- Run results are displayed as shadcn Alert components (destructive for failures, default with CheckCircle2 for success).
- The run-log list uses shadcn Button and Empty primitives, while the bottom composer uses the shadcn Textarea primitive.
- Opened durable agent threads show transcript cards for linked implementation and review run logs; selecting a card reads through the safe log-file command and displays a bounded preview in the chat surface.
- Opened durable agent threads label their message provenance as exact provider messages, Brain timeline, or transcript-backed, and exact provider messages display provider/model metadata when present.
- Opened durable agent threads show a waiting alert when the thread metadata carries `waitingReason`, including review-capacity waits.
- Settings > Agents shows each runner's harness message capture mode and runner kind so exact-message support is not implied for transcript-only runners.
- Settings > Agents appends the direct runtime contract summary for direct providers so users can see the tool/event/request-shape boundary used by implementation dispatch.
- The Approvals panel executes approved direct-model patch/command requests immediately after the user approves them, using the approval's stored direct tool-call metadata, so approval-waiting direct implementation items can continue without the UI needing the original model tool input.
- Scheduler state badge reflects current state (running, paused, stopped, error).
- LaunchAgent tab provides helper status and install/load/unload/remove actions with confirmation.

### Notifications

- Overview notification preferences can enable or disable blocked, submitted/review-ready, approval-needed, and scheduler notification categories.
- Blocked item count increases and submitted/review-ready count increases trigger a single transition-based notification rather than repeating on every poll.
- Pending approval events trigger the approval notification category and, when Settings > Permissions & Approvals > Permission-required sound is enabled, a short deduplicated audible cue.
- Notifications use the WebView `Notification` API when permission is granted and fall back to the in-app last-notification display otherwise.

## Runner Boundaries

- Rust owns: process launch, lifecycle, output streaming, durable log writes, queue status updates, tick logging.
- Rust owns: Codex harness runtime lifecycle, direct-provider turn execution, bounded direct-provider implementation/review tool loops, direct-provider event-to-harness persistence, bounded safe direct tool execution, direct-provider gated-tool approval requests, approved direct mutating tool execution, direct implementation/review queue reconciliation, structured harness event append, replay recovery, provider capability reporting, and normalized exact-message writes.
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
