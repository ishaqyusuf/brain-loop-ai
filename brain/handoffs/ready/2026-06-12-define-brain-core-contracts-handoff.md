# Brain Handoff: Define Brain Core Contracts

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-brain-core-contracts.md

## Task
- Task Title: Define Brain Core Contracts
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Shared TypeScript contracts and validation helpers are focused implementation work.

## Goal
Create shared TypeScript contracts for Brain project manager settings, projects, queue items, locks, logs, statuses, agents, and runner metadata.

## Context To Read First
- brain/plans/2026-06-12-feature-brain-core-contracts.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Model `settings.json`, `projects.json`, queue item files, queue history entries, runner status values, agents, priorities, locks, and log metadata.
2. Add parsing/normalization helpers for status, agent, priority, and filesystem paths.
3. Export the public API through `packages/brain-core/src/index.ts`.
4. Add package-level tests if a test runner exists; otherwise add type-level examples or narrow validation coverage.
5. Keep contracts compatible with `brain-handoff` queue item status and agent enums.

## Acceptance Criteria
- Shared contracts cover settings, projects, queue items, histories, statuses, agents, priorities, locks, and logs.
- Desktop code can import contracts from `@brain-loop/brain-core`.
- Contract docs match the implemented shape and remain compatible with global Brain queue files.

## Files Or Areas Likely Involved
- `packages/brain-core/src/index.ts`
- `packages/brain-core/package.json`
- `packages/brain-core/tsconfig.json`
- `brain/api/contracts.md`
- `brain/system/architecture.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun --filter @brain-loop/brain-core typecheck`
- `bun run typecheck`

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-define-brain-core-contracts.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/api/contracts.md` with the finalized JSON contract summary.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes

- Changed files:
  - `packages/brain-core/src/types.ts` (new): All shared TypeScript types for Settings, BrainProject, QueueItem, QueueHistoryEntry, LockFile, LogEntry, RunnerMetadata, RunResult, and status/agent/priority unions.
  - `packages/brain-core/src/constants.ts` (new): Valid status arrays, queue status transition map, path normalization constants, DEFAULT_SETTINGS.
  - `packages/brain-core/src/validation.ts` (new): Type guards, assertions, queue transition validation, path normalization, safe boolean/integer parsing.
  - `packages/brain-core/src/index.ts` (updated): Public API re-exports all types, constants, and validation helpers.
  - `packages/brain-core/package.json` (updated): Added `@types/node` devDependency.
- Checks run:
  - `bun --filter @brain-loop/brain-core typecheck`: passed
  - `bun run typecheck` (full repo, 3 packages): passed (brain-core, desktop-client, desktop)
- Brain docs updated:
  - `brain/api/contracts.md`: Replaced planned contracts with implemented contract summary table
  - `brain/progress.md`: Added implementation entry
- Unresolved issues: None
