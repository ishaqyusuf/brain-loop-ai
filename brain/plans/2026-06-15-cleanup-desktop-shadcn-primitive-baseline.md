# Plan: Expand Desktop Shadcn Primitive Baseline

## Type
Cleanup

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
The desktop app has several shadcn primitives, but current UI code still uses raw inputs, custom toggle buttons, and ad hoc interactive wrappers because the local primitive baseline is incomplete or not consistently applied.

## Current Context
`brain/engineering/coding-standards.md` says to use shadcn primitives before custom markup, semantic tokens, component variants, `gap-*`, `size-*`, and `cn()`. Current desktop primitives include Button, Badge, Card, Alert, Tabs, Select, Sheet, ScrollArea, Tooltip, Separator, Skeleton, DropdownMenu, and Table. Source scan still shows raw `<input>`, `<button>`, and custom toggle/panel markup in `apps/desktop/src`.

## Proposed Approach
Audit the current desktop UI surfaces, identify missing shadcn primitives required by existing screens, add or generate only the needed primitives, and document a local replacement checklist so follow-up refactors use the same components and variants.

## Implementation Steps
- Audit `apps/desktop/src/components/ui/` and current component usage for missing primitives such as Input, Textarea, Switch, Label, Form, Dialog, Empty, and any needed field helpers.
- Add only primitives needed by current desktop surfaces under `apps/desktop/src/components/ui/`, following the existing shadcn file style and aliases.
- Ensure primitives support the dark Codex desktop treatment through semantic classes and component variants rather than one-off raw colors where practical.
- Update imports or examples only where needed to prove the primitives compile.
- Add a concise checklist to the relevant Brain UI docs for replacing raw buttons, inputs, toggles, and panel wrappers.

## Affected Files Or Areas
- `apps/desktop/src/components/ui/`
- `apps/desktop/components.json`
- `apps/desktop/src/lib/utils.ts`
- `brain/engineering/coding-standards.md`
- `brain/features/ui-shell.md`

## Acceptance Criteria
- Required shadcn primitives for current UI refactors exist in `apps/desktop/src/components/ui/`.
- New primitives follow existing project import aliases and styling conventions.
- No new primitive introduces a bright/default treatment that conflicts with the Codex desktop visual standard.
- Brain docs include a brief standardization checklist for current UI surfaces.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- Manual code inspection for primitive exports and import paths.

## Brain Update Requirements
- Update `brain/engineering/coding-standards.md` if primitive usage guidance changes.
- Update `brain/features/ui-shell.md` if the UI shell shadcn requirements become more specific.
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
- Adding too many primitives can create unnecessary code churn; keep the baseline limited to current UI needs.
- shadcn CLI may require network access; if unavailable, adapt from existing local primitive style and report the limitation.

## Open Questions
- None

## Linked Task
- Task Title: Expand Desktop Shadcn Primitive Baseline
- Task File: brain/tasks/done.md
