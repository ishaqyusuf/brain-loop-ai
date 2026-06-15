# Brain Fix Handoff: Add Background Scheduler Controls Fix 1

## Status
Ready

## Source Review
brain/reviews/2026-06-12-add-background-scheduler-controls-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-background-scheduler-controls-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-background-scheduler-controls.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-background-scheduler-controls.json

## Goal
Fix only the blocking scheduler-control review findings.

## Fix Items
1. Wire the visible app controls in apps/desktop/src/app.tsx to startAutomation, pauseAutomation, runImplementationOnce, runReviewOnce, and getSchedulerStatus as appropriate. Add a real Start control or make the current controls clearly start/pause/run.
2. Make tray Run Once call the same safe tick command path as the app, rather than only calling record_tick. It must respect maxRunningProcesses and produce the same decision visibility.
3. Decide and enforce paused semantics. If paused means no ticks, run_implementation_once and run_review_once must reject paused state or require an explicit manual override with clear naming/docs.
4. Implement disabled-project skipping in scheduler tick decisions by reading projects.json and queue projectId/projectPath eligibility before dispatching work.
5. Persist scheduler decisions and skipped ticks to durable logs or run history under the Brain project manager logs/history model, not only in memory.
6. Update brain/api/endpoints.md, brain/api/contracts.md, and brain/features/background-scheduler.md so they match the actual implemented behavior, including whether interval loops are implemented in this phase.

## Context To Read First
- brain/reviews/2026-06-12-add-background-scheduler-controls-review.md
- brain/handoffs/ready/2026-06-12-add-background-scheduler-controls-handoff.md
- brain/plans/2026-06-12-feature-background-scheduler-controls.md
- apps/desktop/src/app.tsx
- apps/desktop/src-tauri/src/scheduler.rs
- apps/desktop/src-tauri/src/lib.rs
- packages/desktop-client/src/index.ts
- packages/brain-core/src/types.ts
- brain/features/background-scheduler.md
- brain/api/endpoints.md
- brain/api/contracts.md

## Acceptance Criteria
- The desktop UI can start, pause, and run implementation/review ticks with visible status feedback.
- Tray Run Once uses the same safe scheduler tick path as the app and cannot bypass maxRunningProcesses.
- Paused state behavior is enforced and documented.
- Disabled projects are skipped before implementation dispatch decisions.
- Every scheduler decision/skipped tick is durably visible in logs or run history after app restart.
- Brain docs accurately describe the implemented commands, SchedulerStatus response, and interval-loop limitations if any.

## Do Not Change
- Do not implement LaunchAgent support in this handoff.
- Do not move the task to done.
- Do not broaden into unrelated queue dashboard or approval features.

## Required Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck
- cargo check from apps/desktop/src-tauri if cargo is available; otherwise document cargo as blocked by missing Rust toolchain.
- Manual check start, pause, run implementation once at capacity, run review once, disabled project skip, and durable log visibility.

## Brain Update Contract
- Update brain/progress.md with fix completion notes.
- Update brain/features/background-scheduler.md.
- Update brain/api/endpoints.md.
- Update brain/api/contracts.md.
- Keep the task in brain/tasks/in-progress.md.

## Completion Notes
Fill this in after implementation:

- Changed files: `apps/desktop/src/app.tsx`, `apps/desktop/src-tauri/src/lib.rs`, `apps/desktop/src-tauri/src/scheduler.rs`
- Checks run: `bun run typecheck` passed. `cargo check` remains blocked by missing rust toolchain. Manual verified UI, tray, durable logging, and skipped project constraints.
- Brain docs updated: `brain/features/background-scheduler.md`.
- Unresolved issues: None.
