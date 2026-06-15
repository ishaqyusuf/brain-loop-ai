# Brain Handoff: Build Midday/Shadcn Desktop Shell

## Status
Ready

## Source Plan
brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md

## Task
- Task Title: Build Midday/Shadcn Desktop Shell
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: UI architecture, component composition, and visual QA are design-sensitive.

## Goal
Create the main desktop control console shell with Midday-style layout boundaries and shadcn primitives.

## Context To Read First
- brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Inspect current desktop app files and any shadcn config from the foundation phase.
2. Add Midday-style component folders for sidebar, sheets, modals, forms, tables, and shared shell components.
3. Use shadcn `Button`, `Card`, `Badge`, `Tabs`, `Separator`, `ScrollArea`, `Skeleton`, `Alert`, and `Tooltip` patterns where applicable.
4. Avoid custom markup where shadcn components already fit.
5. Keep data fetching isolated behind `packages/desktop-client` wrappers.
6. Add responsive desktop-first layout states and loading/error surfaces.

## Acceptance Criteria
- The first screen is the actual Brain Loop console, not a landing page.
- Navigation and layout support all planned product areas.
- shadcn composition rules are followed for cards, buttons, badges, alerts, skeletons, and tooltips.
- The shell can render with empty Brain state without broken layout or placeholder-only content.

## Files Or Areas Likely Involved
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components`
- `apps/desktop/src/styles.css`
- `components.json` if present
- `brain/features/ui-shell.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual desktop/browser visual check for empty state and populated mock state if available

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-build-midday-shadcn-desktop-shell.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/features/ui-shell.md`.
- Update `brain/engineering/repo-structure.md` if UI folders change.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
- Checks run:
- Brain docs updated:
- Unresolved issues:
