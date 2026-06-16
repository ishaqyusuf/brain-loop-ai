# Plan: Add MaxLoop Concurrency Policy Settings

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: MaxLoop global, per runner, per project, and per runner per project

## Goal Or Problem
Give users precise control over how many automation threads may run globally, per runner, per project, and per runner/project combination.

## Current Context
Current settings include legacy `maxRunningProcesses`, capacity-specific implementation/review agent caps, and a first persisted MaxLoop policy. User wants richer MaxLoop behavior: global hard cap, runner-specific cap, project-specific cap, and runner-per-project overrides.

## Proposed Approach
Define a hierarchical concurrency policy where specific overrides win over general defaults, then add settings UI and scheduler enforcement.

## Implementation Steps
- Define MaxLoop settings schema with scopes: global, runner, project, runnerProject. (Started: `maxLoopPolicy` is now in the shared settings contract.)
- Document precedence rules and disabled/zero semantics. (Started: caps must be positive; global remains the hard ceiling; runner/project/runner-project caps are enforced when configured.)
- Update scheduler selection logic to respect every active cap. (Started for implementation dispatch.)
- Add settings UI for global defaults and per-project overrides. (Started in Settings > Automation.)
- Add queue/dashboard indicators when tasks are waiting on concurrency. (Started with durable `waitingReason` and Queue warning/detail display.)

## Affected Files Or Areas
- `brain/features/background-scheduler.md`
- `brain/features/queue-dashboard.md`
- `brain/api/contracts.md`
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- MaxLoop policy supports global, runner, project, and runner-project scopes. (Implemented for implementation agents.)
- Scheduler cannot exceed the most specific active cap. (Implemented as global hard ceiling plus runner/project/runner-project active cap checks.)
- UI explains why a task is waiting when concurrency blocks it. (Implemented through queue `waitingReason`, warning badge, and queue detail metadata.)
- Per-project overrides can differ from global defaults. (Implemented in persisted settings and Settings > Automation controls.)

## Current Implementation Notes

- `settings.maxLoopPolicy.globalMax` is the implementation-agent hard ceiling and is also reflected in scheduler capacity status when lower than `maxImplementationAgents`.
- `runnerCaps`, `projectCaps`, and `runnerProjectCaps` are enforced during implementation dispatch. Each active cap can block a candidate item; blocked candidates receive a durable `waitingReason` and `maxloop_waiting` history event.
- The dispatcher continues scanning eligible items after a policy skip, so a task blocked by one runner/project cap does not prevent a later eligible task from launching if it fits the remaining active caps.
- Review concurrency remains governed by `maxReviewAgents`; MaxLoop policy currently applies to implementation agents.
- Cargo-based Rust tests remain blocked until the host has a Rust toolchain.
- Added `bun --filter @brain-loop/desktop scheduler:qa` coverage for MaxLoop/capacity dispatch invariants that can be verified without Cargo.

## Test Plan
- Rust unit tests or table tests for concurrency policy evaluation.
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`

## Brain Update Requirements
- Update scheduler, queue dashboard, and contracts docs.
- Update `brain/progress.md`.

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
- Conflicting caps can confuse users unless blocked reasons are explicit.
- Global cap should always remain the final upper bound.

## Open Questions
- None

## Linked Task
- Task Title: Add MaxLoop Concurrency Policy Settings
- Task File: brain/tasks/roadmap.md
