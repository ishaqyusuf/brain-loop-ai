# Plan: Implement Manual Implementation/Review Dispatch

## Type
Feature

## Status
In Progress

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 50-60%

## Goal Or Problem
Allow the user to manually run one implementation or review action from the desktop app while respecting queue limits, project eligibility, and execution paths.

## Current Context
Brain Loop should control runners for `opencode`, `agy`, and Codex review. Queue item statuses must remain compatible with the Brain project manager contract.

## Proposed Approach
Implement explicit one-shot dispatch commands and UI actions that select eligible queue items, launch runner processes, stream output, and update queue state only through supported transitions.

## Implementation Steps
- Add queue selection logic that respects enabled projects and `maxRunningProcesses`.
- Add commands for `run_implementation_once` and `run_review_once`.
- Launch processes from queue item `executionPath`, using worktree paths when present.
- Update queue history for picked, started, submitted, or blocked transitions.
- Add UI actions with confirmation and clear disabled states.
- Do not run background loops in this phase.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components/tables/queue`
- `apps/desktop/src/components/modals`
- `brain/features/automation-runs.md`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`

## Acceptance Criteria
- Manual implementation dispatch can start exactly one eligible queued handoff.
- Manual review dispatch can start exactly one eligible submitted handoff when review support exists.
- Queue statuses are never moved to unsupported values.
- UI communicates why a run action is disabled or blocked.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual check with safe stub runner commands if available

## Brain Update Requirements
- Update `brain/features/automation-runs.md`.
- Update `brain/api/endpoints.md`, `brain/api/contracts.md`, and `brain/api/permissions.md`.
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
- Real runner CLIs may not be installed; blocked state must be explicit.
- Processes must not be launched from the active checkout when a worktree execution path is specified.

## Open Questions
- None

## Linked Task
- Task Title: Implement Manual Implementation/Review Dispatch
- Task File: brain/tasks/in-progress.md
