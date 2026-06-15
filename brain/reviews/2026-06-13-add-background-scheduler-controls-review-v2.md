# Brain Handoff Review: Add Background Scheduler Controls Fix 1

## Reviewed Handoff
brain/handoffs/fixes/2026-06-12-add-background-scheduler-controls-fix-1.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed; implementation ran in the registered project checkout.

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Result
Needs Fix

## Findings
- [P1] The Rust scheduler module appears not to compile. `apps/desktop/src-tauri/src/scheduler.rs:174-190` has an extra closing brace in `read_implementation_interval`, which would leave `2` outside the function body. `cargo check` is unavailable locally, but this should be fixed before approval because the submitted Rust path is syntactically suspect.
- [P1] The visible app controls still do not expose review ticks. `apps/desktop/src/app.tsx:2` does not import `runReviewOnce`, and lines 46-54 only render Start/Pause plus Run Implementation. The fix handoff required wiring `runReviewOnce` as appropriate and the acceptance criteria include implementation and review ticks with visible status feedback.
- [P1] Disabled-project handling is still not tied to dispatch eligibility. `apps/desktop/src-tauri/src/lib.rs:414-423` only checks that at least one project is enabled, then records an implementation tick. It does not inspect queued/reviewed-fix-request work and skip items whose `projectId`/`projectPath` belongs to a disabled project before a dispatch decision.
- [P2] Brain docs overstate the implementation. `brain/features/background-scheduler.md` says the Rust module uses `list_projects()` to filter enabled projects before dispatching work, but the code only counts enabled projects globally. `brain/api/endpoints.md` still omits `stop_automation` and `get_scheduler_status` in the Automation Control group.
- [P2] Required manual verification is not evidenced beyond the completion note. The handoff asked for manual checks of start, pause, implementation once at capacity, review once, disabled-project skip, and durable log visibility; the current code still lacks a review UI control and item-level disabled-project skip to manually validate.

## Acceptance Criteria Check
- The desktop UI can start, pause, and run implementation/review ticks with visible status feedback: Fail
- Tray Run Once uses the same safe scheduler tick path as the app and cannot bypass maxRunningProcesses: Pass for implementation tick path, pending Cargo validation.
- Paused state behavior is enforced and documented: Pass by code inspection.
- Disabled projects are skipped before implementation dispatch decisions: Fail
- Every scheduler decision/skipped tick is durably visible in logs or run history after app restart: Partial; `scheduler.log` exists, but compile validation is blocked.
- Brain docs accurately describe implemented commands and interval-loop limitations: Partial/Fail

## Checks
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`: Pass
- `cargo check` from `apps/desktop/src-tauri`: Not run; `cargo` command not found.
- Manual scheduler check: Not run in app; reviewed code paths only.

## Brain Update Check
- `brain/progress.md`: Present
- `brain/features/background-scheduler.md`: Present but inaccurate about disabled-project filtering.
- `brain/api/endpoints.md`: Present but incomplete for scheduler commands.
- `brain/api/contracts.md`: Present.
- `brain/tasks/in-progress.md`: Task remains in progress.

## Decision
The fix improved app start/pause wiring, paused-state enforcement, tray Run Once, and durable scheduler logging. It still misses review tick UI, item-level disabled-project eligibility, accurate docs, and likely Rust syntax correctness. A second focused fix handoff was created.

## Follow-Up
brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-2.md
