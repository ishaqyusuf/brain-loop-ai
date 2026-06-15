# Brain Handoff: Build Queue Dashboard And Filters

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-queue-dashboard-filters.md

## Task
- Task Title: Build Queue Dashboard And Filters
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: Dashboard table implementation and visual states benefit from UI-focused execution.

## Goal
Give users a clear queue dashboard for handoffs, statuses, projects, recommended agents, priorities, queue age, and active execution paths.

## Context To Read First
- brain/plans/2026-06-12-feature-queue-dashboard-filters.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add queue summary and queue listing client calls.
2. Build `components/tables/queue` with columns, data table, header, skeleton, empty states, and optional row action menu.
3. Add filters for project, status, agent, priority, and stale/picked age.
4. Add queue item details sheet that shows paths, history, errors, and execution target.
5. Surface ineligible projects and stale picked/started items as warnings without mutating state.

## Acceptance Criteria
- Users can inspect queue items without opening JSON files manually.
- Filters and summary metrics make active, blocked, stale, submitted, and approved work obvious.
- Queue item details include history, handoff path, execution path, worktree path, and last error.
- Empty/loading/error states follow shadcn and Midday table conventions.

## Files Or Areas Likely Involved
- `apps/desktop/src/components/tables/queue`
- `apps/desktop/src/components/sheets`
- `apps/desktop/src/hooks` or local store
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/queue-dashboard.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`
- Manual check with queued, picked, started, submitted, blocked, and approved sample files

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-build-queue-dashboard-and-filters.json

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
- Update `brain/features/queue-dashboard.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md` if new read commands are added.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
- Checks run:
- Brain docs updated:
- Unresolved issues:
