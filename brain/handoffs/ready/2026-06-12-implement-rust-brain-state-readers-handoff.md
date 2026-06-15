# Brain Handoff: Implement Rust Brain State Readers

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-rust-brain-state-readers.md

## Task
- Task Title: Implement Rust Brain State Readers
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Rust filesystem and JSON parsing work fits a focused code implementation agent.

## Goal
Add read-only Tauri commands that load Brain project manager settings, projects, queue summaries, active locks, and recent logs from `~/.codex/brain-project-manager`.

## Context To Read First
- brain/plans/2026-06-12-feature-rust-brain-state-readers.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add Rust structs for settings, projects, queue items, locks, and log summaries.
2. Resolve the global Brain project manager root from the user's home directory.
3. Implement tolerant read helpers for missing optional files and invalid queue files.
4. Expose commands for `get_brain_status`, `list_projects`, `list_queue`, and `list_recent_logs`.
5. Emit clear error responses without panics.
6. Wire command wrappers in `packages/desktop-client`.

## Acceptance Criteria
- React can call read-only commands through `packages/desktop-client`.
- Missing global Brain files produce safe empty/default responses.
- Invalid individual queue files are reported without breaking the full queue list.
- Command response shapes are documented.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `packages/brain-core/src/index.ts`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/features/brain-state.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop-client typecheck`
- `bun --filter @brain-loop/desktop typecheck`

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-rust-brain-state-readers.json

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
- Update `brain/api/endpoints.md` with implemented commands.
- Update `brain/api/contracts.md` with response shapes.
- Update `brain/features/brain-state.md`.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
- Checks run:
- Brain docs updated:
- Unresolved issues:
