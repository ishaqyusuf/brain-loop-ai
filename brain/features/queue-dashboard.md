# Feature: Queue Dashboard

## Purpose

Make global handoff queue state visible, searchable, and actionable without opening JSON files manually.

## Planned Behavior

- Display queue items across statuses: queued, picked, started, stale-started, submitted, reviewing, reviewed-fix-request, landing, blocked, and approved.
- Show project, priority, agent, recommended agent, handoff path, execution path, worktree path, last error, and history.
- Provide filters for status, project, agent, priority, and stale active items.
- Show clear empty, loading, malformed-file, and ineligible-project states.

## UI Pattern

- Present queue state inside the Codex-standard desktop shell, with dense rows, compact status badges, and thread/run context visible from the active workspace.
- Use `components/tables/queue` with columns, data table, header, skeleton, and empty states.
- Use details sheets for full queue metadata.
- Use shadcn badges, tooltips, alerts, and scroll areas.

## Implementation Plans

- `brain/plans/2026-06-12-feature-queue-dashboard-filters.md`

## Brain Docs To Keep Updated

- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`

## Implemented Behavior

- The UI features a `QueueTable` embedded in the `Queue` tab.
- Filtering is available by `Status`, `Agent`, `Project`, `Priority`, and stale active-work age via standard drop-down menus.
- It displays Project, Status, Agent, Priority, queue age, and warning badges in a responsive table.
- Queue summary metrics show active, blocked, stale, submitted, and approved work without row-by-row inspection.
- Stale picked/started/stale-started work and disabled or unknown project assignments surface as warnings without mutating queue JSON.
- Row-level `Details` actions trigger a side-sheet exposing execution path, worktree path, plan path, handoff path, active handoff path, review path, runner/session IDs, lease timing, explicit last error state, and history log.
- Relies on the `list_queue` backend endpoint mapped to frontend `listQueue()`.
- Uses `list_projects` to annotate disabled/ineligible project warnings.
- Provides loading, empty data, and visible queue-fetch error states.
- The shared queue status contract and Tauri mutation validator include stale-started, reviewing, and landing so filters and review/landing state are first-class.
