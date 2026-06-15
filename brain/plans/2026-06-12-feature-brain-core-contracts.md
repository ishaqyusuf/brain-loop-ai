# Plan: Define Brain Core Contracts

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 5-10%

## Goal Or Problem
Create shared TypeScript contracts for Brain project manager settings, projects, queue items, locks, logs, statuses, agents, and runner metadata.

## Current Context
`packages/brain-core` exists but needs durable schema coverage before React, Rust command responses, and queue logic can safely share data shapes.

## Proposed Approach
Define exported types, constants, and validation helpers in `packages/brain-core` that mirror the Brain project manager JSON contract used by existing skills.

## Implementation Steps
- Model `settings.json`, `projects.json`, queue item files, queue history entries, runner status values, agents, priorities, locks, and log metadata.
- Add parsing/normalization helpers for status, agent, priority, and filesystem paths.
- Export the public API through `packages/brain-core/src/index.ts`.
- Add package-level tests if a test runner exists; otherwise add type-level examples or narrow validation coverage.
- Keep contracts compatible with `brain-handoff` queue item status and agent enums.

## Affected Files Or Areas
- `packages/brain-core/src/index.ts`
- `packages/brain-core/package.json`
- `packages/brain-core/tsconfig.json`
- `brain/api/contracts.md`
- `brain/system/architecture.md`

## Acceptance Criteria
- Shared contracts cover settings, projects, queue items, histories, statuses, agents, priorities, locks, and logs.
- Desktop code can import contracts from `@brain-loop/brain-core`.
- Contract docs match the implemented shape and remain compatible with global Brain queue files.

## Test Plan
- `bun --filter @brain-loop/brain-core typecheck`
- `bun run typecheck`

## Brain Update Requirements
- Update `brain/api/contracts.md` with the finalized JSON contract summary.
- Update `brain/progress.md` after implementation.

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
- Existing global queue files may contain legacy fields; parsing should be tolerant where safe.

## Open Questions
- None

## Linked Task
- Task Title: Define Brain Core Contracts
- Task File: brain/tasks/in-progress.md
