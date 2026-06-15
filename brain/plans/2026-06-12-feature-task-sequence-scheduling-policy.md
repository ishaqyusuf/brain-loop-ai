# Plan: Add Task Sequence And Scheduling Policy

## Type
Feature

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Support task sequence, fix before new task, or FIFO

## Goal Or Problem
Support queue items that must wait for other queue items to finish, and let users choose whether fixes or FIFO ordering take priority.

## Current Context
Current queue selection plans assume eligible queue items can be selected by status and limits. User wants dependency sequencing and a policy choice between "fix before new task" and FIFO.

## Proposed Approach
Extend queue item metadata and scheduler selection rules to support dependencies, blocked-by states, scheduling policy, and visible waiting reasons.

## Implementation Steps
- Define dependency metadata such as `dependsOn`, `blockedBy`, or TODO: final field names.
- Add scheduling policies: FIFO and fix-before-new-task.
- Document how reviewed-fix-request and blocked items interact with new queued work.
- Update queue dashboard to show dependency chains and waiting reasons.
- Add scheduler tests for dependency and policy ordering.

## Affected Files Or Areas
- `brain/features/background-scheduler.md`
- `brain/features/queue-dashboard.md`
- `brain/api/contracts.md`
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components/tables/queue`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- Queue items can declare dependencies on other queue items.
- Scheduler skips dependent tasks until prerequisites complete.
- Users can configure FIFO or fix-before-new-task policy.
- Queue UI shows dependency and scheduling-policy blocked reasons.

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
