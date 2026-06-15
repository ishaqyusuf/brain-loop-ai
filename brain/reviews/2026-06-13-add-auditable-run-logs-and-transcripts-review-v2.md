# Brain Handoff Review: Add Auditable Run Logs And Transcripts Fix 1

## Reviewed Handoff
brain/handoffs/fixes/2026-06-12-add-auditable-run-logs-and-transcripts-fix-1.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-auditable-run-logs-and-transcripts.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed; review failed and a fix handoff was created.

## Source Plan
brain/plans/2026-06-12-feature-run-logs-transcripts.md

## Result
Needs Fix

## Findings
- [P1] Log reads can still escape the run logs directory. `apps/desktop/src-tauri/src/runner.rs:214-220` joins caller-provided `file_name` directly under `logs/runs` without rejecting path separators, `..`, or canonical paths outside the runs directory. The fix acceptance criteria explicitly requires log paths not to escape the global logs/runs directory through caller-provided filenames.
- [P1] Live log tailing is not actually scoped to the selected/current run. `apps/desktop/src/components/logs-panel.tsx:29-39` installs the `process-log` listener once with an empty dependency array, so the closure captures the initial `selectedFile` value of `null`. After a user selects a run, the listener still sees `null` and will not append that run's live output. This fails the live process output and run-scoped transcript acceptance criteria.
- [P2] The API contract docs still describe the old runner interface and event shape. `brain/api/contracts.md:76-87` still documents `run_process(command, args, log_file_name, run_id)` and says `process-complete` emits only the runId, even though the implementation now accepts queue/project/agent/cwd metadata and emits exit metadata. This makes the Brain Update Contract incomplete.
- [P2] Safe log naming is path-safe but still collision-prone. `apps/desktop/src-tauri/src/runner.rs:42-61` sanitizes only `runId`; an empty or reused run ID can produce `.log` / `.json` or overwrite/reuse an earlier transcript. The fix handoff asked for names derived from queue/run/timestamp context, not only a sanitized caller ID.
- [P2] Manual run verification is still undocumented. The completion notes say typecheck passed and cargo is blocked, but do not show the required safe stdout/stderr stub run or missing-command/spawn-failure check that proves durable blocked/error records are produced.

## Acceptance Criteria Check
- Every run has a durable transcript and metadata record linked to queueItemId/runId, or an explicit durable blocked/error record: Partial; metadata exists, but manual verification is missing and log read paths remain unsafe.
- Log paths cannot escape the global logs/runs directory through caller-provided filenames: Fail.
- Spawn failures are auditable and actionable; queue items with provided IDs become blocked when appropriate: Partial; implementation attempts this, but required missing-command verification is not documented.
- The UI can show recent runs with queue/project metadata and open the corresponding transcript: Partial.
- Live process output is scoped to the active run: Fail; the listener captures stale selected state.

## Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck: Pass.
- cargo check from apps/desktop/src-tauri: Not run; cargo command is not installed on this machine.
- Manual safe stub stdout/stderr check: Not run/documented.
- Missing-command/spawn-failure durable blocked/error check: Not run/documented.

## Brain Update Check
- brain/progress.md: Present.
- brain/features/automation-runs.md: Present.
- brain/api/contracts.md: Present but stale/incomplete for the updated runner command and event contract.
- brain/tasks/in-progress.md: Present; task remains in progress.

## Decision
Fix 1 moved the implementation much closer to the requested audit loop, but the remaining unsafe log read path and broken live transcript scoping are blocking. A second focused fix handoff was created.

## Follow-Up
- brain/handoffs/fixes/2026-06-13-add-auditable-run-logs-and-transcripts-fix-2.md
