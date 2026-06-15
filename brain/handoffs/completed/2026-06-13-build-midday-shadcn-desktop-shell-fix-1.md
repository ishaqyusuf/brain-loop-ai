# Brain Fix Handoff: Build Midday/Shadcn Desktop Shell

## Status
Ready

## Source Review
brain/reviews/2026-06-13-build-midday-shadcn-desktop-shell-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-build-midday-shadcn-desktop-shell-handoff.md

## Source Plan
brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-build-midday-shadcn-desktop-shell.json

## Goal
Fix only the blocking review findings for the Midday/Shadcn desktop shell.

## Fix Items
1. Expand the sidebar and shell navigation so the visible product areas include projects, queue, runs/logs, approvals, scheduler/automation, and settings.
2. Add shadcn-composed loading, error, warning, and empty states using appropriate primitives such as Alert, Skeleton, Tooltip, Badge, Card, Tabs, and ScrollArea.
3. Avoid raw custom status/result boxes where shadcn primitives fit; use semantic tokens, variants, and `cn()` where conditional styling is needed.
4. Update Brain docs required by the handoff, especially `brain/progress.md` and `brain/features/ui-shell.md`, to describe the implemented shell state.

## Context To Read First
- brain/reviews/2026-06-13-build-midday-shadcn-desktop-shell-review.md
- brain/handoffs/ready/2026-06-12-build-midday-shadcn-desktop-shell-handoff.md
- brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md
- brain/features/ui-shell.md
- apps/desktop/src/app.tsx
- apps/desktop/src/components/sidebar.tsx
- apps/desktop/src/components/ui/

## Acceptance Criteria
- Sidebar/navigation visibly supports all planned product areas from `brain/features/ui-shell.md`.
- Shell shows visible shadcn-composed loading, empty, error, and warning states.
- `bun --filter @brain-loop/desktop typecheck` passes.
- `bun --filter @brain-loop/desktop build` passes.
- `brain/progress.md` and `brain/features/ui-shell.md` are updated with fix completion notes.

## Do Not Change
- Do not broaden the scope beyond the desktop shell review findings.
- Do not move the task to done.
- Do not rewrite unrelated Rust or queue logic.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/ui-shell.md` to document the implemented shell behavior.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src/components/sidebar.tsx` — expanded nav from 5 items to 9: added Runs, Logs, Approvals, Scheduler with lucide-react icons. Changed nav layout to use icon+label rows with `gap-0.5` spacing.
  - `apps/desktop/src/app.tsx` — replaced raw div result display with shadcn Alert components (destructive for errors, default for success with CheckCircle2/AlertCircle icons). Added Skeleton loading grid for initial poll. Added empty-state Alert for zero activity. Added scheduler-error warning Alert. Added connection-lost error Alert.
  - `brain/features/ui-shell.md` — added Implemented Behavior section documenting actual shell state.
- Checks run:
  - `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
  - `bun --filter @brain-loop/desktop build`: pass (exit 0)
- Brain docs updated:
  - `brain/features/ui-shell.md` — documented implemented shell behavior
  - `brain/progress.md` — fix-1 completion notes
- Unresolved issues: None
