# Plan: Refactor Tables And Sheets To Shadcn Forms

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
Project and queue tables already use table primitives, but parts of their filters, sheet forms, detail panels, inputs, warnings, and inline confirmations still use custom markup that should be standardized to shadcn form and card composition.

## Current Context
`apps/desktop/src/components/tables/projects/project-table.tsx` uses shadcn table and sheet primitives but still contains raw `<input>` elements for project form fields and custom bordered detail blocks. `apps/desktop/src/components/tables/queue/queue-table.tsx` uses table primitives, badges, alerts, and buttons but still has custom rounded/bordered wrappers and detail panels. Existing Brain standards ask tables to follow Midday domain table organization while using shadcn primitives before custom markup.

## Proposed Approach
Refactor current project and queue table surfaces so filters, forms, confirmations, warnings, details, and empty/loading/error surfaces use shadcn primitives and shared local compositions without changing backend commands or Brain JSON contracts.

## Implementation Steps
- Replace raw project form inputs with shadcn `Input`, `Label`, and form field composition.
- Preserve validation messages and disabled/saving states in project create/edit sheets.
- Normalize queue and project table wrapper panels to shadcn Card/Table/Alert/Badge compositions.
- Convert queue detail metadata and error blocks to consistent Card/Separator/Alert or code-block compositions.
- Ensure filters and inline actions continue to use existing shadcn Select/Button/Badge semantics.
- Avoid changing Tauri commands, queue/project contracts, or mutation behavior.

## Affected Files Or Areas
- `apps/desktop/src/components/tables/projects/project-table.tsx`
- `apps/desktop/src/components/tables/queue/queue-table.tsx`
- `apps/desktop/src/components/ui/input.tsx`
- `apps/desktop/src/components/ui/label.tsx`
- `apps/desktop/src/components/ui/form.tsx`
- `brain/features/project-configuration.md`
- `brain/features/queue-dashboard.md`

## Acceptance Criteria
- Project create/edit sheet fields use shadcn input/label/form composition instead of raw input markup.
- Project and queue table panels preserve existing data, filters, warnings, errors, and action behavior.
- Queue detail and error blocks use consistent shadcn-composed surfaces without losing monospaced command/path readability.
- No Brain JSON schema, Tauri command, or desktop-client contract changes are introduced.
- Tables remain dense and scan-friendly at supported desktop widths.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- Manual project create/edit sheet visual check.
- Manual queue table visual check with populated, empty, loading, warning, and error states where available.

## Brain Update Requirements
- Update `brain/features/project-configuration.md` if the project configuration UI behavior changes.
- Update `brain/features/queue-dashboard.md` if queue table behavior changes.
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
- Form refactors can accidentally change controlled input behavior; preserve current state updates and validation exactly.
- Queue detail blocks may include long paths and command strings; keep wrapping and overflow behavior readable.

## Open Questions
- None

## Linked Task
- Task Title: Refactor Tables And Sheets To Shadcn Forms
- Task File: brain/tasks/done.md
