# API Endpoints

## Purpose

Tracks API and command endpoints.

## Tauri Commands

Planned command groups:

### Brain State

- `get_brain_status` (Implemented)
- `get_settings` (Implemented; returns normalized settings with runner/model catalog defaults)
- `update_settings` (Implemented; validates and atomically writes settings)
- `list_projects` (Implemented)
- `list_queue` (Implemented)
- `list_agent_threads` (Implemented; active/non-archived records only)
- `list_archived_agent_threads` (Implemented)
- `archive_agent_thread` (Implemented; metadata-only archival for terminal threads)
- `list_orchestrations` (Implemented; returns non-archived orchestration chat records)
- `create_orchestration` (Implemented; creates a draft orchestration chat record)
- `append_orchestration_message` (Implemented; appends a persisted orchestration chat message)
- `update_orchestration_project` (Implemented; persists the selected registered project on an orchestration chat)
- `handoff_orchestration` (Implemented; creates orchestration-linked queue items and registers missing imported projects disabled by default)
- `list_recent_logs` (Implemented)

### Project Configuration

- `inspect_project_folder` (Implemented)
- `create_project` (Implemented)
- `update_project` (Implemented)
- `set_project_enabled` (Implemented)

`inspect_project_folder` resolves a selected local folder, infers default project name/id/path values, detects whether `<project>/brain/` exists, and returns the Brain path/storage mode that project creation will use.

Project records include optional `autoMergeOnReviewPass`, `brainPath`, and `brainStorage`. When `autoMergeOnReviewPass` is false or absent, review-passed queue items request merge approval before landing. When true, Brain Loop attempts guarded landing immediately after review moves the item to `landing`.

`create_project` now prepares Brain setup before appending to `projects.json`: existing project-local `brain/` folders are preserved, while projects without `brain/` receive an external Brain at `~/.brain-loop/project-brains/<project-id>/brain/` plus managed Brain Loop instruction blocks in `AGENTS.md`/`AGENT.md` and `CLAUDE.md`.

### Automation Control

- `start_automation` (Implemented)
- `pause_automation` (Implemented)
- `stop_automation` (Implemented)
- `get_scheduler_status` (Implemented)
- `run_queue_item_once` (Implemented; launches one eligible queue item without starting the global automation loop)
- `run_implementation_once` (Implemented)
- `run_review_once` (Implemented; respects `maxReviewAgents`)

`start_automation` sets the scheduler to running and starts one background capacity loop. The loop dispatches implementation and review work every configured `capacityPollIntervalSeconds` while running, idles while paused, and exits when stopped or errored. `pause_automation` suspends new dispatch and completion-triggered follow-ups without terminating implementation or review processes already in flight.

This is app-owned automation. It does not depend on Hermes cron, Hermes gateway, or any external automation job; the desktop process/tray runtime owns queue checks, worker dispatch, review dispatch, and runner-completion callbacks.

`run_implementation_once` fills available implementation slots by preparing queue-linked thread/worktree context, transitioning eligible items to `picked`/`started`, assigning `runnerId`, and launching the selected runner through either the auditable process runner for CLI runners or the direct-provider runtime for DeepSeek/Gemini.

`run_review_once` fills available review slots by transitioning submitted items to `reviewing`, assigning `reviewRunnerId`, and launching the configured review runner/model through either the auditable process runner for CLI runners or the read-only direct-provider review runtime for DeepSeek/Gemini. A CLI review process that exits successfully without moving the item out of `reviewing` is blocked with a durable `review_runner_missing_result` audit entry. Direct review reconciles `finish_task.queueStatus` to `reviewed-fix-request`, `landing`, or `blocked`. When review requests fixes, the queue-linked worker thread stays open in `reviewed-fix-request` and runner completion asks the implementation pool to run the fix while automation is still running.

`run_queue_item_once(queueItemId)` launches exactly one eligible queue item without calling `start_automation` or starting the background capacity loop. `queued` and `reviewed-fix-request` items start implementation; `submitted` items start review. The command preserves the same project, runner, dependency, capacity, MaxLoop, worktree, direct-provider, and logging gates as the matching dispatch path, and refuses active, landing, blocked, stale-started, approved, or unsupported statuses.

When a review workflow moves a queue item to `landing`, Brain Loop applies the project's landing policy. Auto-merge projects run guarded local Git landing; approval-required projects create a destructive approval request whose approval attempts the same landing operation.

`get_scheduler_status` returns implementation and review pool counts in addition to scheduler state, tick counters, and last error.

`run_orchestration_turn` runs the selected local orchestrator runtime for an orchestration chat and appends the assistant response. Codex uses local `codex exec` in read-only sandbox mode; Claude uses local `claude --print` in plan mode with tools disabled.

### Logs And Threads

- `list_agent_threads` (Implemented; returns non-archived durable records from `~/.brain-loop/threads/*.json` by default, newest updated first)
- `list_archived_agent_threads` (Implemented; returns archived durable records from the configured thread storage root)
- `archive_agent_thread` (Implemented; marks terminal thread records archived without deleting worktrees, queue items, logs, or artifacts)
- `list_orchestrations` (Implemented; reads orchestration parent chat records)
- `create_orchestration` (Implemented; creates a Brain Loop-origin orchestration chat)
- `append_orchestration_message` (Implemented; persists a new message in an orchestration chat)
- `update_orchestration_project` (Implemented; updates orchestration project identity from an existing project record)
- `handoff_orchestration` (Implemented; writes orchestration plan/handoff artifacts, creates linked queue items, links worker thread ids, and auto-registers missing projects as disabled)
- `list_harness_capabilities` (Implemented; reports exact structured vs transcript-only provider message modes)
- `list_direct_model_runtime_contract` (Implemented; reports active direct DeepSeek/Gemini implementation providers, tool schemas, request-shape metadata, normalized event kinds, approval-required tools, and `pendingRuntime: false`)
- `preview_direct_model_provider_request` (Implemented; validates a normalized direct-provider turn and returns a DeepSeek or Gemini JSON request envelope without sending it; optional provider tool fields are omitted when no tools are supplied)
- `preview_direct_model_stream_events` (Implemented; validates a raw DeepSeek or Gemini stream chunk and returns normalized direct turn events without appending harness logs)
- `preview_direct_model_harness_events` (Implemented; converts normalized direct turn events into existing harness event records without writing them)
- `record_direct_model_harness_events` (Implemented; converts normalized direct turn events into harness events and records them through the existing harness JSONL/thread ingestion path)
- `execute_direct_model_turn` (Implemented; executes one DeepSeek/Gemini provider turn with the configured API-key environment variable, parses the response into direct events, records harness events, and leaves provider tool execution/queue transitions to the tool-loop and dispatch wrappers)
- `execute_direct_model_tool_loop` (Implemented; runs a bounded direct DeepSeek/Gemini safe-tool loop, feeds cumulative safe-tool results back to the provider, and stops with a Brain Loop approval request when a gated tool is requested)
- `execute_direct_model_tool` (Implemented; executes bounded `read_file`, `search_text`, and `finish_task` tools; returns approval-required results for `apply_patch` and `run_command`)
- `request_direct_model_tool_approval` (Implemented; creates Brain Loop approval requests for direct `apply_patch` and `run_command` tool calls, records a queue-linked `approval.required` harness event when possible, and does not execute the gated tool)
- `execute_approved_direct_model_tool` (Implemented; verifies an approved direct-model approval request, executes approved `apply_patch` or `run_command` inside the canonical execution path, records `tool.completed` when possible, and resumes started direct-provider implementation items with preserved prior safe-tool context while leaving queue transitions to the implementation dispatch wrapper)
- `start_harness_session` (Implemented; starts a live Codex app-server structured session, records provider session metadata, and sends the initial prompt when present)
- `send_harness_message` (Implemented; sends a provider turn to the live or recovered Codex harness runtime)
- `stop_harness_session` (Implemented; unsubscribes/kills the live Codex harness runtime and records session completion)
- `record_harness_event` (Implemented; appends normalized provider events and normalizes exact provider messages into durable thread records)
- `replay_harness_events` (Implemented; rebuilds the durable thread read model from harness JSONL without duplicating the log)
- `get_run_log`
- `open_thread_terminal`
- `send_terminal_input`
- `resize_terminal`
- `stop_thread_terminal`

### Approvals

- `list_approval_requests` (Implemented)
- `request_approval` (Implemented)
- `approve_request` (Implemented)
- `deny_request` (Implemented)
- `expire_request` (Implemented)

### LaunchAgent

- `get_launchagent_status`
- `install_launchagent`
- `uninstall_launchagent`

## Planning Notes

The exact command set may be refined during implementation, but commands should stay grouped by these product areas and documented when added.
