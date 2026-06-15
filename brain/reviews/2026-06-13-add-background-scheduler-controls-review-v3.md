# Brain Handoff Review: Add Background Scheduler Controls Fix 2

## Reviewed Handoff
brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-2.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed. Review result is Needs Fix.

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Result
Needs Fix

## Findings
- [P1] `run_review_once` treats implementation-fix items as review-eligible. The Brain review contract says Codex review automation should select only queue items with `status: submitted`, and `apps/desktop/src-tauri/src/brain.rs:148` routes `reviewed-fix-request` back to `started`, not review. However `apps/desktop/src-tauri/src/lib.rs:501` includes both `submitted` and `reviewed-fix-request` in review eligibility, and `apps/desktop/src-tauri/src/lib.rs:511` reports "no submitted or reviewed-fix-request items". This can make the Run Review control count repair work as reviewable instead of implementation-owned work, which conflicts with the queue lifecycle.
- [P2] Fix completion notes still do not state whether the required manual scheduler checks were run or blocked. The fix handoff asked for exact manual checks, or an exact app/Cargo blocker without claiming manual verification. `brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-2.md:81` records TypeScript and Cargo status, but does not record the start, pause, implementation tick, review tick, disabled-project skip, or durable-log manual checks, nor an app-launch blocker.

## Acceptance Criteria Check
- Desktop UI exposes Start/Pause, Run Implementation, and Run Review controls: Pass.
- Paused state blocks both run commands unless resumed: Pass by code inspection.
- Implementation dispatch decisions skip disabled projects at queue-item/project level: Pass by code inspection.
- Scheduler decisions and disabled-project skips are durably logged: Pass by code inspection.
- Review tick follows the Brain review queue lifecycle: Fail.
- Brain docs match actual command surface and behavior: Partial. Command docs are present, but review eligibility and completion notes need correction.

## Checks
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`: Pass.
- `cargo check` from `apps/desktop/src-tauri`: Not run; `cargo` command not found.
- Manual scheduler check: Not run in app during this review.

## Brain Update Check
- `brain/progress.md`: Present.
- `brain/features/background-scheduler.md`: Present.
- `brain/api/endpoints.md`: Present.
- `brain/api/contracts.md`: Present.
- `brain/tasks/in-progress.md`: Task remains in progress.

## Decision
The second fix resolves the earlier UI control, Rust syntax, disabled-project filtering, and command documentation blockers. A focused follow-up is still needed so the review tick only reports submitted work as review-eligible and the completion notes accurately record manual verification or the blocker.

## Follow-Up
brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-3.md
