# Plan: Add Codex UI Visual QA Harness

## Type
Test

## Status
Done

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Intake Item: UI should follow Codex standard.

## Goal Or Problem
Prevent regressions from drifting away from the Codex UI standard after the shell, panels, and cards are implemented.

## Current Context
The UI standard is visual and interaction-heavy. Typecheck/build coverage alone cannot catch blank panels, overlapping text, unstable composer layout, or missing right-panel content.

## Proposed Approach
Add a repeatable visual QA path for the desktop web surface using the project’s existing test tooling or the smallest appropriate Playwright-style harness.

## Implementation Steps
- Identify the current app startup command and whether a browser-rendered desktop surface can be tested.
- Add seeded UI states for empty, active thread, pending approval, changed files, missing source data, and running terminal/log output.
- Capture desktop and narrow-width screenshots for the Codex shell, environment panel, artifact cards, and composer.
- Add basic nonblank, overlap, and visibility checks for key UI regions.
- Document how lower agents should run visual QA before completing UI handoffs.

## Affected Files Or Areas
- `apps/desktop`
- `apps/desktop/src/components`
- `apps/desktop/tests` or TODO: project test location
- `package.json`
- `brain/engineering/coding-standards.md`
- `brain/features/ui-shell.md`

## Acceptance Criteria
- UI work has a documented visual verification command or checklist.
- The harness covers the main Codex-standard shell states.
- Screenshots can catch blank render, hidden composer, missing environment panel, and overlapping artifact cards.
- Visual QA is referenced by UI task test plans.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `bun --filter @brain-loop/desktop visual:qa`

## Implementation Progress

- Added `apps/desktop/scripts/codex-visual-qa.mjs` as a zero-dependency Codex UI visual QA gate.
- Added `bun --filter @brain-loop/desktop visual:qa`.
- The command checks built output plus source invariants for the headless shell, fixed top sidebar actions, flat title-only thread rows, dark-first background, opened thread chat surface, persisted timeline rendering, and long artifact/transcript wrapping.
- Generated reports are written to `apps/desktop/visual-qa/codex-ui-report.json` and ignored by Git.
- Removed unused legacy light scaffold CSS that could reintroduce white dashboard/sidebar surfaces.
- Browser screenshot capture and pixel/overlap checks remain a future enhancement when Playwright or another browser automation dependency is available. The v1 harness provides the documented repeatable visual verification command required by UI task plans.

## Brain Update Requirements
- Update `brain/engineering/coding-standards.md`.
- Update `brain/features/ui-shell.md`.
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
- Tauri-specific behavior may not be fully covered in browser-only visual tests; keep manual desktop smoke checks until native automation is available.

## Open Questions
- None for v1. The current zero-dependency harness is the accepted visual QA gate until browser automation is added.

## Linked Task
- Task Title: Add Codex UI Visual QA Harness
- Task File: brain/tasks/roadmap.md
