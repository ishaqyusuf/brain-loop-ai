# Plan: Build Codex Artifact And Change Summary Cards

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
Show generated Brain files, edited files, checks, and review actions as Codex-style cards inside the thread timeline.

## Current Context
The reference screenshot shows file cards, edited-file summaries, review buttons, and concise completion text. Brain Loop needs the same pattern for intakes, plans, handoffs, reviews, logs, and code changes.

## Proposed Approach
Create reusable timeline cards for artifacts and change summaries, backed by run metadata where available and graceful manual summaries where metadata is incomplete.

## Implementation Steps
- Add artifact cards for Brain docs, handoffs, reviews, logs, and generated files with title, type, path, and open action.
- Add edited-files summary cards with file paths, additions/deletions, undo/review affordances where supported, and unavailable states where not supported.
- Add completion summary blocks that list Brain files updated, checks run, skipped checks, and unresolved issues.
- Keep card dimensions stable and text wrapping polished across desktop and narrow widths.
- Ensure cards can render safely when paths are missing, deleted, or outside the workspace.

## Affected Files Or Areas
- `apps/desktop/src/components/threads`
- `apps/desktop/src/components/artifacts`
- `apps/desktop/src/components/changes`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/ui-shell.md`
- `brain/features/automation-runs.md`

## Acceptance Criteria
- Thread messages can include file artifact cards with clear open/reveal actions.
- Change summary cards show edited files and additions/deletions when data is available.
- Cards support Brain planning artifacts and implementation/review outputs.
- Missing or unavailable metadata is explained without broken layout.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check with single-file, multi-file, no-file, and unavailable-path examples.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/features/automation-runs.md` if run completion metadata changes.
- Update `brain/api/contracts.md` if artifact/change metadata is added.
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
- File opening and undo/review actions may require separate permissions or APIs; disable unsupported actions explicitly.

## Open Questions
- None

## Linked Task
- Task Title: Build Codex Artifact And Change Summary Cards
- Task File: brain/tasks/roadmap.md
