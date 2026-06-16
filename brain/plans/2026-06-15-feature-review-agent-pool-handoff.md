# Plan: Add Review Agent Pool And Direct Review Handoff

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
- Intake Item: Review has its own maximum review agent count; completed implementation calls review directly if capacity exists, otherwise waits.

## Goal Or Problem
Review should no longer be only a separate manual or interval-driven tick. When an implementation task finishes, Brain Loop should request review directly. If a review agent slot is available, review starts immediately; if the review pool is full, the task waits for review capacity.

## Current Context
`brain/features/automation-runs.md` documents manual review dispatch through `run_review_once`, which selects `submitted` items only. `brain/features/background-scheduler.md` documents review tick behavior but not a separate review capacity pool. The user now wants separate max review agents and direct implementation-to-review flow.

## Proposed Approach
Add review pool settings and dispatch behavior parallel to implementation capacity. Implementation completion should transition the queue item to a review-ready state and enqueue or trigger review. Review dispatch should reuse the implementation thread/worktree context and respect `maxReviewAgents`.

## Implementation Steps
- Define a review capacity setting, with TODO final name such as `maxReviewAgents`.
- Extend scheduler status and UI data to include review active count, review maximum, and review waiting count.
- On successful implementation completion, transition or confirm the queue item is `submitted` with review-ready metadata.
- Trigger review dispatch immediately after implementation completion when review capacity is available.
- If review capacity is full, persist a waiting reason and let the capacity loop start review later.
- Ensure review dispatch only selects `submitted` items and does not treat `reviewed-fix-request` as review-eligible.
- Ensure review runner receives the same project, thread, queue item, and worktree context as the implementation run.
- Log direct-review attempts, capacity waits, starts, failures, and completions.
- Update approval/permission handling so review requests that need approval stay linked to the same thread.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src/scheduler.rs`
- `apps/desktop/src-tauri/src/runner.rs`
- `apps/desktop/src-tauri/src/brain.rs`
- `apps/desktop/src-tauri/src/approval.rs`
- `packages/brain-core/src/types.ts`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/settings/settings-page.tsx`
- `brain/features/automation-runs.md`
- `brain/features/background-scheduler.md`
- `brain/features/approval-broker.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`

## Acceptance Criteria
- Review capacity is configured separately from implementation capacity.
- No more than the configured number of review agents can run at once.
- Successful implementation completion requests review without requiring a manual review button.
- If review capacity is available, review starts promptly after implementation completion.
- If review capacity is full, the queue item remains review-ready with a clear waiting reason.
- Review uses the same task thread/worktree context as implementation.

## Test Plan
- Rust unit/table tests for review capacity evaluation.
- `cargo check` from `apps/desktop/src-tauri` when Rust/Cargo is available.
- `bun --filter @brain-loop/desktop typecheck`
- Manual smoke test with max review agents set to 1 and multiple submitted items.
- Manual smoke test where implementation completes while review capacity is full, then starts when a slot opens.

## Brain Update Requirements
- Update `brain/features/automation-runs.md`.
- Update `brain/features/background-scheduler.md`.
- Update `brain/features/approval-broker.md` if approval-thread linking changes.
- Update `brain/api/contracts.md`.
- Update `brain/api/endpoints.md`.
- Update `brain/progress.md`.

## Implementation Progress

- Added optional `maxReviewAgents` to the shared TypeScript Settings contract and default settings.
- Added optional `maxReviewAgents` to Rust settings parsing with a safe default of `1`.
- Expanded `SchedulerStatus` with review active/max/waiting counts.
- Updated queue capacity scanning so active review work counts `reviewing` items and waiting review work counts `submitted` items.
- Updated `run_review_once` to skip when `maxReviewAgents` is reached.
- Review ticks now fill open review slots by preparing/reusing the queue-linked worktree context, transitioning submitted items to `reviewing`, assigning `reviewRunnerId`, and launching Codex review through the auditable process runner.
- Spawn failures and non-zero review runner exits block active queue items with durable error details.
- Successful implementation runner exits now submit still-started queue items and immediately ask the review pool to fill if automation is running and review capacity is available.
- Review capacity waits now persist `waitingReason` and `review_capacity_waiting` history on enabled submitted queue items that cannot launch because `maxReviewAgents` is full; durable agent thread records mirror `waitingReason`, and opened threads show the wait alert.
- Successful review runner exits that leave the queue item in `reviewing` now block the item immediately with `review_runner_missing_result` instead of waiting for stale reconciliation; runner-driven queue mutations refresh the durable thread record.
- Queue-linked approval requests and resolutions now refresh the same durable thread metadata with linked approval ids and pending approval counts, so review approvals stay tied to the task thread.
- Review result transitions to `reviewed-fix-request` or `landing` now stamp `reviewedAt`, and queue detail sheets show submitted/reviewed/approved timestamps for landing/result telemetry.
- Added `bun --filter @brain-loop/desktop scheduler:qa` coverage for separate review pool dispatch and direct implementation-to-review handoff invariants.
- Richer landing artifact handling remains a future follow-up after the review skill contract defines additional fields.

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
- Review must not start from stale or partially written implementation output.
- Queue state transitions need to remain compatible with existing Brain skills.
- Direct review dispatch must avoid duplicate reviews if the app restarts after implementation completion.

## Open Questions
- None for v1. The review capacity setting is `maxReviewAgents`; review starts from both implementation completion and the running local triage loop.

## Linked Task
- Task Title: Add Review Agent Pool And Direct Review Handoff
- Task File: brain/tasks/roadmap.md
