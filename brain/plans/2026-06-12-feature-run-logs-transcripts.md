# Plan: Add Auditable Run Logs And Transcripts

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 60-68%

## Goal Or Problem
Persist and display runner output, process metadata, queue history, and errors so every automation run is auditable.

## Current Context
AI rules explicitly say not to hide runner output. Manual dispatch and later scheduler work need durable logs that connect runs to queue items.

## Proposed Approach
Write runner output to global Brain project manager logs while streaming live events to the UI, then expose log summaries and details in the desktop console.

## Implementation Steps
- Define log file naming and metadata conventions under the global logs directory.
- Stream process stdout/stderr into durable files and Tauri events.
- Add log summary/detail read commands.
- Build a logs view or queue-item log panel using shadcn scroll areas, alerts, badges, and skeletons.
- Link log entries to queue item IDs and runner sessions.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`

## Acceptance Criteria
- Every launched run has a durable log or explicit blocked error.
- UI can show recent run logs and queue-linked transcripts.
- Process output is visible while a run is active.
- Logs do not require a database.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual run with a safe stub command that emits stdout and stderr

## Brain Update Requirements
- Update `brain/features/automation-runs.md`.
- Update `brain/api/contracts.md` for log metadata.
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
- Logs can grow large; detail views should avoid loading huge files into memory all at once.

## Open Questions
- None

## Linked Task
- Task Title: Add Auditable Run Logs And Transcripts
- Task File: brain/tasks/in-progress.md
