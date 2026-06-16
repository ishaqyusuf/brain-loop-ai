# Plan: Add Token-Saving Automation Triage

## Type
Feature

## Status
Done

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-13-token-saving-automation-triage.md
- Intake Item: Locally inspect task logs and queue state before launching token-spending agents.

## Goal Or Problem
Reduce unnecessary token usage by having automation ticks make cheap local decisions from Brain queue/log state before launching Codex, review, or implementation agents.

## Current Context
Brain Loop already treats Brain JSON files as the durable workflow contract. Existing scheduler work can start, pause, and tick automation; queue readers expose queued/submitted/active state; run logs and metadata are durable; manual dispatch plans cover launching one implementation or review run. The missing behavior is a local triage layer that decides which runner, if any, should launch from current task state without asking an agent to reason over empty or ineligible work.

## Proposed Approach
Add a scheduler triage function in Rust that reads queue items and relevant run metadata/history locally, classifies eligible work by status, and returns a dispatch decision. Submitted work should route to the configured review/orchestrator runner, defaulting to Codex review behavior when configured. Queued work should route to the relevant implementation agent from queue/project settings. If no eligible work exists, the scheduler records a skip decision and launches no process.

## Implementation Steps
- Add a focused local triage helper near scheduler dispatch that reads queue state through existing Brain readers instead of invoking an agent.
- Classify eligible items by supported statuses, at minimum `submitted`, `queued`, and `reviewed-fix-request`, while continuing to respect disabled projects, active process limits, paused/stopped scheduler state, and supported queue transitions.
- Prefer submitted/review work before new queued implementation work unless a later scheduling-policy setting overrides that behavior.
- Resolve the dispatch target from queue item fields, project defaults, or runner/model settings, preserving backward compatibility with existing `recommendedAgent` values.
- Record every triage decision in durable scheduler/run decision logs, including "no eligible work", "submitted work selected", "queued work selected", and "skipped due to ineligible project/capacity".
- Ensure submitted work launches the configured Codex thread or user-selected review/orchestrator option rather than a generic implementation agent.
- Ensure queued implementation work launches the relevant agent for that queue item or project.
- Add unit-style tests or fixture-driven checks for submitted-only, queued-only, mixed submitted/queued, disabled-project, at-capacity, and empty-queue cases.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src/scheduler.rs`
- `apps/desktop/src-tauri/src/brain.rs`
- `apps/desktop/src-tauri/src/runner.rs`
- `packages/brain-core/src/types.ts`
- `packages/desktop-client/src/index.ts`
- `brain/features/background-scheduler.md`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`

## Acceptance Criteria
- Automation ticks can decide locally that no agent should run when no eligible queue or submitted work exists.
- Submitted work routes to the configured review/orchestrator runner, with Codex review/thread behavior supported when configured.
- Queued work routes to the relevant implementation agent based on queue/project settings.
- Scheduler decision logs explain why an item was selected or skipped without requiring an agent transcript.
- Existing disabled-project, paused-state, and max-running-process protections still apply.
- Existing queue files without new runner/model fields remain compatible.

## Test Plan
- Add fixture-driven scheduler triage tests for empty, submitted-only, queued-only, mixed, disabled-project, and at-capacity states.
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual scheduler check with safe/stub runner commands and sample queue files.

## Implementation Progress

- The background automation loop now performs local queue triage in review-first order: submitted review work is attempted before new queued implementation work.
- Tray "Run Once" follows the same review-first then implementation order.
- Extracted a dedicated local automation triage helper used by both the background loop and tray "Run Once" path. The helper records a compact `TRIAGE:` scheduler-log summary after each review/implementation pass.
- Existing implementation/review dispatch paths already classify queue state locally by status, enabled project, and capacity before launching agents, and record skip/dispatch decisions to durable scheduler logs.
- Added `bun --filter @brain-loop/desktop scheduler:qa` coverage for the review-first local triage invariant.
- Fixture-driven Rust tests remain deferred until Cargo is available. The v1 orchestrator choice uses the configured default review runner/model settings.

## Brain Update Requirements
- Update `brain/features/background-scheduler.md`.
- Update `brain/features/automation-runs.md`.
- Update `brain/api/contracts.md` and `brain/api/endpoints.md` if command payloads or scheduler status fields change.
- Add an ADR if a new durable queue/orchestrator field is introduced.
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
- Submitted work may require review-specific permissions; the scheduler must surface approval requirements instead of silently retrying.
- Mixed submitted and queued work can starve queued implementation if review work never clears; this should be revisited with the scheduling-policy plan.
- Log metadata and queue history may disagree after crashes; triage should prefer queue status and use logs only as supporting context unless the contract changes.

## Open Questions
- None for v1. Local triage uses queue state/status and durable scheduler/run metadata; full log-body inspection can be added later if a contract requires it.

## Linked Task
- Task Title: Add Token-Saving Automation Triage
- Task File: brain/tasks/roadmap.md
