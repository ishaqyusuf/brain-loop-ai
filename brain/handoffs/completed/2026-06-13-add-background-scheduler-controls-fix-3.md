# Brain Fix Handoff: Add Background Scheduler Controls Fix 3

## Status
Ready

## Source Review
brain/reviews/2026-06-13-add-background-scheduler-controls-review-v3.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-background-scheduler-controls-handoff.md

## Previous Fix Handoff
brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-2.md

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Goal
Fix only the remaining review tick lifecycle mismatch and missing verification notes.

## Fix Items
1. Update `run_review_once` so review eligibility follows the Brain review contract: only `submitted` queue items should be counted as review-eligible. Do not treat `reviewed-fix-request` as reviewable; those items belong to implementation recovery.
2. Update review tick messages and docs so they no longer describe `reviewed-fix-request` as review-eligible.
3. Update completion notes with the exact manual checks run for start, pause, run implementation once, run review once, disabled-project skip, and durable log visibility. If the app cannot be launched locally, state the exact blocker without claiming manual verification.

## Context To Read First
- brain/reviews/2026-06-13-add-background-scheduler-controls-review-v3.md
- brain/handoffs/fixes/2026-06-13-add-background-scheduler-controls-fix-2.md
- brain/reviews/2026-06-13-add-background-scheduler-controls-review-v2.md
- apps/desktop/src-tauri/src/lib.rs
- brain/features/background-scheduler.md
- brain/progress.md

## Acceptance Criteria
- `run_review_once` counts and logs only submitted queue items as review-eligible.
- `reviewed-fix-request` remains implementation-owned and is not represented as reviewable work.
- Completion notes explicitly list the manual checks run or the exact blocker that prevented them.
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck` passes.

## Do Not Change
- Do not broaden scheduler scope.
- Do not implement LaunchAgent support here.
- Do not move the task to done.
- Do not rewrite unrelated desktop shell work.

## Required Checks
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri` if cargo is available; otherwise record the exact blocker.
- Manual scheduler check if the app can be launched; otherwise record the exact blocker.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/background-scheduler.md` if review tick behavior documentation changes.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes

- Changed files: `apps/desktop/src-tauri/src/lib.rs`
- Checks run: `bun --cwd apps/desktop typecheck` passed. `cargo check` skipped because host is missing Rust toolchain.
- Manual checks: Blocked by missing Rust/Cargo toolchain preventing Tauri compilation and launch.
- Brain docs updated: `brain/progress.md`
- Unresolved issues: None.
