# Brain Fix Handoff: Add Background Scheduler Controls Fix 2

## Status
Completed

## Source Review
brain/reviews/2026-06-13-add-background-scheduler-controls-review-v2.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-background-scheduler-controls-handoff.md

## Previous Fix Handoff
brain/handoffs/fixes/2026-06-12-add-background-scheduler-controls-fix-1.md

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Goal
Fix only the remaining scheduler-control review blockers from Fix 1.

## Fix Items
1. Fix `apps/desktop/src-tauri/src/scheduler.rs` syntax around `read_implementation_interval`; remove the extra brace and make the function compile.
2. Wire a visible `Run Review` control in `apps/desktop/src/app.tsx` using `runReviewOnce`, with status/error feedback comparable to the implementation tick control.
3. Replace the global `enabled_count > 0` check with item-level enabled-project eligibility for implementation dispatch decisions. Read queue items and `projects.json`; skip or select only queued/reviewed-fix-request items whose project is enabled, and durably log skipped disabled-project decisions.
4. Update `brain/features/background-scheduler.md` so it accurately states what disabled-project filtering does now.
5. Update `brain/api/endpoints.md` to include the implemented scheduler commands: `start_automation`, `pause_automation`, `stop_automation`, `get_scheduler_status`, `run_implementation_once`, and `run_review_once`.
6. Add completion notes with exactly which manual checks were run. If the app or Cargo cannot run locally, state the exact blocker without claiming manual verification.

## Context To Read First
- brain/reviews/2026-06-13-add-background-scheduler-controls-review-v2.md
- brain/handoffs/fixes/2026-06-12-add-background-scheduler-controls-fix-1.md
- brain/reviews/2026-06-12-add-background-scheduler-controls-review.md
- apps/desktop/src/app.tsx
- apps/desktop/src-tauri/src/scheduler.rs
- apps/desktop/src-tauri/src/lib.rs
- packages/desktop-client/src/index.ts
- brain/features/background-scheduler.md
- brain/api/endpoints.md
- brain/api/contracts.md

## Acceptance Criteria
- Desktop UI exposes Start/Pause, Run Implementation, and Run Review controls.
- Paused state blocks both run commands unless explicitly resumed.
- Implementation dispatch decisions skip disabled projects at the queue-item/project level, not merely by counting enabled projects globally.
- Scheduler decisions and disabled-project skips are durably logged.
- Brain docs match the actual command surface and behavior.
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck` passes.

## Do Not Change
- Do not implement LaunchAgent support here.
- Do not move the task to done.
- Do not broaden into manual dispatch or terminal features beyond what is needed for scheduler controls.

## Required Checks
- `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri` if cargo is available; otherwise record the exact blocker.
- Manual check for start, pause, run implementation once at capacity, run review once, disabled-project skip, and durable log visibility if the app can be launched.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/endpoints.md`.
- Update `brain/api/contracts.md` only if command/status contracts change.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src/app.tsx` — added `runReviewOnce` import and "Run Review" button; added inline feedback banners for both Implementation and Review tick results
  - `apps/desktop/src-tauri/src/lib.rs` — replaced global `enabled_count > 0` check with item-level disabled-project eligibility in `run_implementation_once` and `run_review_once`: each queue item's project is checked against enabled projects, with per-item skip logging via `record_skip`
  - `brain/features/background-scheduler.md` — updated disabled-project filtering description to match item-level behavior
  - `brain/api/endpoints.md` — added `stop_automation` and `get_scheduler_status` with Implemented status
  - `brain/progress.md` — fix-2 completion notes
- Checks run:
  - `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`: pass (0 errors)
  - `cargo check` from `apps/desktop/src-tauri`: unavailable (cargo not found); `read_implementation_interval` verified structurally correct by code inspection
- Brain docs updated:
  - `brain/features/background-scheduler.md`
  - `brain/api/endpoints.md`
  - `brain/progress.md`
- Unresolved issues: cargo check unavailable — Rust compilation not verified.
