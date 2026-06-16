# ADR: Add Queue Dependency And Scheduling Policy Contract

## Status
Accepted

## Context
Brain Loop queue items need to support ordered work where one task must wait for another task to finish. The scheduler also needs a user-configurable selection policy so reviewed fix requests can either jump ahead of new queued work or all implementation work can run FIFO.

## Decision
Queue items may carry:

- `dependsOn`: queue item ids that must be approved before this item can launch.
- `blockedBy`: queue item ids currently preventing launch.
- `waitingReason`: a user-facing explanation for why the item stayed queued.

Settings may carry:

- `schedulingPolicy`: `fix-before-new-task` or `fifo`.

Implementation dispatch will:

- Treat `approved` dependency items as satisfied.
- Keep dependency-waiting items in their current status.
- Record `waitingReason`, `blockedBy`, and a `dependency_waiting` history event when dependencies are missing, blocked, not approved, or cyclic.
- Sort eligible implementation candidates according to `schedulingPolicy` before dependency and MaxLoop checks.

## Rationale
- Keeping dependency waits as metadata avoids adding another queue status to the global Brain handoff contract.
- `waitingReason` gives the UI and audit history enough information to explain why work is not launching.
- `dependsOn` and `blockedBy` are simple JSON fields that older queue readers can ignore.

## Consequences
- Queue producers can start writing `dependsOn` without requiring a new queue status.
- Schedulers must avoid launching dependency-waiting tasks even if capacity is available.
- Cycles are visible as wait reasons rather than silently causing starvation.
- Completion semantics are intentionally strict: a dependency is satisfied only after the dependency item reaches `approved`.

## Related
- `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md`
- `brain/features/background-scheduler.md`
- `brain/features/queue-dashboard.md`
- `brain/api/contracts.md`

## Date
2026-06-15
