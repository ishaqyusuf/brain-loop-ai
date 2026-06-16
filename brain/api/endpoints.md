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
- `list_recent_logs` (Implemented)

### Project Configuration

- `create_project` (Implemented)
- `update_project` (Implemented)
- `set_project_enabled` (Implemented)

Project records include optional `autoMergeOnReviewPass`. When false or absent, review-passed queue items request merge approval before landing. When true, Brain Loop attempts guarded landing immediately after review moves the item to `landing`.

### Automation Control

- `start_automation` (Implemented)
- `pause_automation` (Implemented)
- `stop_automation` (Implemented)
- `get_scheduler_status` (Implemented)
- `run_implementation_once` (Implemented)
- `run_review_once` (Implemented; respects `maxReviewAgents`)

`start_automation` sets the scheduler to running and starts one background capacity loop. The loop dispatches implementation and review work every configured `capacityPollIntervalSeconds` while running, idles while paused, and exits when stopped or errored.

`run_implementation_once` fills available implementation slots by preparing queue-linked thread/worktree context, transitioning eligible items to `picked`/`started`, assigning `runnerId`, and launching the selected provider through the auditable process runner.

`run_review_once` fills available review slots by transitioning submitted items to `reviewing`, assigning `reviewRunnerId`, and launching the configured review runner/model through the auditable process runner. A review process that exits successfully without moving the item out of `reviewing` is blocked with a durable `review_runner_missing_result` audit entry.

When a review workflow moves a queue item to `landing`, Brain Loop applies the project's landing policy. Auto-merge projects run guarded local Git landing; approval-required projects create a destructive approval request whose approval attempts the same landing operation.

`get_scheduler_status` returns implementation and review pool counts in addition to scheduler state, tick counters, and last error.

### Logs And Threads

- `list_agent_threads` (Implemented; returns non-archived durable records from `~/.brain-loop/threads/*.json` by default, newest updated first)
- `list_archived_agent_threads` (Implemented; returns archived durable records from the configured thread storage root)
- `archive_agent_thread` (Implemented; marks terminal thread records archived without deleting worktrees, queue items, logs, or artifacts)
- `list_harness_capabilities` (Implemented; reports exact structured vs transcript-only provider message modes)
- `list_direct_model_runtime_contract` (Implemented; reports planned direct DeepSeek/Gemini providers, tool schemas, request-shape metadata, normalized event kinds, and approval-required tools while dispatch remains disabled)
- `preview_direct_model_provider_request` (Implemented; validates a normalized direct-provider turn and returns a DeepSeek or Gemini JSON request envelope without sending it)
- `preview_direct_model_stream_events` (Implemented; validates a raw DeepSeek or Gemini stream chunk and returns normalized direct turn events without appending harness logs)
- `preview_direct_model_harness_events` (Implemented; converts normalized direct turn events into existing harness event records without writing them)
- `record_direct_model_harness_events` (Implemented; converts normalized direct turn events into harness events and records them through the existing harness JSONL/thread ingestion path)
- `execute_direct_model_tool` (Implemented; executes bounded `read_file`, `search_text`, and `finish_task` tools; returns approval-required results for `apply_patch` and `run_command`)
- `request_direct_model_tool_approval` (Implemented; creates Brain Loop approval requests for direct `apply_patch` and `run_command` tool calls without executing them)
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
