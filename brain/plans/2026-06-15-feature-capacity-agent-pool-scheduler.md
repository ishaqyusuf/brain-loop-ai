# Plan: Add Capacity-Based Agent Pool Scheduler

## Type
Feature

## Status
Done

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Intake Item: Replace cron-style implementation/review intervals with capacity-based queue checking and maximum implementation agent slots.

## Goal Or Problem
Brain Loop should stop behaving like a cron surface where implementation runs every X minutes. Instead, while automation is running, it should keep checking for eligible queue tasks and start implementation work whenever an implementation agent slot is available.

## Current Context
`brain/features/background-scheduler.md` documents a scheduler that reads capacity settings from `~/.brain-loop/settings.toml`. `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md` proposes richer MaxLoop policy. This pivot makes the immediate execution model capacity-first: if maximum implementation agents is 5, Brain Loop can run up to 5 implementation agents and should keep filling open slots from eligible queue items.

## Proposed Approach
Add an implementation agent pool scheduler with explicit capacity settings, active slot accounting, queue polling, and dispatch gating. Keep the first version focused on global implementation capacity, enabled projects, supported queue statuses, locks, and durable audit logs. Leave per-runner/per-project MaxLoop overrides to the existing MaxLoop plan unless explicitly folded in later.

## Implementation Steps
- Define settings fields for implementation agent capacity, with TODO final names such as `maxImplementationAgents`.
- Update shared TypeScript and Rust settings contracts to tolerate the new fields while preserving existing `maxRunningProcesses` compatibility during migration.
- Refactor scheduler internals from one-shot manual tick semantics toward a loop that checks queue state while automation is running.
- Select eligible implementation queue items from `queued` and `reviewed-fix-request`, respecting enabled project filters and supported queue transitions.
- Count active implementation agents from durable run/thread metadata, not only volatile React state.
- Before launching a runner, acquire or verify the appropriate Brain lock and capacity slot.
- Start as many eligible implementation tasks as open capacity allows, without exceeding the configured maximum.
- Log every dispatch, skip, capacity block, missing project, disabled project, lock conflict, and runner failure to durable logs.
- Update UI status summaries to show implementation capacity, active count, and waiting count.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src/scheduler.rs`
- `apps/desktop/src-tauri/src/runner.rs`
- `apps/desktop/src-tauri/src/brain.rs`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/brain-core/src/types.ts`
- `packages/brain-core/src/constants.ts`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/settings/settings-page.tsx`
- `brain/features/background-scheduler.md`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`

## Acceptance Criteria
- Automation can run continuously without the user pressing `Run Implementation` for each task.
- With maximum implementation agents set to 5, no more than 5 implementation agents run at once.
- When fewer than the maximum agents are active and eligible queue work exists, Brain Loop starts additional implementation work until capacity is filled or no eligible work remains.
- Capacity-blocked queue items have an observable waiting reason in logs or UI state.
- Disabled projects, unsupported statuses, lock conflicts, and runner errors are skipped or blocked with durable audit entries.
- Existing settings files without the new capacity field continue to load with a safe default.

## Test Plan
- Rust unit/table tests for capacity evaluation and eligible queue selection.
- `cargo check` from `apps/desktop/src-tauri` when Rust/Cargo is available.
- `bun --filter @brain-loop/desktop typecheck`
- Manual smoke test with max implementation agents set to 1 and multiple queued items.
- Manual smoke test with max implementation agents set to 5 and more than 5 queued items.

## Brain Update Requirements
- Update `brain/features/background-scheduler.md`.
- Update `brain/features/automation-runs.md`.
- Update `brain/api/contracts.md`.
- Update `brain/api/endpoints.md`.
- Update `brain/progress.md`.

## Implementation Progress

- Added optional `maxImplementationAgents` to the shared TypeScript Settings contract and default settings.
- Added optional `maxImplementationAgents` to Rust settings parsing while preserving `maxRunningProcesses` as a backward-compatible fallback.
- Expanded `SchedulerStatus` with implementation active/max/waiting counts.
- Updated scheduler queue scanning so implementation capacity state counts active `picked`/`started` items and waiting `queued`/`reviewed-fix-request` items. `stale-started` remains visible for recovery but no longer consumes an implementation slot.
- Implementation ticks now fill open implementation slots by preparing task worktrees, transitioning enabled eligible items through `picked` to `started`, assigning `runnerId`, and launching the selected provider through the auditable process runner.
- Provider launch defaults are wired for `open-code`/`opencode`, `antigravity`/`agy`, and `codex` fallback. Spawn failures and non-zero runner exits block active queue items with durable error details.
- Starting automation now starts a background capacity loop that repeatedly attempts implementation and review dispatch while scheduler state remains `running`; pausing suppresses dispatch without dropping the loop, and stopping exits it.
- Added `capacityPollIntervalSeconds` to configure the running capacity loop cadence. The value defaults to `5`, is bounded to 1-60 seconds, is editable in Settings > Automation, and replaces the previous hidden 5-second sleep.
- Added stale active-run reconciliation before dispatch capacity is measured: stale `picked` items return to `queued`; stale `started` items recover from run metadata to `submitted`/`blocked` or move to `stale-started`; stale review runs are blocked when they exceed the configured threshold without leaving `reviewing`.
- Added `bun --filter @brain-loop/desktop scheduler:qa` as a repeatable source-level contract gate for capacity loop, triage, implementation pool dispatch, review pool dispatch, direct review handoff, worktree-backed thread context, and main-checkout warning invariants.
- Event-driven file watching beyond the configured poll cadence remains a future optimization; v1 uses `capacityPollIntervalSeconds`.
- Cargo validation remains host-blocked when Rust tooling is unavailable.

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
- Capacity accounting must survive app reloads and runner crashes.
- The scheduler must avoid double-starting the same queue item across rapid polling cycles.
- Backward compatibility with `maxRunningProcesses` needs a clear migration path.

## Open Questions
- None for v1. The implementation capacity setting is `maxImplementationAgents`, and idle work uses configurable polling via `capacityPollIntervalSeconds`.

## Linked Task
- Task Title: Add Capacity-Based Agent Pool Scheduler
- Task File: brain/tasks/roadmap.md
