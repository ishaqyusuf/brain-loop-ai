# Brain Handoff Review: Implement Atomic Brain JSON Writes And Locks

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-implement-atomic-brain-json-writes-and-locks-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-atomic-brain-json-writes-and-locks.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Source Plan
brain/plans/2026-06-12-feature-atomic-brain-json-writes.md

## Result
Needs Fix

## Findings
- [P1] `utc_now_iso` hardcodes the calendar date to `2026-06-12` at `apps/desktop/src-tauri/src/atomic.rs:35`. Every queue history entry and lock created after today will receive the wrong date, which breaks auditability for durable Brain mutations.
- [P1] Lock acquisition is not actually exclusive under concurrency. `acquire_lock` checks `lock_path.exists()` and then writes through `atomic_write_json` at `apps/desktop/src-tauri/src/lock.rs:17`, but another process can create the lock between the check and the write. Because `atomic_write_json` ultimately renames over the target, the later writer can replace the first lock instead of failing. This fails the lock handling/concurrent writer safety expected by the plan.
- [P2] The required `cargo check` could not be run on this host because Cargo is unavailable (`cargo check` returns `zsh:1: command not found: cargo`). Keep this as an unresolved environment blocker unless a Rust-enabled run is available.

## Acceptance Criteria Check
- Brain JSON writes are atomic and preserve formatting enough for auditability: Fail
- Unsupported queue statuses cannot be written by app commands: Pass
- Lock handling is explicit and documented: Fail
- Read-only command behavior from the previous phase remains intact: Not fully verified; previous submitted reader review found a separate client response bug

## Checks
- `bun run typecheck`: Pass
- `cargo check` from `apps/desktop/src-tauri`: Fail - `cargo` command not found
- Rust unit tests for atomic write helpers: Not run / not present

## Brain Update Check
- `brain/api/contracts.md` updated for mutation safety and status transition rules: Existing mutation rules present, but lock exclusivity/timestamp behavior not documented
- `brain/features/brain-state.md` updated: Present
- `brain/progress.md` updated after implementation: Present

## Decision
The implementation has useful scaffolding, but approving it would lock in incorrect audit timestamps and non-exclusive lock acquisition. A fix handoff was created to correct timestamp generation, make lock acquire atomic/exclusive, and document the behavior.

## Follow-Up
brain/handoffs/fixes/2026-06-12-implement-atomic-brain-json-writes-and-locks-fix-1.md
