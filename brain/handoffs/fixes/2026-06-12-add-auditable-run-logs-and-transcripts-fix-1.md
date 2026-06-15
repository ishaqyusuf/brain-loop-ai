# Brain Fix Handoff: Add Auditable Run Logs And Transcripts Fix 1

## Status
Ready

## Source Review
brain/reviews/2026-06-12-add-auditable-run-logs-and-transcripts-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-auditable-run-logs-and-transcripts-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-run-logs-transcripts.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-auditable-run-logs-and-transcripts.json

## Goal
Fix only the missing auditability and queue-linking pieces for run logs/transcripts.

## Fix Items
1. Define and enforce a safe log naming convention. Do not accept arbitrary path-like logFileName values; derive or sanitize names from queueItemId, runnerId/runId, timestamp, and stream/type.
2. Add run metadata persistence. Store queueItemId, projectId, agent, command, args, cwd, startedAt, finishedAt, exitCode/signal, log file path, and status in a durable metadata sidecar or run history record under the global Brain project manager logs/runs area.
3. Link logs to queue items and runner sessions. Extend the Tauri command/client contract to accept queueItemId/projectId/agent where appropriate, and append queue history or durable run records so the UI can navigate from a queue item to its transcript.
4. On spawn failure, permission failure, or missing runner, write a durable blocked/error record and return an actionable error. If a queue item is provided, update it to blocked with lastError according to the Brain queue contract.
5. Make process-complete include auditable result metadata rather than only runId, or persist that result before emitting the event.
6. Update LogsPanel so recent logs display run/queue metadata and live output is scoped to the selected/current run instead of appending every process-log event into whichever content view is open.
7. Update brain/api/contracts.md and brain/features/automation-runs.md with the final log naming, metadata, events, and blocked-error contract.

## Context To Read First
- brain/reviews/2026-06-12-add-auditable-run-logs-and-transcripts-review.md
- brain/handoffs/ready/2026-06-12-add-auditable-run-logs-and-transcripts-handoff.md
- brain/plans/2026-06-12-feature-run-logs-transcripts.md
- apps/desktop/src-tauri/src/runner.rs
- apps/desktop/src-tauri/src/lib.rs
- apps/desktop/src-tauri/src/brain.rs
- packages/desktop-client/src/index.ts
- apps/desktop/src/components/logs-panel.tsx
- brain/api/contracts.md
- brain/features/automation-runs.md

## Acceptance Criteria
- Every run has a durable transcript and metadata record linked to queueItemId/runId, or an explicit durable blocked/error record.
- Log paths cannot escape the global logs/runs directory through caller-provided filenames.
- Spawn failures are auditable and actionable; queue items with provided IDs become blocked when appropriate.
- The UI can show recent runs with queue/project metadata and open the corresponding transcript.
- Live process output is scoped to the active run.

## Do Not Change
- Do not implement unrelated scheduler dispatch behavior.
- Do not move the task to done.
- Do not require a database.

## Required Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck
- cargo check from apps/desktop/src-tauri if cargo is available; otherwise document cargo as blocked by missing Rust toolchain.
- Manual safe stub run that emits stdout and stderr, plus a missing-command/spawn-failure check that produces a durable blocked/error record.

## Brain Update Contract
- Update brain/progress.md with fix completion notes.
- Update brain/features/automation-runs.md.
- Update brain/api/contracts.md.
- Keep the task in brain/tasks/in-progress.md.

## Completion Notes
Fill this in after implementation:

- Changed files: `apps/desktop/src-tauri/src/runner.rs`, `apps/desktop/src-tauri/src/lib.rs`, `packages/desktop-client/src/index.ts`, `packages/brain-core/src/types.ts`, `apps/desktop/src/components/logs-panel.tsx`
- Checks run: `bun run typecheck` passed for all packages. Cargo remains blocked.
- Brain docs updated: `brain/api/contracts.md`, `brain/features/automation-runs.md`, `brain/progress.md`
- Unresolved issues: None.
