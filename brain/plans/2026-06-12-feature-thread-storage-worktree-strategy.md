# Plan: Add Thread Storage And Worktree Strategy Settings

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
- Intake Item: Optional worktree or master; keep threads like Codex, Documents/codex

## Goal Or Problem
Let users choose where threads live and whether execution uses isolated worktrees or the main checkout.

## Current Context
Brain handoff currently defaults to isolated worktrees when possible, but this repo has no HEAD commit and fell back to project path. User wants optional worktree or master and Codex-like thread storage under a documents location.

## Proposed Approach
Add explicit settings for execution strategy and thread storage root, then reflect those settings in handoff queue items, thread UI, and scheduler behavior.

## Implementation Steps
- Define execution strategy values such as `worktree`, `main-checkout`, and `auto`.
- Define thread storage root and per-thread folder conventions.
- Document Codex-like default thread location, with TODO final path such as `~/Documents/codex`.
- Add settings UI for thread root and execution strategy.
- Update handoff/queue creation logic to respect settings.

## Affected Files Or Areas
- `brain/features/threaded-terminals.md`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- Users can configure thread storage root.
- Users can configure worktree/main-checkout/auto execution strategy.
- Queue items and thread metadata reflect the selected strategy.
- UI clearly warns when main checkout execution is selected.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual check with worktree unavailable and main-checkout fallback.

## Brain Update Requirements
- Update threaded terminal, automation run, contract, and permission docs.
- Add ADR if execution strategy defaults change.
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
- Main-checkout execution can collide with user work.
- Thread storage paths may need migration when the state root changes.

## Open Questions
- TODO: Final default thread storage root.

## Linked Task
- Task Title: Add Thread Storage And Worktree Strategy Settings
- Task File: brain/tasks/roadmap.md
