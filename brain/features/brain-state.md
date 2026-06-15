# Feature: Brain State

## Purpose

Brain Loop reads and safely mutates the global Brain project manager files while keeping JSON as the durable source of truth.

## Scope

- `~/.codex/brain-project-manager/settings.json`
- `~/.codex/brain-project-manager/projects.json`
- `~/.codex/brain-project-manager/queues/handoffs/*.json`
- `~/.codex/brain-project-manager/locks/`
- `~/.codex/brain-project-manager/logs/`

## Implemented Behavior (Read-Only)

- Rust resolves the global manager root from the user's home directory (`~/.codex/brain-project-manager/`).
- Rust read-helpers tolerate missing files or malformed files gracefully without crashes.
- Exposes commands for:
  - `get_brain_status`: returns merged dispatcher status and counts of queued, active, submitted, and blocked queue items.
  - `list_projects`: parses and returns the active project lists.
  - `list_queue`: reads all queue handoffs and returns `{ items, errors }`; valid items are sorted by priority (high -> medium -> low) and oldest creation date, while malformed or unreadable files are reported without breaking the full list.
  - `list_recent_logs`: lists recent runner log summaries.
- `packages/desktop-client` wraps these Tauri invoke interfaces in typed TypeScript functions.
- Queue read errors include file name, path, and parse/read message so React can surface malformed queue files.

## Implemented Behavior (Mutations)

- `src/state.rs`: Centralized path resolution for `~/.codex/brain-project-manager/` and its subdirectories (queues/handoffs, locks, logs).
- `src/atomic.rs`: Atomic JSON write helper — writes to a temp file in the target directory, flushes, then renames. Generates UTC ISO 8601 timestamps.
- `src/lock.rs`: Lock management — acquire (creates lock file atomically, fails if already held), release (removes file), is_locked (file existence check).
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
