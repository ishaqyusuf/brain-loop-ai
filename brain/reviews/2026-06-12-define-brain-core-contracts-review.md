# Brain Handoff Review: Define Brain Core Contracts

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-define-brain-core-contracts-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-define-brain-core-contracts.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Source Plan
brain/plans/2026-06-12-feature-brain-core-contracts.md

## Result
Needs Fix

## Findings
- [P1] Queue item contracts are not compatible with existing global Brain queue files. `packages/brain-core/src/types.ts:54` requires every history entry to have `status` and `note`, but existing queue histories also use event/detail-shaped entries without those fields, for example `/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-gnd-pending-01-inventory-to-dyke-fix-1.json:29` and `/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-school-clerk-empty-report-spreadsheet-print.json:33`. The same contract also requires `executionPath: string` at `packages/brain-core/src/types.ts:66`, while an existing approved queue item has `executionPath: null` at `/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-gnd-pending-01-inventory-to-dyke-fix-1.json:26`. This fails the handoff acceptance criterion that contracts remain compatible with global Brain queue files.

## Acceptance Criteria Check
- Shared contracts cover settings, projects, queue items, histories, statuses, agents, priorities, locks, and logs: Pass
- Desktop code can import contracts from `@brain-loop/brain-core`: Pass
- Contract docs match the implemented shape and remain compatible with global Brain queue files: Fail

## Checks
- `bun --filter @brain-loop/brain-core typecheck`: Pass
- `bun run typecheck`: Pass

## Brain Update Check
- `brain/api/contracts.md` updated with finalized JSON contract summary: Present
- `brain/progress.md` updated after implementation: Present
- `brain/tasks/in-progress.md` keeps task in progress: Present

## Decision
The implementation is structurally close and the required typechecks pass, but the shared queue item shape is too strict for the real durable queue files already used by the Brain loop. A fix handoff was created to make the contract tolerant/accurate for legacy and current queue records, then document that compatibility.

## Follow-Up
brain/handoffs/fixes/2026-06-12-define-brain-core-contracts-fix-1.md
