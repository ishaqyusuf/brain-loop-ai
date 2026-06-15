# Plan: Establish Workspace Validation And UI Foundation

## Type
Cleanup

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 0-5%

## Goal Or Problem
Make the repo reliable to install, typecheck, lint, build, and extend with Midday-style package boundaries and shadcn UI setup.

## Current Context
The repo has a Bun/Turbo scaffold, `apps/desktop`, `packages/brain-core`, `packages/desktop-client`, and Brain docs. There is no `components.json`, no shared UI package, and validation scripts currently map lint to typecheck.

## Proposed Approach
Establish the smallest dependable foundation: verify workspace scripts, add or document shadcn initialization for the desktop app, create baseline component folders, and keep app entrypoints thin.

## Implementation Steps
- Inspect current package scripts and Tauri/Vite/Rust config.
- Add missing baseline source folders that match `brain/engineering/repo-structure.md`.
- Initialize or document shadcn usage with the project package runner and keep generated components in the desktop UI boundary unless a shared UI package is introduced intentionally.
- Confirm `apps/desktop/src/main.tsx` and `apps/desktop/src/app.tsx` remain thin entrypoints.
- Add or refine validation scripts only where they map to real checks.

## Affected Files Or Areas
- `package.json`
- `turbo.json`
- `apps/desktop/package.json`
- `apps/desktop/src`
- `apps/desktop/src-tauri`
- `components.json` if shadcn is initialized
- `brain/engineering/repo-structure.md`
- `brain/engineering/coding-standards.md`

## Acceptance Criteria
- Workspace install and narrow validation commands are documented and runnable.
- Desktop UI has a clear Midday-style folder baseline for components, sheets, forms, tables, sidebar, and shell layout.
- shadcn usage is initialized or explicitly documented as pending with the exact runner command.
- No unrelated product behavior is implemented in this foundation task.

## Test Plan
- `bun run typecheck`
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`

## Brain Update Requirements
- Update `brain/engineering/repo-structure.md` if folders or package boundaries change.
- Update `brain/engineering/coding-standards.md` if validation or shadcn setup rules change.
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
- shadcn CLI may require dependency installation or network access.
- Avoid introducing a shared UI package until actual reuse requires it.

## Open Questions
- None

## Linked Task
- Task Title: Establish Workspace Validation And UI Foundation
- Task File: brain/tasks/in-progress.md
