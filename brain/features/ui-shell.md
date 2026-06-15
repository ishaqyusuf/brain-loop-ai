# Feature: UI Shell

## Purpose

Provide a Codex-standard desktop console for Brain automation control, using shadcn primitives and Midday-inspired component organization where helpful.

## Planned Behavior

- First screen is the operational Brain Loop thread workspace, not a generic dashboard or landing page.
- Left navigation exposes primary actions, search, project/queue/runs/logs/approvals/scheduler areas, pinned threads, all threads, and settings.
- The center surface shows the active thread timeline with user messages, agent output, Brain artifact cards, edited-file summaries, checks, and approvals.
- A bottom composer provides attach/action controls, approval mode, runner/model selection when available, and send controls without layout shift.
- An optional right Environment panel shows changes, local/project context, branch/worktree, commit or push readiness, and sources.
- Sidebar branding uses the Brain Loop option-1 mark: a compact app-icon tile with a single continuous brain/loop contour in blue/cyan linework.
- Empty, loading, error, and warning states are visible and shadcn-composed.
- Layout stays dense, scan-friendly, and desktop-app focused.

## Implemented Behavior

- Sidebar navigation covers Overview, Projects, Queue, Runs, Logs, Approvals, Scheduler, Threads, and Settings — matching all planned product areas per `brain/features/ui-shell.md`.
- Load state shows Skeleton placeholder cards while the initial brain status poll resolves.
- Error state shows a destructive Alert when `getBrainStatus` fails (connection lost).
- Warning state shows an info Alert when scheduler status is `error` but brain status is healthy.
- Empty state shows an info Alert when no activity exists (zero active runs, queued, submitted, or blocked items).
- Manual run results use Alert with `CheckCircle2` (success) or `AlertCircle` (failure) icons instead of raw custom divs.
- Status cards use shadcn Card/CardHeader/CardContent primitives.

## Codex/Shadcn Requirements

- Match Codex desktop density, dark-first contrast, compact icon controls, restrained card borders, and thread-oriented information flow.
- Use Midday-inspired component boundaries under `apps/desktop/src/components` when they keep tables, sheets, forms, and shared surfaces organized.
- Prefer shadcn primitives before custom markup.
- Use `Button`, `Badge`, `Card`, `Tabs`, `Tooltip`, `Alert`, `Skeleton`, `Separator`, `ScrollArea`, `Sheet`, `Dialog`, and table/form primitives where appropriate.
- Use `gap-*`, semantic tokens, `cn()`, and accessible overlay titles.
- Keep React entrypoints thin.
- Verify significant UI changes visually against the Codex reference standard.

## Implementation Plans

- `brain/plans/2026-06-12-cleanup-workspace-validation-ui-foundation.md`
- `brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md`
- `brain/plans/2026-06-13-ux-ui-codex-ui-standard-visual-contract.md`
- `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md`
- `brain/plans/2026-06-13-ux-ui-codex-environment-changes-panel.md`
- `brain/plans/2026-06-13-ux-ui-codex-artifact-change-cards.md`
- `brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md`

## Brain Docs To Keep Updated

- `brain/engineering/repo-structure.md`
- `brain/engineering/coding-standards.md`
- `brain/product/roadmap.md`
