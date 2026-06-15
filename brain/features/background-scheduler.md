# Feature: Background Scheduler

## Purpose

Controls background implementation and review automation ticks while respecting settings, project eligibility, locks, and max running process limits.

## Scope

- Scheduler state machine: stopped, running, paused, error.
- Reads intervals and limits from `~/.codex/brain-project-manager/settings.json`.
- Enforces `maxRunningProcesses` before launching work.
- Menu bar and UI controls reflecting scheduler state.
- Logs every scheduler decision and skipped tick.

## Implemented Behavior

### Scheduler State Machine

| State | Behavior |
|-------|----------|
| `stopped` | Initial state. No ticks fire. Must be started before automation. |
| `running` | Ticks are allowed to fire. Implementation and review cycles execute. (Note: Interval loops are deferred to a future phase; currently ticks are triggered by app/tray interactions.) |
| `paused` | Ticks are suspended. State preserved for resume. Manual run requests (`run_implementation_once`, `run_review_once`) are rejected in this state. |
| `error` | Unexpected failure. Last error is captured and reported. |

### Rust Module (`apps/desktop/src-tauri/src/scheduler.rs`)

- Thread-safe global `SCHEDULER` singleton via `LazyLock<Mutex<Scheduler>>`.
- `SchedulerStatus` struct: state, lastTick, tickCount, skippedTicks, lastError.
- `count_active_processes()`: Scans queue items for `picked`/`started` statuses.
- `read_max_running_processes()` / `read_implementation_interval()`: Reads from settings.json.
- `can_launch_work(active, max)`: Capacity check against `maxRunningProcesses`.
- Uses `list_projects()` and `list_queue()` to filter queue items at the item level: queued or reviewed-fix-request items whose registered project is disabled are skipped individually with durable log entries recorded via `record_skip`. Items belonging to enabled projects are eligible for dispatch decisions. Global enabled-project count is not used as the sole dispatch gate.

### Tauri Commands

| Command | Purpose |
|---------|---------|
| `start_automation` | Sets scheduler to running |
| `pause_automation` | Sets scheduler to paused |
| `stop_automation` | Sets scheduler to stopped |
| `get_scheduler_status` | Returns full scheduler status |
| `run_implementation_once` | Fires one implementation tick with capacity check |
| `run_review_once` | Fires one review tick |

### Tray Menu

- "Run Once" → starts scheduler + records tick.
- "Pause Automation" → pauses scheduler.

### Dashboard Invalidation

Scheduler state changes emit UI events via `get_scheduler_status` polling.

### Notifications

- Scheduler status transitions to `error` trigger a scheduler notification category event.
- Queue read errors are surfaced as scheduler/queue warning notifications and remain visible in the Queue tab.
- Notification deduplication is transition-based so unchanged polling snapshots do not repeatedly notify the user.

## Files

- `apps/desktop/src-tauri/src/scheduler.rs`: Rust scheduler module
- `apps/desktop/src-tauri/src/lib.rs`: Tauri commands + tray menu wiring
- `packages/desktop-client/src/index.ts`: TypeScript wrappers
- `packages/brain-core/src/types.ts`: `SchedulerStatus` interface

## Brain Docs To Keep Updated

- `brain/api/endpoints.md`
- `brain/api/contracts.md`

## LaunchAgent Helper

### Status

Deferred to v2 per ADR `brain/decisions/2026-06-12-launchagent-v2-deferral.md`. The v1 desktop app relies on tray-icon persistence for background automation.

### Implemented Scope

The LaunchAgent module (`apps/desktop/src-tauri/src/launchagent.rs`) is available with the following surface:

| Command | Purpose |
|---------|---------|
| `get_launchagent_info` | Returns status, status label, plist path, v2-deferred flag, and message |
| `install_launchagent` | Writes the LaunchAgent plist to `~/Library/LaunchAgents/dev.brain-loop.helper.plist` |
| `load_launchagent` | Runs `launchctl load -w` on the installed plist |
| `unload_launchagent` | Runs `launchctl unload -w` on the installed plist |
| `remove_launchagent` | Unloads (if loaded) and removes the plist file |

### Safety Model

- All mutating operations (install, load, unload, remove) require explicit user confirmation through the LaunchAgent tab in the desktop app UI.
- The UI displays the current helper status (not_installed, installed, loaded, error) with context-appropriate action buttons.
- Status detection uses `launchctl list`; failures are reported as `Error` status with diagnostic output rather than silently collapsing to `Installed`.
- The desktop app does not automatically install or load the helper on startup.
- All commands are designed to be reversible: install/uninstall, load/unload are independent operations.

### Status States

| Status | Meaning | Available Actions |
|--------|---------|-------------------|
| `not_installed` | No plist exists | Install |
| `installed` | Plist exists but not loaded | Load, Remove |
| `loaded` | Plist installed and agent is running | Unload, Remove |
| `error` | `launchctl` check failed | Refresh, Remove |
