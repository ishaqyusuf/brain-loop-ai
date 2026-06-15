# Plan: Add Background Scheduler Controls

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
- Intake Item: Project phase 84-90%

## Goal Or Problem
Add start, pause, and tick controls for background implementation and review automation while respecting settings, project eligibility, locks, and max running process limits.

## Current Context
MVP calls for menu bar start/pause controls and manual run actions before full scheduling. The global settings file includes default intervals and `maxRunningProcesses`.

## Proposed Approach
Implement an in-app scheduler loop owned by Rust, controlled from React, with clear status events and no LaunchAgent dependency in this phase.

## Implementation Steps
- Add scheduler state model: stopped, running, paused, error.
- Read intervals and limits from global settings.
- Add commands for `start_automation`, `pause_automation`, `run_implementation_once`, and `run_review_once` if not already complete.
- Ensure active tasks below `maxRunningProcesses` before launching work.
- Add menu bar and UI controls that reflect scheduler state.
- Log every scheduler decision and skipped tick.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/background-scheduler.md`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`

## Acceptance Criteria
- Users can start and pause automation from the app.
- Scheduler ticks do not exceed configured process limits.
- Disabled projects are skipped.
- Scheduler decisions are visible in logs or run history.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual scheduler check with safe/stub runner setup

## Brain Update Requirements
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md`.
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
- Scheduler loops must stop cleanly when the app exits or pauses.
- Long-running tasks must remain visible rather than silently occupying capacity.

## Open Questions
- None

## Linked Task
- Task Title: Add Background Scheduler Controls
- Task File: brain/tasks/in-progress.md
