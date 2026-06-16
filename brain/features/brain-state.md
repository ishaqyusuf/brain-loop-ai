# Feature: Brain State

## Purpose

Brain Loop reads and safely mutates the global Brain Loop state root while keeping settings in TOML and operational records in JSON.

The state model is part of the product's opinionated open-source stance: users and contributors should be able to inspect, back up, fork, or repair Brain Loop state without a hosted service or hidden database.

## Scope

- `~/.brain-loop/settings.toml`
- `~/.brain-loop/projects.json`
- `~/.brain-loop/approvals.json`
- `~/.brain-loop/workspaces.json`
- `~/.brain-loop/queues/handoffs/*.json`
- `~/.brain-loop/threads/*.json`
- `~/.brain-loop/locks/`
- `~/.brain-loop/logs/`

## Implemented Behavior (Read-Only)

- Rust resolves the global manager root from the user's home directory (`~/.brain-loop/`).
- On startup or command access, Rust prepares the new root and migrates legacy non-worktree state from `~/.codex/brain-project-manager` when the new files/directories are missing. Legacy `settings.json` is converted to `settings.toml`; legacy Git worktrees are not copied or moved.
- Rust read-helpers tolerate missing files or malformed files gracefully without crashes.
- Exposes commands for:
  - `get_brain_status`: returns merged dispatcher status and counts of queued, active, submitted, and blocked queue items.
  - `list_projects`: parses and returns the active project lists.
  - `list_queue`: reads all queue handoffs and returns `{ items, errors }`; valid items are sorted by priority (high -> medium -> low) and oldest creation date, while malformed or unreadable files are reported without breaking the full list. Older queue files without `taskName` get a generated display fallback from their handoff/plan path or id.
  - `list_recent_logs`: lists recent runner log summaries.
- `packages/desktop-client` wraps these Tauri invoke interfaces in typed TypeScript functions.
- Queue read errors include file name, path, and parse/read message so React can surface malformed queue files.

## Implemented Behavior (Mutations)

- `src/state.rs`: Centralized path resolution for `~/.brain-loop/`, migration from the legacy `.codex` root, and subdirectories (queues/handoffs, locks, logs, threads, worktrees).
- `src/atomic.rs`: Atomic JSON/TOML write helpers — write to a temp file in the target directory, flush, then rename. Generates UTC ISO 8601 timestamps.
- `src/lock.rs`: Lock management — acquire (creates lock file atomically, fails if already held), release (removes file), is_locked (file existence check).
- `src/approval.rs`: Durable approval broker state — loads and atomically writes `approvals.json` for approval request lifecycle events.
- `src/brain.rs`: Core mutation logic —
  - `QueueItem`/`QueueHistoryEntry` Rust structs with serde camelCase field mapping.
  - `update_queue_item_status`: Validates current and new statuses, checks transition is allowed, updates status-specific timestamps, appends a history entry.
  - Status validation matches the Brain handoff contract transition map.
- Exposes Tauri commands:
  - `update_queue_item_status`: Reads, mutates, and atomically writes a queue item with validated status transitions.
  - `acquire_brain_lock`: Creates a lock file with typed metadata.
  - `release_brain_lock`: Removes a lock file.
  - `check_brain_lock`: Returns whether a lock file exists.
- `packages/desktop-client` wraps all mutation commands in typed async functions.
- `packages/brain-core` exports `LockResult` for lock operation responses.

## Implementation Plans

- `brain/plans/2026-06-12-feature-brain-core-contracts.md`
- `brain/plans/2026-06-12-feature-rust-brain-state-readers.md`
- `brain/plans/2026-06-12-feature-atomic-brain-json-writes.md`

## Architecture Notes

- Keep Tauri command handlers thin.
- Put reusable native logic in Rust modules under `apps/desktop/src-tauri/src`.
- Do not introduce an application database unless a later ADR accepts that change.
- Queue statuses must stay compatible with the Brain handoff contract.

## Brain Docs To Keep Updated

- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/system/architecture.md`
- `brain/database/schema.md` only if a database is introduced
