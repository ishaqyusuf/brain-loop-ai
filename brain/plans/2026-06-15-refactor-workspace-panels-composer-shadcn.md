# Plan: Refactor Workspace Panels And Composer To Shadcn

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
The main workspace uses several shadcn primitives, but it still contains bespoke panel shells, composer markup, log list buttons, environment cards, source blocks, and progress indicators that should be standardized into shared shadcn compositions.

## Current Context
`apps/desktop/src/app.tsx` uses Card, Alert, Badge, Button, and Separator, but the composer, environment panel, metric tiles, terminal frame, and progress/source blocks remain custom div compositions. `apps/desktop/src/components/logs-panel.tsx` still uses raw log selection buttons. `apps/desktop/src/components/approval-panel.tsx` contains ad hoc body/detail blocks inside cards. The UI must stay dense and Codex-like.

## Proposed Approach
Refactor the workspace shell, composer, environment panel, logs panel, and approval detail blocks to consistent shadcn-composed Card, Button, ScrollArea, Separator, Badge, Alert, Textarea/Input, and Tooltip patterns.

## Implementation Steps
- Replace the composer pseudo-input with a shadcn `Textarea` or readonly/input-ready composition that can later accept real text without layout shift.
- Convert workspace metric tiles and environment/source blocks to reusable shadcn-composed panel/section components.
- Wrap scrollable log and workspace regions with shadcn `ScrollArea` where it improves stable scroll behavior.
- Replace raw log list buttons in `LogsPanel` with shadcn `Button` variants or a local list item using `buttonVariants`.
- Normalize approval detail blocks to shadcn Card/Alert/Separator/Badge compositions while preserving command/path readability.
- Keep all action buttons on secondary/ghost/destructive semantics already established by the desktop Button component.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/logs-panel.tsx`
- `apps/desktop/src/components/approval-panel.tsx`
- `apps/desktop/src/components/terminal-panel.tsx`
- `apps/desktop/src/components/ui/textarea.tsx`
- `brain/features/ui-shell.md`
- `brain/features/automation-runs.md`
- `brain/features/approval-broker.md`

## Acceptance Criteria
- Composer control is shadcn-composed and keeps stable dimensions at desktop and narrow widths.
- Logs list selection controls use shadcn Button/variant semantics rather than raw button styling.
- Environment, source, metric, approval detail, and terminal frame surfaces use consistent shadcn composition and semantic tokens where practical.
- Existing scheduler, run, approval, log, terminal, and notification interactions continue to render.
- No text or controls overlap in the workspace, right panel, or bottom composer.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- Manual visual check of main workspace, composer, environment panel, logs panel, approval panel, and terminal frame.
- Manual smoke check for opening logs, toggling terminal visibility, and running existing action buttons if the host runtime is available.

## Brain Update Requirements
- Update `brain/features/ui-shell.md` if workspace composition changes.
- Update `brain/features/automation-runs.md` or `brain/features/approval-broker.md` only if visible behavior changes.
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
- Over-converting structural layout divs can make the shell less predictable; only replace interaction, card, alert, scroll, form, and framed surfaces where shadcn primitives fit.
- The terminal surface may need a stable raw container for xterm.js; do not break canvas/terminal sizing.

## Open Questions
- None

## Linked Task
- Task Title: Refactor Workspace Panels And Composer To Shadcn
- Task File: brain/tasks/done.md
