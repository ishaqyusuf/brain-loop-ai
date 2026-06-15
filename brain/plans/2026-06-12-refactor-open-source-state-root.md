# Plan: Move Global State Root Out Of `.codex`

## Type
Refactor

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Planning to open source; move source folder away from `.codex`

## Goal Or Problem
Make the durable state root suitable for an opinionated open-source product instead of depending on a private `.codex` path.

## Current Context
Current docs and queue contracts point at `~/.codex/brain-project-manager`. The user wants the source/state folder moved away from `.codex`, likely toward a product-owned user documents location.

## Proposed Approach
Design and implement a configurable state-root contract with migration support from the legacy `.codex` path to the new open-source-friendly location.

## Implementation Steps
- Decide the new default state root, with TODO candidate such as `~/Documents/Loop` or `~/Documents/codex/loop`.
- Add compatibility reads from the legacy `.codex` path during migration.
- Update settings, project registry, queue, log, lock, and thread path docs.
- Add a migration command or documented manual migration path.
- Update desktop permissions for the new root.

## Affected Files Or Areas
- `brain/SYSTEM_OVERVIEW.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/features/brain-state.md`
- `brain/features/threaded-terminals.md`
- `apps/desktop/src-tauri/src`
- `packages/brain-core/src/index.ts`
- `packages/desktop-client/src/index.ts`

## Acceptance Criteria
- New state root is documented.
- Legacy `.codex` compatibility or migration behavior is documented.
- Queue, logs, locks, settings, projects, and threads have an explicit root path policy.
- Desktop permission docs match the new path model.

## Test Plan
- `bun run typecheck`
- `cargo check` from `apps/desktop/src-tauri`
- Manual migration/read smoke test with temporary state roots if implemented.

## Brain Update Requirements
- Update architecture, API contracts, permissions, and relevant feature docs.
- Add ADR for the state-root decision.
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
- Existing queue items may reference absolute legacy paths.
- Multiple products may share older `.codex` state.

## Open Questions
- TODO: Final new default state root.

## Linked Task
- Task Title: Move Global State Root Out Of `.codex`
- Task File: brain/tasks/roadmap.md
