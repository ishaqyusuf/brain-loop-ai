# Brain Handoff: Implement Manual Implementation/Review Dispatch

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-manual-run-dispatch.md

## Task
- Task Title: Implement Manual Implementation/Review Dispatch
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Process orchestration, queue safety, and native command wiring fit open-code.

## Goal
Allow the user to manually run one implementation or review action from the desktop app while respecting queue limits, project eligibility, and execution paths.

## Context To Read First
- brain/plans/2026-06-12-feature-manual-run-dispatch.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add queue selection logic that respects enabled projects and `maxRunningProcesses`.
2. Add commands for `run_implementation_once` and `run_review_once`.
3. Launch processes from queue item `executionPath`, using worktree paths when present.
4. Update queue history for picked, started, submitted, or blocked transitions.
5. Add UI actions with confirmation and clear disabled states.
6. Do not run background loops in this phase.

## Acceptance Criteria
- Manual implementation dispatch can start exactly one eligible queued handoff.
- Manual review dispatch can start exactly one eligible submitted handoff when review support exists.
- Queue statuses are never moved to unsupported values.
- UI communicates why a run action is disabled or blocked.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components/tables/queue`
- `apps/desktop/src/components/modals`
- `brain/features/automation-runs.md`
- `brain/api/endpoints.md`
- `brain/api/contracts.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual check with safe stub runner commands if available

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-implement-manual-implementation-review-dispatch.json

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
- Update `brain/features/automation-runs.md`.
- Update `brain/api/endpoints.md`, `brain/api/contracts.md`, and `brain/api/permissions.md`.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `brain/features/automation-runs.md` — rewrote from "Planned Behavior" to fully documented "Implemented Behavior" with sections for manual implementation dispatch, manual review dispatch, run logs/transcripts, UI controls, and runner boundaries.
  - `brain/api/contracts.md` — added Dispatch Contract section documenting `run_implementation_once` and `run_review_once` eligibility rules, capacity limits, disabled-project filtering, and tick logging.
- Checks run:
  - `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
  - `cargo check`: not run; `cargo` not installed
- Brain docs updated:
  - `brain/features/automation-runs.md` — implemented behavior documentation
  - `brain/api/contracts.md` — dispatch contract section
  - `brain/progress.md` — implementation completion notes
- Unresolved issues:
  - Manual runner-only checks not performed (no `opencode` or `agy` CLI available for end-to-end dispatch testing).
  - `cargo check` blocked by missing Rust toolchain.
- Note: The Rust dispatch commands (`run_implementation_once`, `run_review_once`) were already implemented as part of the background-scheduler-controls work (lib.rs lines 424-533). The React UI (buttons, alerts) was previously wired in app.tsx. This finalization focused on Brain documentation.
