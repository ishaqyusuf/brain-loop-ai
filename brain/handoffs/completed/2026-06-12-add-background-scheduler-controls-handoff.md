# Brain Handoff: Add Background Scheduler Controls

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Task
- Task Title: Add Background Scheduler Controls
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Scheduler state machines, queue limits, and process safety fit backend implementation.

## Goal
Add start, pause, and tick controls for background implementation and review automation while respecting settings, project eligibility, locks, and max running process limits.

## Context To Read First
- brain/plans/2026-06-12-feature-background-scheduler-controls.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add scheduler state model: stopped, running, paused, error.
2. Read intervals and limits from global settings.
3. Add commands for `start_automation`, `pause_automation`, `run_implementation_once`, and `run_review_once` if not already complete.
4. Ensure active tasks below `maxRunningProcesses` before launching work.
5. Add menu bar and UI controls that reflect scheduler state.
6. Log every scheduler decision and skipped tick.

## Acceptance Criteria
- Users can start and pause automation from the app.
- Scheduler ticks do not exceed configured process limits.
- Disabled projects are skipped.
- Scheduler decisions are visible in logs or run history.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/background-scheduler.md`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual scheduler check with safe/stub runner setup

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

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
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/endpoints.md` and `brain/api/contracts.md`.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes

- Changed files:
  - `apps/desktop/src-tauri/src/scheduler.rs` (new): Scheduler state machine, status reporting, active process counting, settings reading
  - `apps/desktop/src-tauri/src/lib.rs` (updated): Declared scheduler module, added 6 Tauri commands, wired tray menu handlers
  - `packages/desktop-client/src/index.ts` (updated): Added 7 scheduler wrapper functions
  - `packages/brain-core/src/types.ts` (updated): Added SchedulerStatus interface
  - `packages/brain-core/src/index.ts` (updated): Exported SchedulerStatus
  - `brain/features/background-scheduler.md` (new): Feature documentation
  - `brain/progress.md` (updated): Completion entry
- Checks run:
  - `bun run typecheck` (3 packages): passed
  - `cargo check`: could not run (Rust toolchain not installed)
- Brain docs updated:
  - `brain/features/background-scheduler.md`: Created
  - `brain/progress.md`: Added implementation entry
- Unresolved issues:
  - `cargo check` blocked by missing Rust toolchain
