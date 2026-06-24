# Feature: Queue Dashboard

## Purpose

Make global handoff queue state visible, searchable, and actionable without opening JSON files manually.

## Planned Behavior

- Display queue items across statuses: queued, picked, started, stale-started, submitted, reviewing, reviewed-fix-request, landing, blocked, and approved.
- Show standard thread/task title, project, priority, agent, recommended agent, handoff path, execution path, worktree path, last error, and history.
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
- It displays Task, Project, Status, Agent, Priority, queue age, and warning badges in a responsive table.
- Queue summary metrics show active, blocked, stale, submitted, and approved work without row-by-row inspection.
- Stale picked/started/stale-started work and disabled or unknown project assignments surface as warnings without mutating queue JSON.
- Row-level `Details` actions trigger a side-sheet exposing task name, execution path, worktree path, plan path, handoff path, active handoff path, review path, runner/session IDs, submitted/reviewed/approved timestamps, lease timing, explicit last error state, and history log.
- Row-level `Start` actions launch only that task's next eligible step without starting the global automation loop: implementation for `queued`/`reviewed-fix-request`, review for `submitted`, and disabled tooltip copy for active, waiting, landing, blocked, stale, approved, disabled-project, or capacity-full states.
- Queue-backed thread rows and queue details prefer `threadTitle` for the human-readable title. Older queue items can still use `threadName` or `taskName`, and missing titles are displayed from a cleaned slug with date prefixes and hyphens removed.
- Queue detail sheets expose recommended runner, recommended model, and model recommendation reason.
- Queue items with a durable `waitingReason` show a compact Waiting badge, appear in queue warnings, and expose the full waiting reason in the detail sheet.
- Queue detail sheets expose dependency metadata through `dependsOn` and `blockedBy` rows so sequencing waits can be inspected without opening queue JSON.
- Queue table wrappers, empty states, detail metadata, last-error display, and history separation use shadcn Card, Empty, Alert, and Separator composition.
- Relies on the `list_queue` backend endpoint mapped to frontend `listQueue()`.
- Uses `list_projects` to annotate disabled/ineligible project warnings.
- Provides loading, empty data, and visible queue-fetch error states.
- The shared queue status contract and Tauri mutation validator include stale-started, reviewing, and landing so filters and review/landing state are first-class.
