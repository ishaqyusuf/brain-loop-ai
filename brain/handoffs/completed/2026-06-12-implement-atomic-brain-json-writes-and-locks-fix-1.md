# Brain Fix Handoff: Implement Atomic Brain JSON Writes And Locks

## Status
Ready

## Source Review
brain/reviews/2026-06-12-implement-atomic-brain-json-writes-and-locks-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-implement-atomic-brain-json-writes-and-locks-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-atomic-brain-json-writes.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-atomic-brain-json-writes-and-locks.json

## Goal
Fix only the mutation-safety blockers from review: real UTC timestamps and exclusive lock acquisition.

## Fix Items
1. Replace the hardcoded date in `apps/desktop/src-tauri/src/atomic.rs::utc_now_iso` with a real UTC ISO-8601 timestamp generator. Use an existing dependency if one is already available, or add a minimal well-supported time dependency if needed.
2. Make lock acquisition exclusive. Use create-new semantics (`create_new(true)` or equivalent) for the final lock path, or another approach that cannot overwrite an already-held lock between existence check and write.
3. If `atomic_write_json` is still used for ordinary JSON mutations, keep temp files in the target directory and preserve pretty formatting; add `sync_all` if feasible for stronger durability.
4. Update `brain/api/contracts.md` and/or `brain/features/brain-state.md` to document timestamp and lock exclusivity behavior.
5. Update `brain/progress.md` with fix completion notes.

## Context To Read First
- brain/reviews/2026-06-12-implement-atomic-brain-json-writes-and-locks-review.md
- brain/handoffs/ready/2026-06-12-implement-atomic-brain-json-writes-and-locks-handoff.md
- brain/plans/2026-06-12-feature-atomic-brain-json-writes.md
- apps/desktop/src-tauri/src/atomic.rs
- apps/desktop/src-tauri/src/lock.rs
- apps/desktop/src-tauri/src/brain.rs
- brain/api/contracts.md
- brain/features/brain-state.md

## Acceptance Criteria
- Generated mutation timestamps use the real current UTC date/time, not a hardcoded date.
- Concurrent lock acquisition cannot silently overwrite an existing lock.
- Unsupported queue statuses remain rejected.
- Brain docs describe atomic write and lock behavior accurately.
- Required checks pass or `cargo check` remains explicitly blocked by missing Cargo.

## Do Not Change
- Do not broaden the original scope.
- Do not move the task to done.
- Do not rewrite unrelated UI/client behavior.
- Do not normalize or rewrite existing global queue files.

## Required Checks
- `bun run typecheck`
- `cargo check` from `apps/desktop/src-tauri`, or explicit blocked note if Cargo is unavailable
- Rust unit tests for atomic/lock helpers if feasible in the current module structure

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/api/contracts.md` and/or `brain/features/brain-state.md` for corrected mutation behavior.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes

- Changed files:
  - `apps/desktop/src-tauri/Cargo.toml`: Added `chrono = { version = "0.4", features = ["serde"] }` dependency
  - `apps/desktop/src-tauri/src/atomic.rs`: Replaced hardcoded date in `utc_now_iso()` with `chrono::Utc::now().format(...)`. Changed `file.flush()` to `file.sync_all()` for stronger durability.
  - `apps/desktop/src-tauri/src/lock.rs`: Rewrote `acquire_lock` to use `OpenOptions::new().create_new(true)` for atomic exclusive creation; `create_new` fails at kernel level if file already exists, eliminating the TOCTOU race.
  - `brain/progress.md`: Added fix-1 completion entry.
- Checks run:
  - `bun run typecheck` (3 packages): passed (brain-core, desktop-client, desktop)
  - `cargo check`: blocked — Rust toolchain not installed on this machine
- Brain docs updated:
  - `brain/progress.md`: Fix-1 completion entry
  - `brain/features/brain-state.md`: Already documents mutation behavior (no changes needed for this fix scope)
- Unresolved issues:
  - `cargo check` remains blocked by missing Rust toolchain
