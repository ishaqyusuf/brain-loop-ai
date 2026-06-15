# Plan: Add Notifications, Packaging, And Release Readiness

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 96-100%

## Goal Or Problem
Finish Brain Loop with desktop notifications, packaging checks, release documentation, and end-to-end verification for the local automation workflow.

## Current Context
The roadmap includes notifications after MVP. A release-ready desktop app must validate packaging, permissions, empty states, runner-missing states, and queue workflows.

## Proposed Approach
Add notification surfaces for important automation events, verify Tauri build/package behavior, and document local release and smoke-test steps.

## Implementation Steps
- Add notification events for blocked queue items, submitted work, review requests, approvals needed, and scheduler errors.
- Add user settings for notification categories if needed.
- Verify Tauri production build and app permissions.
- Add release smoke-test checklist covering empty Brain state, sample queue, runner missing, runner success, approval, and scheduler pause.
- Update README with local usage and release verification.

## Affected Files Or Areas
- `apps/desktop/src-tauri`
- `apps/desktop/src`
- `README.md`
- `brain/features/background-scheduler.md`
- `brain/features/automation-runs.md`
- `brain/product/roadmap.md`

## Acceptance Criteria
- Key automation events can notify the user without overwhelming them.
- Production desktop build completes or has documented blockers.
- README documents installation, development, and release smoke tests.
- Brain docs reflect final MVP/next status.

## Test Plan
- `bun run typecheck`
- `bun --filter @brain-loop/desktop build`
- `bun --filter @brain-loop/desktop tauri:build` if local Tauri prerequisites are available
- Manual release smoke-test checklist

## Brain Update Requirements
- Update `brain/product/roadmap.md`.
- Update relevant feature docs for notifications and release status.
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
- Tauri packaging may require platform signing or prerequisites that are unavailable in the implementation environment.

## Open Questions
- None

## Linked Task
- Task Title: Add Notifications, Packaging, And Release Readiness
- Task File: brain/tasks/in-progress.md
