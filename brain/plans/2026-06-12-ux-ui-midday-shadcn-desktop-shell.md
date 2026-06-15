# Plan: Build Codex-Standard Desktop Shell

## Type
UX/UI

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 25-32%

## Goal Or Problem
Create the main desktop control console shell using the Codex desktop visual and interaction standard, with shadcn primitives and Midday-inspired component boundaries where useful.

## Current Context
The app needs a Codex-like mission control surface, but the current UI scaffold is minimal. Coding standards now define Codex desktop as the visible UI standard, with shadcn as primitives and Midday as an architecture/reference pattern.

## Proposed Approach
Build a restrained Codex-standard desktop shell with a left navigation/thread rail, active thread workspace, bottom composer, optional right environment panel, and layout paths for projects, queue, runs, logs, settings, and approvals.

## Implementation Steps
- Inspect current desktop app files and any shadcn config from the foundation phase.
- Add Codex-style shell components for the navigation/thread rail, thread workspace, composer, environment panel slot, and shared status/action surfaces.
- Keep Midday-style component folders for sheets, modals, forms, tables, and shared components where they improve maintainability.
- Use shadcn `Button`, `Card`, `Badge`, `Tabs`, `Separator`, `ScrollArea`, `Skeleton`, `Alert`, and `Tooltip` patterns where applicable.
- Avoid custom markup where shadcn components already fit.
- Keep data fetching isolated behind `packages/desktop-client` wrappers.
- Add responsive desktop-first layout states and loading/error surfaces.
- Add manual visual verification against the Codex reference standard.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components`
- `apps/desktop/src/styles.css`
- `components.json` if present
- `brain/features/ui-shell.md`

## Acceptance Criteria
- The first screen is the actual Brain Loop console, not a landing page.
- Navigation and layout support all planned product areas while preserving the Codex-style thread workspace.
- Left rail, central workspace, composer, and optional right panel have stable dimensions and do not overlap.
- shadcn composition rules are followed for cards, buttons, badges, alerts, skeletons, and tooltips.
- The shell can render with empty Brain state without broken layout or placeholder-only content.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual desktop/browser visual check against the Codex reference standard for empty state and populated mock state if available

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/engineering/repo-structure.md` if UI folders change.
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
- If shadcn is not initialized, this plan depends on the foundation plan.
- Avoid one-note palettes and decorative dashboard chrome; keep the console operational, thread-oriented, and scan-friendly.

## Open Questions
- None

## Linked Task
- Task Title: Build Codex-Standard Desktop Shell
- Task File: brain/tasks/in-progress.md
