# Feature: Background Scheduler

## Purpose

Controls background implementation and review automation ticks while respecting settings, project eligibility, locks, and max running process limits.

## Scope

- Scheduler state machine: stopped, running, paused, error.
- Reads capacity, poll cadence, stale-run thresholds, and compatibility intervals from `~/.brain-loop/settings.toml`.
- Enforces implementation capacity before launching implementation work.
- Enforces review capacity before launching review work.
- Menu bar and UI controls reflecting scheduler state.
- Logs every scheduler decision and skipped tick.
- Brain Loop app-owned automation is the authoritative runtime. The scheduler does not require Hermes cron, Hermes gateway, or any external automation job to dispatch implementation or review work.

## Implemented Behavior

### Scheduler State Machine

| State | Behavior |
|-------|----------|
| `stopped` | Initial state. No ticks fire. Must be started before automation. |
| `running` | The app-owned capacity loop repeatedly attempts implementation and review dispatch while open slots and eligible queue items exist. Manual run requests are also allowed. |
| `paused` | Dispatch is suspended. The background loop remains alive but does not launch new work until resumed. Already-running implementation or review processes are allowed to finish naturally; their completion handlers do not launch follow-up review or fix work while paused. Manual run requests (`run_implementation_once`, `run_review_once`) are rejected in this state. |
| `error` | Unexpected failure. Last error is captured and reported. |

### Rust Module (`apps/desktop/src-tauri/src/scheduler.rs`)

- Thread-safe global `SCHEDULER` singleton via `LazyLock<Mutex<Scheduler>>`.
- `start_automation` starts the scheduler and ensures one background capacity loop is running. The loop calls a local automation triage helper every `capacityPollIntervalSeconds` while state is `running`. That helper attempts review dispatch before new implementation dispatch so submitted work is handled before more token-spending implementation agents are launched. It idles while `paused` and exits when state becomes `stopped` or `error`.
- The Start automation button is the runtime kick-off. Once started, Brain Loop keeps checking local queue capacity on the configured poll cadence and also responds to runner-completion events that request review or fix dispatch immediately when capacity is available and the scheduler is still `running`.
- `SchedulerStatus` struct: state, lastTick, tickCount, skippedTicks, implementation active/max/waiting counts, review active/max/waiting counts, lastError.
- `count_active_processes()`: Scans queue items for active implementation statuses (`picked`, `started`). `stale-started` remains visible in queue/thread state but no longer consumes implementation capacity.
- `count_active_review_processes()`: Scans queue items for active review status (`reviewing`).
- `read_max_running_processes()` / `read_implementation_interval()`: Reads from `settings.toml`. `read_max_running_processes()` now resolves implementation capacity using `maxImplementationAgents` with `maxRunningProcesses` as a backward-compatible fallback.
- `read_max_review_agents()`: Reads `maxReviewAgents` from `settings.toml`, defaulting to `1`.
- `read_capacity_poll_interval_seconds()`: Reads `capacityPollIntervalSeconds` from `settings.toml`, bounded to 1-60 seconds and defaulting to `60`.
- `can_launch_work(active, max)`: Capacity check against the relevant implementation or review agent pool.
- Uses `list_projects()` and `list_queue()` to filter queue items locally at the item level before launching agents: queued, reviewed-fix-request, or submitted items whose registered project is disabled are skipped individually with durable log entries recorded via `record_skip`. Items belonging to enabled projects are eligible for dispatch decisions. Global enabled-project count is not used as the sole dispatch gate.
- Enabled implementation items are prepared with durable agent thread metadata and a deterministic per-task Git worktree, then transitioned through `picked` to `started`, assigned a `runnerId`, and launched while open implementation capacity remains.
- Enabled submitted review items reuse the same queue-linked thread/worktree context, transition to `reviewing`, receive a `reviewRunnerId`, and launch while review capacity remains.
- Enabled submitted review items that cannot launch because the review pool is full remain `submitted` and receive `waitingReason` plus a `review_capacity_waiting` history event; their durable agent thread records mirror the waiting reason for the opened thread UI.
- Implementation runner completion submits the queue item and immediately asks the review pool to fill while automation is running. If the user pauses automation before the runner finishes, the runner still records completion but leaves follow-up review dispatch for the next resume/tick.
- Review runner completion frees review capacity and immediately asks the review pool to fill again while automation is running, so waiting submitted items do not need to wait for the next cadence tick after a review slot opens.
- Review results that request fixes keep the same queue-linked worker thread open in `reviewed-fix-request`; review completion then asks the implementation pool to run that fix while automation is running. The worker thread becomes `done` only after review/landing reaches `approved`.
- Review-passed items that transition to `landing` are finalized by the project landing policy rather than by another scheduler capacity slot. Auto-merge projects attempt landing immediately; approval-required projects remain in `landing` with a pending merge approval request until the user approves it.
- Before implementation or review capacity is measured, the dispatcher reconciles stale active queue items using `maxPickedMinutes`: stale `picked` reservations return to `queued`; stale `started` items are recovered from completed run metadata when possible, otherwise moved to `stale-started`; stale `reviewing` items are blocked when the review runner exceeds the stale threshold without a usable completion update. Review runners that exit successfully while leaving the queue in `reviewing` are blocked immediately by the runner completion guardrail.
- Worktree, spawn, and non-zero runner failures are logged and persisted on the queue item instead of silently using the main project checkout or leaving failures in memory only.
- The local triage helper writes a compact `TRIAGE:` scheduler-log entry summarizing the review and implementation dispatch decisions for each automation loop or tray "Run Once" pass.
- `bun --filter @brain-loop/desktop scheduler:qa` verifies the source-level scheduler contract for capacity settings, the running capacity loop, review-first local triage, implementation pool dispatch, review pool dispatch, direct implementation-to-review handoff, worktree-backed thread context, and main-checkout warning.

### Capacity Settings

`settings.toml` currently supports:

| Field | Purpose | Default |
|-------|---------|---------|
| `maxLoopPolicy.globalMax` | Global hard ceiling for implementation agents. | `1` |
| `maxLoopPolicy.runnerCaps` | Optional implementation caps by runner id. | Empty |
| `maxLoopPolicy.projectCaps` | Optional implementation caps by project id. | Empty |
| `maxLoopPolicy.runnerProjectCaps` | Optional implementation caps by project id and runner id. | Empty |
| `maxImplementationAgents` | Maximum implementation agents allowed at once. | Falls back to `maxRunningProcesses`, then `1`. |
| `maxReviewAgents` | Maximum review agents allowed at once. | `1` |
| `capacityPollIntervalSeconds` | Running automation loop cadence for checking open capacity and waiting queue work. | `60` |
| `maxRunningProcesses` | Legacy implementation capacity field retained for compatibility. | `1` |
| `maxPickedMinutes` | Stale reservation/run reconciliation threshold for active queue work. | `30` |
| `schedulingPolicy` | Implementation candidate order: `fix-before-new-task` or `fifo`. | `fix-before-new-task` |

Implementation dispatch sorts candidates by `schedulingPolicy`, checks task dependencies, applies `maxLoopPolicy.globalMax` as a hard ceiling, then checks runner, project, and runner-project active caps for each candidate item. A candidate blocked by dependencies receives `waitingReason`, `blockedBy`, and a `dependency_waiting` history event. A candidate blocked by MaxLoop receives a durable `waitingReason` and `maxloop_waiting` history event. Review candidates blocked by `maxReviewAgents` receive a durable `waitingReason` and `review_capacity_waiting` history event. Dispatch continues scanning later eligible items.

### Tauri Commands

| Command | Purpose |
|---------|---------|
| `start_automation` | Sets scheduler to running |
| `pause_automation` | Sets scheduler to paused |
| `stop_automation` | Sets scheduler to stopped |
| `get_scheduler_status` | Returns full scheduler status |
| `run_implementation_once` | Fires one implementation tick with capacity check |
| `run_review_once` | Fires one review tick with review capacity check |

### Tray Menu

- "Run Once" → starts scheduler, attempts review dispatch first, then implementation dispatch.
- "Pause Automation" → pauses scheduler.

### Dashboard Invalidation

Scheduler state changes emit UI events via `get_scheduler_status` polling.

### Settings Surface

- Settings > Automation groups scheduler configuration by intent:
  - `Automation runtime`: scheduler state, start/pause controls, one-shot implementation/review actions, and capacity poll interval.
  - `Agent pools`: maximum implementation agents and maximum review agents.
  - `Implementation queue order`: the persisted `schedulingPolicy` field, shown as `Fixes first` or `FIFO`.
  - `Fairness limits`: MaxLoop global cap plus explicit runner, project, and runner-project overrides. Inherited MaxLoop caps are displayed as effective values only after an override exists; the UI no longer renders every inherited runner/project combination as an editable row.
- Runner/model defaults are represented in Settings > Agents. Implementation launches resolve the configured model for the queue item's runner, and review launches use the configured default review runner/model while preserving queue-linked worktree context.

### Runner And Model Settings

`settings.toml` supports a global runner catalog:

| Field | Purpose |
|-------|---------|
| `runnerCatalog` | Supported runner entries with `id`, `label`, `enabled`, `models`, and `defaultModel`. |
| `defaultImplementationRunner` / `defaultImplementationModel` | Global default implementation runner/model. |
| `defaultReviewRunner` / `defaultReviewModel` | Global default review runner/model. |

The settings command validator prevents disabled runners from being saved as role defaults and requires selected models to exist in the selected runner's model list.

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
