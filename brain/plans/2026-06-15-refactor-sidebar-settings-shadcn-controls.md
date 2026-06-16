# Plan: Refactor Sidebar And Settings To Shadcn Controls

## Type
Refactor

## Status
Done

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-15-shadcn-ui-standardization.md
- Intake Item: Standardize all current code to shadcn UI.

## Goal Or Problem
The sidebar and settings page are visually close to the target, but they still rely on raw `<button>` elements, a raw search input wrapper, custom toggle buttons, custom settings cards, and direct color classes where shadcn primitives and variants should carry the interaction semantics.

## Current Context
`apps/desktop/src/components/sidebar.tsx` uses shadcn `Button` for the header icon but raw buttons for agent rows and the footer Settings action. `apps/desktop/src/components/settings/settings-page.tsx` uses shadcn Button/Badge/Select in places but still includes raw navigation buttons, a raw search input, custom `ToggleButton`, custom `CategoryCard`, and custom `SettingsGroup` wrappers. The visual target remains Codex desktop, not generic shadcn marketing UI.

## Proposed Approach
Refactor sidebar and settings interactions to shadcn-composed controls while preserving the current Codex density, dark palette, footer Settings placement, and category layout.

## Implementation Steps
- Replace raw sidebar agent and footer settings buttons with shadcn `Button` or a local shadcn-composed nav item that uses `buttonVariants`.
- Preserve active/hover/focus-visible states for agent rows and the Settings footer action.
- Replace the settings search label/input markup with shadcn `Input` plus accessible label or visually-hidden label.
- Replace custom settings toggle markup with shadcn `Switch` or an equivalent shadcn-composed switch primitive.
- Convert settings category cards and settings groups to shared shadcn-composed Card/Button/Separator compositions without nesting cards inside cards.
- Keep planned/disabled rows readable and accessible.

## Affected Files Or Areas
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/settings/settings-page.tsx`
- `apps/desktop/src/components/ui/button.tsx`
- `apps/desktop/src/components/ui/input.tsx`
- `apps/desktop/src/components/ui/switch.tsx`
- `apps/desktop/src/components/ui/label.tsx`
- `brain/features/ui-shell.md`

## Acceptance Criteria
- Sidebar agent rows and footer Settings action no longer use raw `<button>` styling when a shadcn `Button`/variant composition fits.
- Settings search uses a shadcn input primitive.
- Settings toggles use shadcn switch semantics with keyboard and disabled support.
- Settings category and row controls preserve the current Codex-style layout without white/bright primary button regressions.
- Text does not overlap or resize the sidebar/settings layout at full-screen and narrower desktop widths.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- Manual settings navigation check for every category.
- Manual visual check of sidebar footer Settings action, active agent rows, settings search, toggles, and disabled planned rows.

## Brain Update Requirements
- Update `brain/features/ui-shell.md` with any changed implemented behavior or component requirements.
- Update `brain/progress.md` when implementation completes.

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
- shadcn `Button` defaults can accidentally add secondary borders or backgrounds where current nav rows expect transparent chrome; use `ghost`, custom className, or `buttonVariants` carefully.
- The Settings footer should remain visually transparent unless hovered.

## Open Questions
- None

## Linked Task
- Task Title: Refactor Sidebar And Settings To Shadcn Controls
- Task File: brain/tasks/done.md
