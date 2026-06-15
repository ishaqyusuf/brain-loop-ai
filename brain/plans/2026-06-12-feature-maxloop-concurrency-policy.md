# Plan: Add MaxLoop Concurrency Policy Settings

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
- Intake Item: MaxLoop global, per runner, per project, and per runner per project

## Goal Or Problem
Give users precise control over how many automation threads may run globally, per runner, per project, and per runner/project combination.

## Current Context
Current settings include `maxRunningProcesses`. User wants richer MaxLoop behavior: global hard cap, runner-specific cap, project-specific cap, and runner-per-project overrides.

## Proposed Approach
Define a hierarchical concurrency policy where specific overrides win over general defaults, then add settings UI and scheduler enforcement.

## Implementation Steps
- Define MaxLoop settings schema with scopes: global, runner, project, runnerProject.
- Document precedence rules and disabled/zero semantics.
- Update scheduler selection logic to respect every active cap.
- Add settings UI for global defaults and per-project overrides.
- Add queue/dashboard indicators when tasks are waiting on concurrency.

## Affected Files Or Areas
- `brain/features/background-scheduler.md`
- `brain/features/queue-dashboard.md`
- `brain/api/contracts.md`
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- MaxLoop policy supports global, runner, project, and runner-project scopes.
- Scheduler cannot exceed the most specific active cap.
- UI explains why a task is waiting when concurrency blocks it.
- Per-project overrides can differ from global defaults.

## Test Plan
- Rust unit tests or table tests for concurrency policy evaluation.
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`

## Brain Update Requirements
- Update scheduler, queue dashboard, and contracts docs.
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
- Conflicting caps can confuse users unless blocked reasons are explicit.
- Global cap should always remain the final upper bound.

## Open Questions
- None

## Linked Task
- Task Title: Add MaxLoop Concurrency Policy Settings
- Task File: brain/tasks/roadmap.md
