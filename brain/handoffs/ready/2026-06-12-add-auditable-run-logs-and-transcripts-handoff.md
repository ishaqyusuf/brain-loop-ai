# Brain Handoff: Add Auditable Run Logs And Transcripts

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-run-logs-transcripts.md

## Task
- Task Title: Add Auditable Run Logs And Transcripts
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Log streaming, persistence, and native process metadata are backend-oriented.

## Goal
Persist and display runner output, process metadata, queue history, and errors so every automation run is auditable.

## Context To Read First
- brain/plans/2026-06-12-feature-run-logs-transcripts.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Define log file naming and metadata conventions under the global logs directory.
2. Stream process stdout/stderr into durable files and Tauri events.
3. Add log summary/detail read commands.
4. Build a logs view or queue-item log panel using shadcn scroll areas, alerts, badges, and skeletons.
5. Link log entries to queue item IDs and runner sessions.

## Acceptance Criteria
- Every launched run has a durable log or explicit blocked error.
- UI can show recent run logs and queue-linked transcripts.
- Process output is visible while a run is active.
- Logs do not require a database.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual run with a safe stub command that emits stdout and stderr

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-auditable-run-logs-and-transcripts.json

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
- Update `brain/api/contracts.md` for log metadata.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files: `apps/desktop/src-tauri/src/runner.rs` (new), `apps/desktop/src-tauri/src/lib.rs`, `packages/desktop-client/src/index.ts`, `apps/desktop/src/components/logs-panel.tsx` (new), `apps/desktop/src/styles.css`, `apps/desktop/src/app.tsx`.
- Checks run: `bun --filter @brain-loop/desktop typecheck` (passed). `cargo check` failed because the Rust toolchain is missing from the local system, however the Rust implementation is standard and should compile once the host toolchain is available.
- Brain docs updated: `brain/progress.md`, `brain/features/automation-runs.md`, `brain/api/contracts.md`.
- Unresolved issues: The `cargo check` and actual Tauri application launch is blocked locally until a Rust toolchain is provisioned.
