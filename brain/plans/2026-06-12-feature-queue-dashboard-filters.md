# Plan: Build Queue Dashboard And Filters

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 40-50%

## Goal Or Problem
Give users a clear queue dashboard for handoffs, statuses, projects, recommended agents, priorities, queue age, and active execution paths.

## Current Context
The app's main value depends on visibility into `queues/handoffs/*.json` and related project eligibility. Existing Brain docs require all run state to be auditable.

## Proposed Approach
Build a Codex-standard queue surface with compact table/list views, URL/store-backed filters, status summaries, empty states, and details sheets.

## Implementation Steps
- Add queue summary and queue listing client calls.
- Build `components/tables/queue` with columns, data table, header, skeleton, empty states, and optional row action menu.
- Add filters for project, status, agent, priority, and stale/picked age.
- Add queue item details sheet that shows paths, history, errors, and execution target.
- Surface ineligible projects and stale picked/started items as warnings without mutating state.
- Keep queue context accessible from the thread workspace and right environment panel when a queue item is active.

## Affected Files Or Areas
- `apps/desktop/src/components/tables/queue`
- `apps/desktop/src/components/sheets`
- `apps/desktop/src/hooks` or local store
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src-tauri/src`
- `brain/features/queue-dashboard.md`

## Acceptance Criteria
- Users can inspect queue items without opening JSON files manually.
- Filters and summary metrics make active, blocked, stale, submitted, and approved work obvious.
- Queue item details include history, handoff path, execution path, worktree path, and last error.
- Empty/loading/error states follow Codex visual density, shadcn composition, and Midday table organization.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- `cargo check` from `apps/desktop/src-tauri`
- Manual check with queued, picked, started, submitted, blocked, and approved sample files

## Brain Update Requirements
- Update `brain/features/queue-dashboard.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md` if new read commands are added.
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
- Large queue directories may require pagination or virtualization.
- Queue files can be malformed or partially written.

## Open Questions
- None

## Linked Task
- Task Title: Build Queue Dashboard And Filters
- Task File: brain/tasks/in-progress.md
