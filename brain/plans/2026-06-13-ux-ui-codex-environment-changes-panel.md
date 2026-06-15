# Plan: Build Codex Environment And Changes Panel

## Type
UX/UI

## Status
Proposed

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Intake Item: UI should follow Codex standard.

## Goal Or Problem
Expose the current environment, worktree, branch, changes, sources, and commit/push actions in a compact Codex-style side panel.

## Current Context
Brain Loop needs queue, worktree, runner, approval, and source context to stay visible while a thread is active. The Codex reference shows this as a right-side Environment panel rather than a separate page.

## Proposed Approach
Add an optional right panel scoped to the active thread/run. It should summarize execution context and provide safe review actions without forcing users out of the thread.

## Implementation Steps
- Design a right-side `Environment` panel with compact sections for changes, execution location, branch/worktree, commit or push, and sources.
- Connect changes summary to available git/run metadata, with TODO placeholders only where data is not yet modeled.
- Show local/project context, runner/model context, and queue item status when available.
- Add collapsible or responsive behavior so the thread workspace remains usable on narrower windows.
- Use Codex-standard compact icon buttons, tooltips, status coloring, and restrained borders.

## Affected Files Or Areas
- `apps/desktop/src/components/environment`
- `apps/desktop/src/components/shell`
- `apps/desktop/src/components/threads`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/ui-shell.md`
- `brain/features/automation-runs.md`

## Acceptance Criteria
- Active threads can show environment context without leaving the conversation surface.
- Changes show added/removed counts when available, or a clear empty state when unavailable.
- Branch/worktree/project context is visible and tied to the active run or selected queue item.
- Commit/push controls are present only when supported and are disabled with clear reasons otherwise.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check with no changes, pending changes, and missing source data states.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/features/automation-runs.md` if run metadata is surfaced in the panel.
- Update `brain/api/contracts.md` if new context data is exposed.
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
- Git metadata may be unavailable for generated queue worktrees; show explicit unavailable states instead of blank panels.

## Open Questions
- None

## Linked Task
- Task Title: Build Codex Environment And Changes Panel
- Task File: brain/tasks/roadmap.md
