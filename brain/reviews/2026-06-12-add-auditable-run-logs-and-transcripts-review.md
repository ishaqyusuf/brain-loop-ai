# Brain Handoff Review: Add Auditable Run Logs And Transcripts

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-add-auditable-run-logs-and-transcripts-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-auditable-run-logs-and-transcripts.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Source Plan
brain/plans/2026-06-12-feature-run-logs-transcripts.md

## Result
Needs Fix

## Findings
- [P1] Log files are not linked to queue items or runner sessions. apps/desktop/src-tauri/src/runner.rs lines 16-23 accept only command, args, logFileName, and runId; there is no queueItemId/projectId/agent metadata, no sidecar metadata file, and no queue history update. This fails the handoff requirement to link log entries to queue item IDs and runner sessions.
- [P1] Spawn failures do not create durable logs or explicit blocked errors. runner.rs lines 39-44 return an error if spawn fails, but do not write a durable blocked/error record and do not update queue state, so missing tools/permissions can disappear as an in-memory command error instead of an auditable run outcome.
- [P1] The log file name is caller-controlled and not sanitized. runner.rs line 29 joins the provided logFileName directly under the logs directory, so a malformed name with path separators can escape the intended log naming convention. The handoff required defined log file naming and metadata conventions.
- [P2] Completion is not auditable. runner.rs lines 89-92 emits process-complete with only runId and does not capture exit code, signal, finishedAt, duration, or stderr/stdout summary in a durable RunResult shape.
- [P2] The UI shows generic recent files, not queue-linked transcripts. LogsPanel lists filenames and content, but has no queue item/run metadata display, no filtering/linking by queue item, and live events append regardless of selected run.
- [P2] Manual safe stub verification was not run. Typecheck passed, but cargo is unavailable and there is no evidence the run_process path was manually verified with stdout and stderr.

## Acceptance Criteria Check
- Every launched run has a durable log or explicit blocked error: Fail
- UI can show recent run logs and queue-linked transcripts: Partial; recent logs yes, queue-linked transcripts no
- Process output is visible while a run is active: Partial; events append to the panel, but not scoped to selected run
- Logs do not require a database: Pass

## Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck: Pass
- cargo check from apps/desktop/src-tauri: Not run; cargo command is not installed on this machine.
- Manual safe stub command emitting stdout/stderr: Not run/documented.

## Brain Update Check
- brain/progress.md: Present
- brain/features/automation-runs.md: Present
- brain/api/contracts.md: Present but does not define safe log naming, run metadata, blocked error, or RunResult persistence contract
- brain/tasks/in-progress.md: Present; task remains in progress

## Decision
The implementation is a useful raw logging primitive, but it does not yet satisfy the auditable queue-linked transcript contract. A focused fix handoff was created.

## Follow-Up
- brain/handoffs/fixes/2026-06-12-add-auditable-run-logs-and-transcripts-fix-1.md
