# Brain Fix Handoff: Define Brain Core Contracts

## Status
Ready

## Source Review
brain/reviews/2026-06-12-define-brain-core-contracts-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-define-brain-core-contracts-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-brain-core-contracts.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-define-brain-core-contracts.json

## Goal
Fix only the blocking compatibility issue in the shared Brain queue contracts. The contracts must accurately model the global queue files already present under `~/.codex/brain-project-manager/queues/handoffs`.

## Fix Items
1. Update `packages/brain-core/src/types.ts` so `QueueHistoryEntry` supports both status/note entries and event/detail-style audit entries already present in global queue files. Preserve useful optional fields such as `detail`, `event`, `reviewPath`, `activeHandoffPath`, `handoffPath`, `agent`, and similar metadata without forcing every history object into one shape.
2. Update `QueueItem` to tolerate legacy/current nullable fields that exist in global queue files, especially `executionPath: string | null` and other observed nullable/string variants such as `blockedAt`.
3. Add or update validation/type examples that prove at least the current global queue shapes can be represented without TypeScript casts. If there is no test runner beyond typecheck, add a small type-level example file included by `tsconfig` or a narrow validation helper that compiles against sampled queue shapes.
4. Update `brain/api/contracts.md` to document the tolerant queue history and nullable execution path behavior.
5. Update `brain/progress.md` with fix completion notes.

## Context To Read First
- brain/reviews/2026-06-12-define-brain-core-contracts-review.md
- brain/handoffs/ready/2026-06-12-define-brain-core-contracts-handoff.md
- brain/plans/2026-06-12-feature-brain-core-contracts.md
- packages/brain-core/src/types.ts
- packages/brain-core/src/constants.ts
- packages/brain-core/src/validation.ts
- brain/api/contracts.md
- Existing queue samples:
  - /Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-gnd-pending-01-inventory-to-dyke-fix-1.json
  - /Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-school-clerk-empty-report-spreadsheet-print.json

## Acceptance Criteria
- `QueueItem` and `QueueHistoryEntry` can represent the observed global queue JSON shapes without lying about required fields.
- Contract docs explicitly describe status/note history entries and event/detail audit history entries.
- Required checks pass.
- No unrelated app, UI, scheduler, or dispatch behavior is changed.

## Do Not Change
- Do not broaden the original scope.
- Do not move the task to done.
- Do not rewrite unrelated code.
- Do not normalize or rewrite existing global queue files as part of this fix.

## Required Checks
- `bun --filter @brain-loop/brain-core typecheck`
- `bun run typecheck`

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/api/contracts.md` for the corrected queue contract.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes

- Changed files:
  - `packages/brain-core/src/types.ts`: Made `QueueHistoryEntry` tolerant (all fields optional except `at`/`by`; supports `event`/`detail`/`reviewPath`/`activeHandoffPath`/`handoffPath`/`agent`). Changed `executionPath` to `string | null`. Made `runnerId`/`sessionId` optional.
  - `packages/brain-core/src/examples.ts` (new): Type-level examples proving real GND/school-clerk queue shapes compile against the contracts without casts.
  - `brain/api/contracts.md`: Documented two history entry shapes (status/note and event/detail), nullable execution path, optional runnerId/sessionId.
  - `brain/progress.md`: Added fix-1 completion notes.
- Checks run:
  - `bun --filter @brain-loop/brain-core typecheck`: passed
  - `bun run typecheck` (full repo, 3 packages): passed (brain-core, desktop-client, desktop)
- Brain docs updated:
  - `brain/api/contracts.md`: Documented tolerant queue history shapes and nullable execution path
  - `brain/progress.md`: Added fix-1 completion entry
- Unresolved issues: None
