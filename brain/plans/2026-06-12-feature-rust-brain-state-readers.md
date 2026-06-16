# Plan: Implement Rust Brain State Readers

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 10-18%

## Goal Or Problem
Add read-only Tauri commands that load Brain Loop settings, projects, queue summaries, active locks, and recent logs from the app state root.

## Current Context
Brain Loop treats `~/.brain-loop` as the durable app state root. Settings are stored in `~/.brain-loop/settings.toml`, while projects, queues, threads, locks, and logs remain JSON files. Rust owns native filesystem access, performs read-only migration from the legacy `~/.codex/brain-project-manager` root when needed, and exposes typed command responses to React.

## Proposed Approach
Create Rust modules under `apps/desktop/src-tauri/src` for paths, JSON reads, typed models, and Tauri commands. Keep command handlers thin and reusable read logic in modules.

## Implementation Steps
- Add Rust structs for settings, projects, queue items, locks, and log summaries.
- Resolve the Brain Loop app state root from the user's home directory.
- Implement tolerant read helpers for missing optional files and invalid queue files.
- Expose commands for `get_brain_status`, `list_projects`, `list_queue`, and `list_recent_logs`.
- Emit clear error responses without panics.
- Wire command wrappers in `packages/desktop-client`.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `packages/brain-core/src/index.ts`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/features/brain-state.md`

## Acceptance Criteria
- React can call read-only commands through `packages/desktop-client`.
- Missing global Brain files produce safe empty/default responses.
- Invalid individual queue files are reported without breaking the full queue list.
- Command response shapes are documented.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop-client typecheck`
- `bun --filter @brain-loop/desktop typecheck`

## Brain Update Requirements
- Update `brain/api/endpoints.md` with implemented commands.
- Update `brain/api/contracts.md` with response shapes.
- Update `brain/features/brain-state.md`.
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
- File permissions and missing home directory resolution need graceful errors.
- Queue directories may contain archived or partially written files.

## Open Questions
- None

## Linked Task
- Task Title: Implement Rust Brain State Readers
- Task File: brain/tasks/in-progress.md
