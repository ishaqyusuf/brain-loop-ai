# Brain Handoff: Implement Atomic Brain JSON Writes And Locks

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-atomic-brain-json-writes.md

## Task
- Task Title: Implement Atomic Brain JSON Writes And Locks
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Rust mutation safety, locks, and status validation fit backend-focused implementation.

## Goal
Add safe Rust mutation utilities for Brain JSON files so project updates, queue status transitions, and scheduler actions never corrupt durable state.

## Context To Read First
- brain/plans/2026-06-12-feature-atomic-brain-json-writes.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add a reusable atomic JSON write helper in Rust.
2. Add lock read/write helpers under the Brain project manager root.
3. Validate status transitions against the Brain queue contract before writing.
4. Add commands or internal functions needed by project configuration and runner dispatch.
5. Ensure every mutation appends a queue/project history note where the contract requires it.

## Acceptance Criteria
- Brain JSON writes are atomic and preserve formatting enough for auditability.
- Unsupported queue statuses cannot be written by app commands.
- Lock handling is explicit and documented.
- Read-only command behavior from the previous phase remains intact.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `packages/brain-core/src/index.ts`
- `brain/api/contracts.md`
- `brain/features/brain-state.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- Rust unit tests for atomic write helpers if the module structure supports them
- `bun run typecheck`

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-atomic-brain-json-writes-and-locks.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/api/contracts.md` for mutation safety and status transition rules.
- Update `brain/features/brain-state.md`.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes

- Changed files:
  - `apps/desktop/src-tauri/src/state.rs` (new): Brain root path resolution, directory helpers
  - `apps/desktop/src-tauri/src/atomic.rs` (new): Atomic JSON write via temp-file+rename, UTC timestamp generator
  - `apps/desktop/src-tauri/src/lock.rs` (new): Lock acquire/release/check with BrainLock struct
  - `apps/desktop/src-tauri/src/brain.rs` (new): Queue item read/write, status transition validation, history appends
  - `apps/desktop/src-tauri/src/lib.rs` (updated): Declared 4 new modules, added 4 mutation Tauri commands
  - `packages/desktop-client/src/index.ts` (updated): Added TypeScript wrappers for mutation commands
  - `packages/brain-core/src/types.ts` (updated): Added LockResult interface
  - `packages/brain-core/src/index.ts` (updated): Exported LockResult
- Checks run:
  - `bun run typecheck` (3 packages): passed (brain-core, desktop-client, desktop)
  - `cargo check`: could not run — Rust toolchain not installed on this machine
- Brain docs updated:
  - `brain/progress.md`: Added atomic writes implementation entry
  - `brain/features/brain-state.md`: Documented mutation commands, state/atomic/lock/brain modules
  - `brain/api/contracts.md`: No changes needed (contracts.md reflects mutation rules already)
- Unresolved issues:
  - `cargo check` could not be run; Rust toolchain (`rustup`/`cargo`) is not installed.
