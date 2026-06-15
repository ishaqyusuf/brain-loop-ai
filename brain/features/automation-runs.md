# Feature: Automation Runs

## Purpose

Control implementation and review runner execution while keeping every run traceable to queue items, logs, and Brain docs.

## Implemented Behavior

### Manual Implementation Dispatch (`run_implementation_once`)

- Activated from the desktop app "Run Implementation" button or tray menu.
- Requires scheduler to be `running` (not `stopped` or `paused`).
- Respects `maxRunningProcesses` from `~/.codex/brain-project-manager/settings.json`.
- Counts active processes from queue items with `picked` or `started` status.
- Selects eligible queue items where `status` is `queued` or `reviewed-fix-request`.
- Filters by enabled project paths: disabled-project items are individually skipped with durable log entries.
- Every tick and skip decision is durably logged in `~/.codex/brain-project-manager/logs/scheduler.log`.

### Manual Review Dispatch (`run_review_once`)

- Activated from the desktop app "Run Review" button.
- Requires scheduler to be `running` (not `stopped` or `paused`).
- Selects eligible queue items where `status` is `submitted` only. `reviewed-fix-request` items are implementation-owned and not counted as review-eligible.
- Filters by enabled project paths: disabled-project items are individually skipped with durable log entries.
- Every tick decision is durably logged.

### Run Logs and Transcripts

- `runner::run_process` pipes process `stdout`/`stderr` into `~/.codex/brain-project-manager/logs/runs/` with collision-resistant naming.
- Each run persists a JSON metadata sidecar with `queueItemId`, `projectId`, `agent`, command, args, `cwd`, start/finish times, `status`, and exit code/signal.
- If process spawn fails, the linked `queueItemId` is transitioned to `blocked` with error detail.
- The `LogsPanel` component renders live-tailing output and per-run metadata from the sidecar files.

### UI Controls

- App header displays start/pause toggle, Run Implementation, Run Review, and Terminal buttons.
- Run results are displayed as shadcn Alert components (destructive for failures, default with CheckCircle2 for success).
- Scheduler state badge reflects current state (running, paused, stopped, error).
- LaunchAgent tab provides helper status and install/load/unload/remove actions with confirmation.

### Notifications

- Overview notification preferences can enable or disable blocked, submitted/review-ready, approval-needed, and scheduler notification categories.
- Blocked item count increases and submitted/review-ready count increases trigger a single transition-based notification rather than repeating on every poll.
- Notifications use the WebView `Notification` API when permission is granted and fall back to the in-app last-notification display otherwise.

## Runner Boundaries

- Rust owns: process launch, lifecycle, output streaming, durable log writes, queue status updates, tick logging.
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
