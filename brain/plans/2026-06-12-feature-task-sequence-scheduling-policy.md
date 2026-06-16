# Plan: Add Task Sequence And Scheduling Policy

## Type
Feature

## Status
In Progress

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Support task sequence, fix before new task, or FIFO

## Goal Or Problem
Support queue items that must wait for other queue items to finish, and let users choose whether fixes or FIFO ordering take priority.

## Current Context
Current queue selection now supports capacity policy checks and durable waiting reasons. User wants dependency sequencing and a policy choice between "fix before new task" and FIFO.

## Proposed Approach
Extend queue item metadata and scheduler selection rules to support dependencies, blocked-by states, scheduling policy, and visible waiting reasons.

## Implementation Steps
- Define dependency metadata such as `dependsOn`, `blockedBy`, or TODO: final field names. (Implemented as `dependsOn` and `blockedBy` with `waitingReason`.)
- Add scheduling policies: FIFO and fix-before-new-task. (Implemented through `settings.schedulingPolicy`.)
- Document how reviewed-fix-request and blocked items interact with new queued work. (Started: `fix-before-new-task` sorts reviewed fix requests before queued work; `fifo` sorts all eligible implementation work by creation time.)
- Update queue dashboard to show dependency chains and waiting reasons. (Implemented in the queue detail sheet and warning rows.)
- Add scheduler tests for dependency and policy ordering.

## Affected Files Or Areas
- `brain/features/background-scheduler.md`
- `brain/features/queue-dashboard.md`
- `brain/api/contracts.md`
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components/tables/queue`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- Queue items can declare dependencies on other queue items. (Implemented with `dependsOn`.)
- Scheduler skips dependent tasks until prerequisites complete. (Implemented; dependencies are satisfied only when referenced items are `approved`.)
- Users can configure FIFO or fix-before-new-task policy. (Implemented in Settings > Automation.)
- Queue UI shows dependency and scheduling-policy blocked reasons. (Implemented with `waitingReason`, `blockedBy`, and detail sheet fields.)

## Current Implementation Notes

- `schedulingPolicy` defaults to `fix-before-new-task`.
- `fix-before-new-task` sorts `reviewed-fix-request` before `queued`, then priority, then creation time.
- `fifo` sorts all eligible implementation work by `createdAt`.
- Dependency waits do not change queue status; they write `waitingReason`, `blockedBy`, and a `dependency_waiting` history event.
- Dependency cycles and self-dependencies are treated as waiting reasons rather than launching.
- Cargo-based scheduler tests remain blocked until the host has a Rust toolchain.

## Test Plan
- Scheduler policy tests for FIFO, fix-first, dependency satisfied, and dependency unsatisfied cases.
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`

## Brain Update Requirements
- Update queue/scheduler feature docs and API contracts.
- Add ADR if queue dependency fields become durable global contract.
- Update `brain/progress.md`.

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
- Dependency cycles must be detected and surfaced.
- Fix-first policy can starve new work if fixes never clear.

## Open Questions
- TODO: Final queue dependency field names.

## Linked Task
- Task Title: Add Task Sequence And Scheduling Policy
- Task File: brain/tasks/roadmap.md
