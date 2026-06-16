# Plan: Build Project Configuration Surface

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
- Intake Item: Project phase 32-40%

## Goal Or Problem
Let users inspect, enable, disable, prioritize, and validate projects registered in `~/.brain-loop/projects.json`.

## Current Context
Project registration is central to handoff queue eligibility. The app should expose it safely without breaking the JSON contract.

## Proposed Approach
Create a project configuration surface inside the Codex-standard shell, using compact tables, shadcn forms/sheets, Midday-style component organization, and Rust-backed atomic writes.

## Implementation Steps
- Add client wrappers for listing and mutating projects.
- Build a projects table with status badges, path visibility, default agent, intervals, and priority.
- Add create/edit project sheet using shadcn form composition and validation.
- Add enable/disable controls with confirmation for risky changes.
- Validate paths and show warnings for missing or inaccessible project roots.
- Ensure table density, empty states, warnings, and action controls follow the Codex UI standard.

## Affected Files Or Areas
- `apps/desktop/src/components/tables/projects`
- `apps/desktop/src/components/forms`
- `apps/desktop/src/components/sheets`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/project-configuration.md`
- `brain/api/endpoints.md`

## Acceptance Criteria
- Users can view all registered projects and their enabled state.
- Users can safely edit supported project fields using atomic writes.
- The UI shows validation errors without corrupting `projects.json`.
- The table follows Codex visual density, Midday table folder conventions, and shadcn composition rules.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`
- Manual check with a temporary Brain project manager directory if supported

## Brain Update Requirements
- Update `brain/features/project-configuration.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md` for project mutation commands.
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
- Disabling the active project could confuse queue handling; the UI should make consequences visible.
- Path validation must not require network access.

## Open Questions
- None

## Linked Task
- Task Title: Build Project Configuration Surface
- Task File: brain/tasks/in-progress.md
