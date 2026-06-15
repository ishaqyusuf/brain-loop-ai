# Progress

## Purpose

Tracks durable implementation progress and planning changes.

## Updates

### Implement Rust Brain State Readers Approval (2026-06-15)

- Approved Fix 1 after confirming `getBrainStatus` handles camelCase native responses and `list_queue` returns valid items plus typed per-file read/parse errors.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-implement-rust-brain-state-readers-review-v3.md`.
- Moved active fix handoff to `brain/handoffs/completed/2026-06-12-implement-rust-brain-state-readers-fix-1.md`.
- Moved the task and plan to Done.
- Bun typechecks passed for `@brain-loop/desktop-client` and `@brain-loop/desktop`. Cargo validation remains blocked because Cargo is not installed on host.

### Implement Rust Brain State Readers Fix 1 (2026-06-15)

- Changed `list_queue` to return `QueueListResponse` with valid `items` plus per-file `errors` for malformed or unreadable queue JSON files.
- Added shared `QueueReadError` and `QueueListResponse` TypeScript contracts and exported them from `@brain-loop/brain-core`.
- Updated `packages/desktop-client` so `listQueue()` exposes the typed queue response.
- Updated the desktop app to keep rendering valid queue items while surfacing queue read errors in the Queue tab.
- Confirmed `getBrainStatus()` already handles the current camelCase native response while retaining snake_case tolerance.
- Updated `brain/api/contracts.md` and `brain/features/brain-state.md` for the queue response shape.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop-client typecheck` and `bun --filter @brain-loop/desktop typecheck`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Build Project Configuration Surface Approval (2026-06-15)

- Approved the project configuration surface after confirming project registry viewing, atomic create/update/enable mutations, validation/error handling, missing-path warnings, disabled-project active-queue warnings, and Brain documentation.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-build-project-configuration-surface-review-v2.md`.
- Moved handoff to `brain/handoffs/completed/2026-06-12-build-project-configuration-surface-handoff.md`.
- Moved the task and plan to Done.
- Bun typecheck/build were not run because fast Bun monorepo command discipline is active. Cargo validation remains blocked because Cargo is not installed on host.

### Build Project Configuration Surface (2026-06-15)

- Added Rust-backed project registry mutation commands: `create_project`, `update_project`, and `set_project_enabled`, using validation plus atomic writes to `projects.json`.
- Extended `list_projects` responses with a read-only `pathExists` hint so missing project roots can be shown without writing that field back to Brain JSON.
- Added desktop-client wrappers for project create, update, and enable/disable commands.
- Added a Codex-standard `Projects` tab with a compact projects table, enabled/disabled/missing-path/active-disabled metrics, missing-path warnings, disabled-project active queue warnings, create/edit sheet, and inline enable/disable confirmation.
- Updated `brain/features/project-configuration.md`, `brain/api/endpoints.md`, and `brain/api/contracts.md`.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Build Queue Dashboard And Filters Approval (2026-06-15)

- Approved Fix 1 after confirming project/status/agent/priority/stale filters, active/blocked/stale/submitted/approved summary metrics, stale and disabled/unknown project warnings, expanded queue details metadata, visible queue-fetch error state, and aligned queue status contracts.
- Landing was not needed because implementation happened directly in the registered project checkout.
- Review file: `brain/reviews/2026-06-15-build-queue-dashboard-and-filters-review-v2.md`.
- Moved active fix handoff to `brain/handoffs/completed/2026-06-15-build-queue-dashboard-and-filters-fix-1.md`.
- Moved the task and plan to Done.
- Bun typecheck/build were not run because fast Bun monorepo command discipline is active. Cargo validation remains blocked because Cargo is not installed on host.

### Build Queue Dashboard And Filters Fix 1 (2026-06-15)

- Added queue filters for project, priority, and stale active-work age alongside existing status and agent filters.
- Added queue summary metrics for active, blocked, stale, submitted, and approved work.
- Surfaced stale active items and disabled/unknown project assignments as warnings without mutating queue JSON.
- Expanded queue item details to include worktree path, active handoff path, review path, runner/session IDs, lease timing, and an explicit last-error value even when empty.
- Added a visible queue-fetch error state and loaded project registry data for disabled-project warning context.
- Aligned the shared TypeScript queue status union, queue status constants, API docs, and Rust queue mutation validator with the active Brain lifecycle statuses: `stale-started`, `reviewing`, and `landing`.
- Updated `brain/features/queue-dashboard.md` with completed dashboard behavior.
- Checks run: targeted code inspection only per fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`. `cargo check` remains blocked by the missing Rust/Cargo toolchain on host.

### Add PTY-Backed Thread Terminals Fix 3 (2026-06-15)

- Updated `brain/api/contracts.md` so the Tauri command table explicitly documents `close_pty(pid) -> Result<(), String>` and states that it removes backend session state and attempts to terminate the child process.
- No code validation needed beyond documentation inspection because no implementation code changed.

### Add Background Scheduler Controls Fix 3 (2026-06-15)

- Updated `run_review_once` so review eligibility follows the Brain review contract: only `submitted` queue items are counted as review-eligible. `reviewed-fix-request` items are correctly excluded from review ticks.
- Updated review tick messages to no longer describe `reviewed-fix-request` as review-eligible.
- `bun --cwd apps/desktop typecheck`: pass (exit 0)
- `cargo check`: Blocked by missing Rust/Cargo toolchain on host.
- Manual checks: Blocked by missing Rust/Cargo toolchain.

### Add PTY-Backed Thread Terminals Fix 2 (2026-06-14)

- Made `close_pty` terminate the child process by exposing it via an `Arc<Mutex<Child>>` to prevent deadlocks when the background read thread blocks.
- Fixed `TerminalPanel` to only mount xterm once, avoiding recreation when `pid` changes. Preserved active resize observer using a ref.
- Added durable PTY session metadata persistence side-by-side with log files (`.json`), including command, queue itemId, run ID, and completion timestamps.
- Updated `brain/api/contracts.md` with accurate `spawn_pty`, `close_pty`, and PTY event contract documentation.
- Documented manual smoke test precisely: "Manual smoke test blocked: Missing Rust/Cargo toolchain prevents compiling the Tauri backend."
- `bun --cwd apps/desktop typecheck`: pass (exit 0)
- `cargo check`: Blocked by missing Rust/Cargo toolchain on host.

### 2026-06-13

- **Token-saving automation triage intake**:
  - Created `brain/intake/2026-06-13-token-saving-automation-triage.md` from the request to save tokens by checking queue/task-log state locally before launching agents.
  - Added proposed plan `brain/plans/2026-06-13-feature-token-saving-automation-triage.md`.
  - Added roadmap task "Add Token-Saving Automation Triage" to `brain/tasks/roadmap.md`.
  - No implementation code was changed in this planning-only intake pass.

- **Codex UI standardization intake**:
  - Created `brain/intake/2026-06-13-codex-ui-standardization.md` from the request that Brain Loop UI should follow the Codex desktop standard.
  - Added proposed plans for Codex UI visual contract, thread workspace, environment/changes panel, artifact/change cards, and visual QA harness.
  - Retargeted the active desktop shell plan/task from Midday/shadcn-first wording to Codex-standard UI, keeping shadcn as primitives and Midday as component organization guidance.
  - Updated UI feature, project configuration, queue dashboard, approval broker, product roadmap, reference project notes, and task guidance so UI-bearing work inherits the Codex standard.
  - No app code was changed in this planning-only intake pass.

### 2026-06-12 (2)

- **Established Workspace Validation and UI Foundation**:
  - Created baseline component directories under `apps/desktop/src/components/` (modals, sheets, tables/core, forms, onboarding).
  - Created baseline hook and store directories under `apps/desktop/src/`.
  - Implemented baseline components: `Sidebar` (`components/sidebar.tsx`), `SignOut` (`components/sign-out.tsx`), `GlobalSheets` (`components/sheets/global-sheets.tsx`), and `GlobalSheetsProvider` (`components/sheets/global-sheets-provider.tsx`).
  - Refactored `apps/desktop/src/app.tsx` to use the new `Sidebar` component, leaving the entrypoint thin.
  - Documented shadcn CLI runner commands and tailwind configuration instructions in `brain/engineering/coding-standards.md`.
  - Updated `brain/engineering/repo-structure.md` to move established directories to Current Structure.
  - All workspace checks verify successfully.
- **Approved Workspace Validation and UI Foundation**: Reviewed Fix 1, confirmed Rust/Cargo prerequisites and blocked Cargo validation are documented, verified Bun typecheck and desktop build checks, and moved the task/plan to Done.
- **Fix 1 — Workspace validation & prerequisites**:
  - Documented the Rust/Cargo prerequisite for `cargo check` and Tauri development in `README.md` and `brain/engineering/coding-standards.md`.
  - Updated completion notes in the original handoff file to accurately record `cargo check` as blocked by a missing Rust host toolchain.
  - Verified that typescript validation checks (`bun run typecheck`, `bun --filter @brain-loop/desktop build`) still pass successfully.


### 2026-06-12

- Expanded the project roadmap into a 0-100 execution plan.
- Created a Brain intake with proposed implementation-sized plans.
- No implementation code has been changed for this planning pass.
- Approved all 14 generated plans from `brain/intake/2026-06-12-project-0-100.md` and moved their companion tasks to backlog.
- Converted all 14 approved plans into ready handoffs and queued global Brain project manager items.
- Created a new proposed intake for product naming, runner/model settings, MaxLoop policy, task sequencing, state-root migration, thread storage, permission alerts, and open-source positioning.
- Repaired `brain/tasks/in-progress.md` so the previously queued foundation, Brain core contracts, and atomic JSON write tasks are listed as in progress.
- **Implemented Brain Core Contracts** in `packages/brain-core/src/`:
  - `types.ts`: Shared TypeScript types for Settings, Projects, Queue Items, History Entries, Locks, Logs, Runner Metadata, Run Results, and all status/agent/priority unions.
  - `constants.ts`: Valid statuses, agents, priorities, dispatcher states, automation modes, log levels, queue status transition map, and default settings.
  - `validation.ts`: Parsing/normalization helpers including type guards, assertions, queue transition validation, path normalization, and safe parsing for booleans/integers.
  - `index.ts`: Public API re-exporting all types, constants, and validation helpers.
  - `package.json`: Added `@types/node` devDependency for typecheck compatibility.
  - Typechecks pass for all 3 workspace packages (`brain-core`, `desktop-client`, `desktop`).
- **Approved Brain Core Contracts**: Reviewed Fix 1, confirmed tolerant queue history shapes, nullable execution paths, type-level examples, and full workspace typechecks. Moved the task and plan to Done.
- **Fix 1 — Queue contract compatibility**: Updated `QueueHistoryEntry` to tolerate both status/note entries and event/detail audit entries (required: `at`, `by`; optional: `status`, `note`, `event`, `detail`, `reviewPath`, `activeHandoffPath`, `handoffPath`, `agent`). Made `executionPath` nullable and `runnerId`/`sessionId` optional to match legacy queue files. Added `examples.ts` with type-level proofs against real GND and school-clerk queue shapes. Updated `brain/api/contracts.md` with tolerant shape documentation. Typechecks pass for all 3 packages.
- **Implemented Atomic Brain JSON Writes and Locks**:
  - Created `apps/desktop/src-tauri/src/state.rs`: Brain project manager root path resolution, directory helpers.
  - Created `apps/desktop/src-tauri/src/atomic.rs`: Atomic JSON write via temp-file + rename, UTC ISO timestamp generator.
  - Created `apps/desktop/src-tauri/src/lock.rs`: Lock acquire/release/check with `BrainLock` struct, lock file persistence.
  - Created `apps/desktop/src-tauri/src/brain.rs`: Queue item read/write, status transition validation, `update_queue_item_status` with history appends, full Rust structs for `QueueItem`, `QueueHistoryEntry`, `Settings`.
  - Updated `apps/desktop/src-tauri/src/lib.rs`: Registered 4 new modules, added 4 new Tauri commands (`update_queue_item_status`, `acquire_brain_lock`, `release_brain_lock`, `check_brain_lock`).
  - Updated `packages/desktop-client/src/index.ts`: Added TypeScript wrappers for all 4 new commands.
  - Updated `packages/brain-core/src/types.ts`: Added `LockResult` interface.
  - TypeScript typechecks pass for all 3 packages. `cargo check` could not run (Rust toolchain not installed on this machine).
- **Approved Atomic Brain JSON Writes and Locks**: Reviewed Fix 1, confirmed real UTC timestamps, exclusive lock creation, durable atomic writes, and passing TypeScript checks. Cargo validation remains blocked until Rust/Cargo is installed.
- **Fix 1 — Atomic writes**: Replaced hardcoded `2026-06-12` date in `utc_now_iso` with `chrono::Utc::now()` real UTC timestamp. Made lock acquisition exclusive using `create_new(true)` with `sync_all`. Added `chrono` dependency to Cargo.toml. Typecheck passes 3/3.
- **Implemented Background Scheduler Controls**:
  - Created `apps/desktop/src-tauri/src/scheduler.rs`: Thread-safe scheduler state machine (stopped/running/paused/error), status reporting, active process counting, settings reading for maxRunningProcesses and intervals.
  - Added 6 new Tauri commands: `start_automation`, `pause_automation`, `stop_automation`, `get_scheduler_status`, `run_implementation_once`, `run_review_once`.
  - Wired tray menu: "Run Once" starts scheduler + ticks, "Pause Automation" pauses.
  - Updated `packages/desktop-client/src/index.ts`: Added TypeScript wrappers for all scheduler commands.
  - Updated `packages/brain-core/src/types.ts`: Added `SchedulerStatus` interface.
  - Created `brain/features/background-scheduler.md`.
  - TypeScript typechecks pass for all 3 packages.
- **Fix 1 — Scheduler controls**:
  - Wired `app.tsx` UI to `startAutomation`, `pauseAutomation`, and `runImplementationOnce`.
  - Updated tray "Run Once" to use the safe `run_implementation_once` path instead of bypassing capacity checks.
  - Enforced `paused` state in `run_implementation_once` and `run_review_once` to reject manual ticks.
  - Added `projects.json` reading to `run_implementation_once` to enforce disabled-project skipping.
  - Implemented durable `scheduler.log` persistence for all ticks and skipped decisions.
  - Updated `brain/features/background-scheduler.md` to document paused semantics and deferred interval loops.
- **Fix 2 — Scheduler controls**:
  - Added `runReviewOnce` import and "Run Review" button to `app.tsx` with inline success/error feedback for both Implementation and Review ticks.
  - Replaced global `enabled_count > 0` dispatch gate with item-level disabled-project eligibility in `run_implementation_once` and `run_review_once`: each queue item's project is checked against enabled projects, with per-item skip logging.
  - Updated `brain/features/background-scheduler.md` to accurately describe item-level disabled-project filtering.
  - Updated `brain/api/endpoints.md` to list all 6 implemented Automation Control commands with implementation status.
  - Rust `read_implementation_interval` function verified structurally correct (cargo unavailable for compilation check).
- **Added LaunchAgent Helper Support (v2 deferred)**:
  - Created `brain/decisions/2026-06-12-launchagent-v2-deferral.md`: ADR deferring full LaunchAgent to v2.
  - Created `apps/desktop/src-tauri/src/launchagent.rs`: Full LaunchAgent module with plist rendering, install/unload/remove, launchctl integration, and status detection. Commands available but marked v2-deferred.
  - Added 5 Tauri commands: `get_launchagent_info`, `install_launchagent`, `load_launchagent`, `unload_launchagent`, `remove_launchagent`.
  - Updated `packages/desktop-client/src/index.ts` and `packages/brain-core/src/types.ts` with `LaunchAgentInfo`.
  - TypeScript typechecks pass for all 3 packages.
- **Implemented Auditable Run Logs And Transcripts**:
  - Created `apps/desktop/src-tauri/src/runner.rs`: Implemented `run_process` which spawns commands, pipes stdout/stderr to durable logs in `~/.codex/brain-project-manager/logs/`, and emits Tauri `process-log` and `process-complete` events. Added `read_log_file` command.
  - Updated `apps/desktop/src-tauri/src/lib.rs` to register the new `runner` module and commands.
  - Updated `packages/desktop-client/src/index.ts` to export TypeScript API bindings for `runProcess`, `readLogFile`, `onProcessLog`, and `onProcessComplete` along with `LogEvent` type.
  - Built `LogsPanel` component (`apps/desktop/src/components/logs-panel.tsx`) and integrated it into `app.tsx`. It provides a sidebar of recent logs and a scrollable live-tailing log view.
  - Added CSS for `LogsPanel` in `apps/desktop/src/styles.css`.
  - `cargo check` remains blocked by missing toolchain, but TS tests passed.
- **Fix 1 — Auditable run logs and transcripts**:
  - Implemented safe log naming convention using sanitized `runId`.
  - Added JSON metadata sidecar persistence containing `queueItemId`, `projectId`, `agent`, `command`, `args`, `cwd`, and `status`.
  - Extended `run_process` Tauri contract to accept queue item IDs and project info.
  - Linked metadata files to queue items and added logic to update the `queueItemId` to `blocked` if spawn fails.
  - Updated `list_recent_logs` to join metadata JSON and include queue info in `LogSummary`.
  - Updated `ProcessCompleteEvent` to include `exitCode` and `signal` and `LogsPanel` to show metadata.
- **Fix 2 — Auditable run logs and transcripts**:
  - Hardened `read_log_file` in `runner.rs` with path traversal prevention: rejects `/`, `\`, `..`, absolute paths, non-`.log` files, empty names; validates canonical path within `logs/runs/`.
  - Fixed `LogsPanel` stale closure by using `useRef` for `selectedFile` with a stable event listener, eliminating stale React closure state from live log tailing.
  - Replaced simple `{runId}.log` naming with collision-resistant `make_log_name` using timestamp + sanitized runId + optional queueItemId/projectId/agent.
  - Updated `brain/api/contracts.md` with full `run_process` signature, `read_log_file` safe filename rules, `process-complete` payload, and log naming documentation.
  - `cargo check` unavailable; Rust changes verified by code inspection.
- **Implemented PTY-Backed Thread Terminals**:
  - Authored ADR `0002-use-portable-pty-for-terminal.md` to document the decision to use `portable-pty` and `xterm.js`.
  - Added `xterm` and `@xterm/addon-fit` dependencies to `@brain-loop/desktop`.
  - Added `portable-pty` dependency to `apps/desktop/src-tauri`.
  - Implemented `PtyState`, `spawn_pty`, `write_pty`, `resize_pty`, and `close_pty` in `pty.rs`.
  - Added `TerminalPanel` component wrapping `xterm.js` with auto-fit and resize observations.
  - Linked terminal output to durable `logs/runs/<session>.log` while streaming to UI.
  - Added explicit cleanup mechanisms when child exits or terminal panel unmounts.
  - Registered `pty` module commands and state in `apps/desktop/src-tauri/src/lib.rs`.
  - Added `spawnPty`, `writePty`, `resizePty`, `onPtyData`, and `PtyDataEvent` to `packages/desktop-client/src/index.ts`.
  - Built frontend `TerminalPanel` (`apps/desktop/src/components/terminal-panel.tsx`) with `xterm.js` and ResizeObserver support.
  - Updated `brain/api/contracts.md` and `brain/features/threaded-terminals.md`.
  - Typechecks passed. Cargo validation is still blocked by the missing local Rust toolchain.

### Build Midday/Shadcn Desktop Shell Fix 1 (2026-06-13)

- Expanded sidebar navigation to include Runs, Logs, Approvals, and Scheduler alongside Overview, Projects, Queue, Threads, and Settings — covering all product areas specified in `brain/features/ui-shell.md`.
- Added lucide-react icon imports for each nav item with consistent `size-4` icon sizing.
- Replaced raw custom `div` result displays in `app.tsx` with shadcn-composed Alert components: success runs use `CheckCircle2`, failures use `AlertCircle`, connection errors use destructive Alert variant.
- Added Skeleton loading state for initial brain status poll.
- Added empty state Alert when no activity exists (zero runs/queued/submitted/blocked).
- Added warning state Alert when scheduler status fails but brain status is healthy.
- Updated `brain/features/ui-shell.md` with Implemented Behavior section documenting the actual shell state.
- Changed files:
  - `apps/desktop/src/components/sidebar.tsx` — expanded nav items, added icon imports
  - `apps/desktop/src/app.tsx` — shadcn-composed Alert states, Skeleton loading, empty/warning states
  - `brain/features/ui-shell.md` — added Implemented Behavior section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)

### LaunchAgent Helper Support Fix 1 (2026-06-13)

- Fixed `launchagent.rs` `status()` function: `launchctl list` failures now return `Error` status instead of silently collapsing to `Installed`. Added stderr diagnostics for failure cases.
- Added "LaunchAgent" tab to the desktop app UI with live status display (not_installed, installed, loaded, error), context-appropriate action buttons (Install Plist, Load Agent, Unload, Remove Plist), and explicit confirmation gate before any mutating operation.
- Added v2-deferral info Alert explaining the v1 app uses tray-icon persistence for background automation.
- Updated `brain/features/background-scheduler.md` with a LaunchAgent Helper section documenting the implemented command surface (5 Tauri commands), safety model (confirmation gate, reversibility, no auto-install), and status states.
- Changed files:
  - `apps/desktop/src-tauri/src/launchagent.rs` — status() Error/Installed fix
  - `apps/desktop/src/app.tsx` — LaunchAgent tab with status, actions, confirmation
  - `brain/features/background-scheduler.md` — LaunchAgent Helper section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)
- `cargo check`: not run; cargo not installed

### Manual Implementation/Review Dispatch (2026-06-13)

- Verified that `run_implementation_once` and `run_review_once` are fully implemented in `apps/desktop/src-tauri/src/lib.rs` (lines 424-533) from the background-scheduler-controls work.
- `run_implementation_once`: requires scheduler running, respects `maxRunningProcesses`, selects `queued`/`reviewed-fix-request` items, per-item disabled-project skipping, durable scheduler.log.
- `run_review_once`: requires scheduler running, selects only `submitted` items (not `reviewed-fix-request`), per-item disabled-project skipping, durable logging.
- UI is wired in app.tsx with buttons, result alerts (Alert component), and scheduler state Badge.
- Updated `brain/features/automation-runs.md` from "Planned Behavior" to fully documented "Implemented Behavior" with dispatch, logs, UI controls, and runner boundaries.
- Added Dispatch Contract section to `brain/api/contracts.md` documenting eligibility rules, capacity limits, and ticket logging for both commands.
- Changed files:
  - `brain/features/automation-runs.md` — implemented behavior documentation
  - `brain/api/contracts.md` — dispatch contract section
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `cargo check`: not run; cargo not installed


### Build Midday/Shadcn Desktop Shell Approval (2026-06-15)

- Approved Fix 1 after confirming expanded product navigation, shadcn-composed loading/empty/error/warning states, and updated UI shell documentation.
- Checks passed: bun --filter @brain-loop/desktop typecheck; bun --filter @brain-loop/desktop build.
- Review file: brain/reviews/2026-06-15-build-midday-shadcn-desktop-shell-review-v2.md.
- Moved active fix handoff to brain/handoffs/completed/2026-06-13-build-midday-shadcn-desktop-shell-fix-1.md.

### LaunchAgent Helper Support Approval (2026-06-15)

- Approved Fix 1 after confirming LaunchAgent status/actions are visible in the app, mutating operations require confirmation, status errors surface as Error, and background scheduler docs describe the v2-deferred helper scope.
- Checks passed: bun --filter @brain-loop/desktop typecheck; bun --filter @brain-loop/desktop build.
- Cargo validation remains blocked because cargo is not installed on host.
- Review file: brain/reviews/2026-06-15-add-launchagent-helper-support-review-v2.md.
- Moved active fix handoff to brain/handoffs/completed/2026-06-12-add-launchagent-helper-support-fix-1.md.

### Build Queue Dashboard And Filters (2026-06-15)

- Added `QueueTable` component to `apps/desktop/src/components/tables/queue/queue-table.tsx`.
- Integrated `listQueue()` backend fetch into `app.tsx`.
- Implemented queue items filtering by status and agent via shadcn UI Selects.
- Implemented `QueueItem` details Sheet showing execution paths, priority, and history details.
- Added empty and loading states using shadcn Skeleton and Table primitives.
- Installed `table`, `sheet`, `dropdown-menu`, `select` shadcn components.
- Changed files:
  - `apps/desktop/src/app.tsx` - Added Queue tab and fetch call.
  - `apps/desktop/src/components/tables/queue/queue-table.tsx` - Queue rendering and UI components.
  - Installed shadcn ui dependencies into `apps/desktop/src/components/ui/`.
- `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
- `bun --filter @brain-loop/desktop build`: pass (exit 0)
- `cargo check`: not run; cargo not installed

### Add Approval Broker And Cards (2026-06-15)

- Added shared approval request/status/kind contracts in `@brain-loop/brain-core`.
- Added Rust approval broker commands for listing, requesting, approving, denying, and expiring approval requests.
- Added approval lifecycle events: requested, approved, denied, expired, and resolved.
- Added desktop client wrappers and event listener support for approval flows.
- Built an Approvals tab with cards for pending/resolved requests, command/permission/destructive kind badges, context details, history, and approve/deny/expire controls.
- Denied or expired requests attempt to block linked queue items with `approval_denied` or `approval_expired` audit events.
- Updated approval broker feature, API contracts, endpoints, and permissions documentation.
- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
- Required typecheck, cargo check, and manual UI verification are recommended next; skipped in this pass under fast monorepo command discipline.

### Add Notifications, Packaging, And Release Readiness (2026-06-15)

- Added a dependency-free notification bridge using the WebView `Notification` API with in-app fallback state.
- Added Overview notification preferences for blocked queue items, submitted/review-ready work, approval-needed events, and scheduler/queue-read warnings.
- Wired notifications to state transitions so unchanged polling snapshots do not repeatedly notify the user.
- Added approval-request notifications from approval lifecycle events.
- Updated README with local usage, release verification commands, smoke-test checklist, and packaging blockers.
- Updated roadmap and feature docs to reflect MVP notification/release status and remaining next work.
- Changed files:
  - `apps/desktop/src/lib/notifications.ts`
  - `apps/desktop/src/app.tsx`
  - `README.md`
  - `brain/product/roadmap.md`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/approval-broker.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Required typecheck, desktop build, Tauri build, and manual release smoke tests are recommended next; skipped in this pass under fast monorepo command discipline.
