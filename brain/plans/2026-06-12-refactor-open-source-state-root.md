# Plan: Move Global State Root To `~/.brain-loop`

## Type
Refactor

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Planning to open source; move source folder away from `.codex`

## Goal Or Problem
Make the durable state root suitable for an opinionated open-source product instead of depending on a private `.codex` path.

## Current Context
The legacy root was `~/.codex/brain-project-manager`. The implemented default root is `~/.brain-loop`.

## Proposed Approach
Implement `~/.brain-loop` as the default state root with migration support from the legacy `.codex` path. Store settings as TOML while preserving JSON for projects, queues, workspaces, threads, locks, logs, and run metadata.

## Implementation Steps
- Use `~/.brain-loop` as the new default state root.
- Convert legacy `settings.json` to `settings.toml` when the new settings file is missing.
- Copy missing legacy non-worktree state into the new root: projects, workspaces, queues, locks, logs, and threads.
- Do not copy or move legacy Git worktrees automatically.
- Update settings, project registry, queue, log, lock, thread, API, permission, and skill docs.

## Affected Files Or Areas
- `brain/SYSTEM_OVERVIEW.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/features/brain-state.md`
- `brain/features/threaded-terminals.md`
- `apps/desktop/src-tauri/src`
- `packages/brain-core/src/constants.ts`
- `packages/desktop-client/src/index.ts`

## Acceptance Criteria
- New state root is documented as `~/.brain-loop`.
- Legacy `.codex` compatibility and migration behavior is documented.
- Queue, logs, locks, settings, projects, workspaces, and threads have an explicit root path policy.
- Desktop permission docs match the new path model.
- `settings.toml` is the only TOML state file; all other durable Brain state files remain JSON.

## Test Plan
- `bun run typecheck`
- `cargo check` from `apps/desktop/src-tauri`
- Temporary-HOME migration/read smoke test.

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

## Completion Notes
- Final default state root: `~/.brain-loop`.
- Settings format: `settings.toml`.
- Legacy root: `~/.codex/brain-project-manager`, read only for migration/fallback.
- Git worktrees remain in place when already created under the legacy root; new worktrees are created under `~/.brain-loop/worktrees`.

## Linked Task
- Task Title: Move Global State Root Out Of `.codex`
- Task File: brain/tasks/roadmap.md
