# Plan: Implement Atomic Brain JSON Writes And Locks

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 18-25%

## Goal Or Problem
Add safe Rust mutation utilities for Brain JSON files so project updates, queue status transitions, and scheduler actions never corrupt durable state.

## Current Context
Brain JSON files are the source of truth and the engineering rules require atomic writes for every mutation. Later features will depend on safe writes and lock handling.

## Proposed Approach
Implement native helpers for validated write operations, temp-file-plus-rename atomicity, lock awareness, and queue history appends.

## Implementation Steps
- Add a reusable atomic JSON write helper in Rust.
- Add lock read/write helpers under the Brain project manager root.
- Validate status transitions against the Brain queue contract before writing.
- Add commands or internal functions needed by project configuration and runner dispatch.
- Ensure every mutation appends a queue/project history note where the contract requires it.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `packages/brain-core/src/index.ts`
- `brain/api/contracts.md`
- `brain/features/brain-state.md`

## Acceptance Criteria
- Brain JSON writes are atomic and preserve formatting enough for auditability.
- Unsupported queue statuses cannot be written by app commands.
- Lock handling is explicit and documented.
- Read-only command behavior from the previous phase remains intact.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- Rust unit tests for atomic write helpers if the module structure supports them
- `bun run typecheck`

## Brain Update Requirements
- Update `brain/api/contracts.md` for mutation safety and status transition rules.
- Update `brain/features/brain-state.md`.
- Update `brain/progress.md` after implementation.

## Lower-Agent Readiness
- Implementation scope is clear: Yes
- File boundaries are clear: Yes
- Acceptance criteria are observable: Yes
- Required checks are listed: Yes
- Brain update requirements are listed: Yes
- Ready for handoff: Yes

## Completion Report Requirements
Lower agent must report:
- Changed files
- Checks run
- Brain docs updated
- Unresolved issues
- Any skipped acceptance criteria

## Risks / Edge Cases
- Atomic rename behavior differs across filesystems if temp files are created outside the target directory.
- Concurrent writers must not silently overwrite each other.

## Open Questions
- None

## Linked Task
- Task Title: Implement Atomic Brain JSON Writes And Locks
- Task File: brain/tasks/in-progress.md
