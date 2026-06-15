# Brain Handoff Review: Add Background Scheduler Controls

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-add-background-scheduler-controls-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Result
Needs Fix

## Findings
- [P1] The visible app controls are not wired to scheduler commands. apps/desktop/src/app.tsx lines 34-37 render Pause and Run Once buttons with no onClick handlers, and there is no Start control. This fails the acceptance criterion that users can start and pause automation from the app.
- [P1] The tray Run Once menu does not run an implementation or review tick. apps/desktop/src-tauri/src/lib.rs lines 473-476 only start the scheduler and record an in-memory tick, bypassing run_implementation_once/run_review_once, capacity checks, project eligibility, and durable decision logging.
- [P1] Paused automation does not actually block manual tick commands. run_implementation_once and run_review_once only reject the stopped state at lines 395-423, so paused state can still fire ticks even though the feature doc says paused suspends ticks.
- [P1] Disabled projects are not skipped because no scheduler path reads projects.json or filters enabled projects. scheduler.rs counts active queue items and reads maxRunningProcesses, but it never checks project eligibility before a tick decision.
- [P2] Scheduler decisions are not durably visible in logs or run history. scheduler.rs stores tick counters and last_error in memory, but it does not append log entries or queue history for decisions/skipped ticks; the state is lost on restart.
- [P2] Brain docs are incomplete/inaccurate. The handoff required brain/api/endpoints.md and brain/api/contracts.md updates; endpoints lists command names but not implemented status/stop/get status, contracts does not document SchedulerStatus or scheduler commands, and brain/features/background-scheduler.md says running ticks fire at configured intervals even though no interval loop exists.

## Acceptance Criteria Check
- Users can start and pause automation from the app: Fail
- Scheduler ticks do not exceed configured process limits: Partial; run_implementation_once checks active count, but tray Run Once bypasses it and no actual dispatch occurs.
- Disabled projects are skipped: Fail
- Scheduler decisions are visible in logs or run history: Fail

## Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck: Pass
- cargo check from apps/desktop/src-tauri: Not run; cargo command is not installed on this machine.
- Manual scheduler code review: Fail

## Brain Update Check
- brain/progress.md: Present
- brain/features/background-scheduler.md: Present but inaccurate about interval behavior
- brain/api/endpoints.md: Present but incomplete
- brain/api/contracts.md: Missing scheduler command/status contract
- brain/tasks/in-progress.md: Present; task remains in progress

## Decision
The code adds useful scheduler primitives, but the user-facing controls and scheduler decision semantics do not yet meet the handoff. A focused fix handoff was created.

## Follow-Up
- brain/handoffs/fixes/2026-06-12-add-background-scheduler-controls-fix-1.md
