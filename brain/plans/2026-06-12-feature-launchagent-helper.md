# Plan: Add LaunchAgent Helper Support

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
- Intake Item: Project phase 90-96%

## Goal Or Problem
Support optional macOS LaunchAgent installation and control so Brain automation can run beyond the foreground app session when the user enables it.

## Current Context
Architecture documents list LaunchAgent as an open question for v1 or v2. Product roadmap includes LaunchAgent helper in the "Next" phase.

## Proposed Approach
Implement helper planning, install/uninstall controls, status detection, and safety documentation without making background persistence mandatory for MVP.

## Implementation Steps
- Decide whether LaunchAgent support belongs in v1 or remains optional for v2; document the decision if durable.
- Add Rust helpers to render, install, unload, and remove a user LaunchAgent plist.
- Add status detection for loaded/unloaded/error states.
- Build settings UI with explicit enable/disable confirmation.
- Ensure logs explain helper activity and failures.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/desktop-client/src/index.ts`
- `brain/features/background-scheduler.md`
- `brain/api/permissions.md`
- `brain/decisions`

## Acceptance Criteria
- Users can see whether the helper is installed and loaded.
- Install/uninstall actions are explicit and reversible.
- Helper failures are reported with actionable messages.
- An ADR captures the v1/v2 helper decision if implementation proceeds.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual check on macOS with dry-run or non-destructive plist rendering first

## Brain Update Requirements
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/permissions.md`.
- Add ADR under `brain/decisions/` if LaunchAgent support is implemented or intentionally deferred.
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
- LaunchAgent changes touch user-level macOS automation and must be explicit, reversible, and well logged.

## Open Questions
- Whether LaunchAgent support ships in v1 or remains a post-MVP feature.

## Linked Task
- Task Title: Add LaunchAgent Helper Support
- Task File: brain/tasks/in-progress.md
