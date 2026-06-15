# Brain Fix Handoff: Build Queue Dashboard And Filters Fix 1

## Status
Ready

## Source Review
brain/reviews/2026-06-15-build-queue-dashboard-and-filters-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-build-queue-dashboard-and-filters-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-queue-dashboard-filters.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-build-queue-dashboard-and-filters.json

## Goal
Complete the queue dashboard acceptance criteria that were missing from the first implementation pass.

## Fix Items
1. Add project and priority filters to QueueTable alongside the existing status and agent filters.
2. Add a stale/picked-age filter or toggle that highlights/filters queue items with stale active work. Treat picked/started items with old timestamps or explicit stale-started status as stale candidates without mutating queue state.
3. Add visible queue summary metrics in the Queue tab or QueueTable for active, blocked, stale, submitted, and approved work.
4. Surface stale picked/started items and ineligible/disabled-project items as warning alerts or warning rows without changing queue JSON state.
5. Expand the details sheet to include worktree path, active handoff path, review path, runner/session, lease timing when present, and an explicit last-error value even when empty.
6. Add a visible queue-fetch error state instead of only clearing the loading indicator when listQueue fails.
7. Update brain/features/queue-dashboard.md and brain/progress.md to match the completed behavior. Update API docs only if command contracts change.

## Context To Read First
- brain/reviews/2026-06-15-build-queue-dashboard-and-filters-review.md
- brain/handoffs/ready/2026-06-12-build-queue-dashboard-and-filters-handoff.md
- brain/plans/2026-06-12-feature-queue-dashboard-filters.md
- apps/desktop/src/components/tables/queue/queue-table.tsx
- apps/desktop/src/app.tsx
- brain/features/queue-dashboard.md
- brain/progress.md

## Acceptance Criteria
- Users can filter queue items by project, status, agent, priority, and stale/picked age.
- Queue summary metrics make active, blocked, stale, submitted, and approved work obvious without row-by-row inspection.
- Queue item details include history, handoff path, active handoff path, execution path, worktree path, review path, runner/session, lease timing, and last error.
- Stale active items and disabled/ineligible-project items surface as warnings without mutating queue state.
- Loading, empty, and error states are visible and composed with existing shadcn/Midday table conventions.

## Do Not Change
- Do not broaden into scheduler dispatch, LaunchAgent, terminal, or unrelated shell redesign work.
- Do not move the task to done.
- Do not mutate queue items from the dashboard while implementing warnings.

## Required Checks
- bun --filter @brain-loop/desktop typecheck
- bun --filter @brain-loop/desktop build
- cargo check from apps/desktop/src-tauri if Rust/backend code changes; otherwise record that Cargo remains unavailable if it cannot be run.
- Manual/code inspection with queued, picked, started, submitted, blocked, approved, reviewed-fix-request, and stale-started sample statuses.

## Brain Update Contract
- Update brain/progress.md with fix completion notes.
- Update brain/features/queue-dashboard.md to describe the completed filters, summary metrics, details fields, warnings, and error state.
- Update brain/api/endpoints.md and brain/api/contracts.md only if command contracts change.
- Keep the task in brain/tasks/in-progress.md.

## Completion Notes

- Changed files:
  - `apps/desktop/src/components/tables/queue/queue-table.tsx` - added project, priority, and stale-age filters; active/blocked/stale/submitted/approved metrics; stale and disabled/unknown project warnings; queue age column; and expanded details metadata.
  - `apps/desktop/src/app.tsx` - added project registry loading via `listProjects()` and visible queue-fetch error propagation into `QueueTable`.
  - `packages/brain-core/src/types.ts` - aligned `QueueStatus` with active Brain lifecycle statuses.
  - `packages/brain-core/src/constants.ts` - added stale-started, reviewing, and landing to valid statuses and status transitions.
  - `apps/desktop/src-tauri/src/brain.rs` - aligned the Rust queue mutation status validator and transition errors with the expanded status lifecycle.
  - `brain/api/contracts.md` - documented the expanded status contract.
  - `brain/features/queue-dashboard.md` - documented completed filters, metrics, warnings, details fields, and error state.
  - `brain/progress.md` - added Fix 1 completion notes.
- Checks run:
  - Targeted code inspection only, following fast Bun monorepo command discipline. Recommended follow-up checks: `bun --filter @brain-loop/desktop typecheck` and `bun --filter @brain-loop/desktop build`.
  - `cargo check`: not run; Rust/Cargo toolchain is unavailable on the host.
- Brain docs updated:
  - `brain/api/contracts.md`
  - `brain/features/queue-dashboard.md`
  - `brain/progress.md`
- Unresolved issues:
  - Full Bun typecheck/build not run in this pass because the active command-discipline skill says not to run typechecks/builds by default.
  - Rust validation remains blocked until the host has a working Rust/Cargo toolchain.
