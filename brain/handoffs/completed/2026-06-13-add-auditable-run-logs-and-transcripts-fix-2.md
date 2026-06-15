# Brain Fix Handoff: Add Auditable Run Logs And Transcripts Fix 2

## Status
Completed

## Source Review
brain/reviews/2026-06-13-add-auditable-run-logs-and-transcripts-review-v2.md

## Original Handoff
brain/handoffs/fixes/2026-06-12-add-auditable-run-logs-and-transcripts-fix-1.md

## Source Plan
brain/plans/2026-06-12-feature-run-logs-transcripts.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-auditable-run-logs-and-transcripts.json

## Goal
Fix only the remaining auditability blockers from the second review.

## Fix Items
1. Harden `read_log_file` so caller-provided filenames cannot escape `~/.codex/brain-project-manager/logs/runs/`. Reject path separators, `..`, absolute paths, non-`.log` files, and any canonical path outside the runs directory.
2. Fix `LogsPanel` live tailing so the event listener always scopes output to the currently selected/current run. Avoid stale React closures; use dependencies or a ref, and keep output from other runs out of the selected transcript.
3. Improve run log naming to avoid empty or colliding names. Derive safe names from stable run context such as sanitized runId plus timestamp and, when available, queueItemId/projectId/agent.
4. Update `brain/api/contracts.md` to document the actual `run_process(command, args, cwd, queueItemId, projectId, agent, runId)` command, `RunMetadata`, `LogSummary`, safe filename rules, and the `process-complete` payload with exit metadata.
5. Run or document the required manual checks: a safe stdout/stderr stub run and a missing-command/spawn-failure check that produces a durable blocked/error record. If the Tauri runtime is unavailable, document exactly why these checks could not be executed and what was inspected instead.

## Context To Read First
- brain/reviews/2026-06-13-add-auditable-run-logs-and-transcripts-review-v2.md
- brain/handoffs/fixes/2026-06-12-add-auditable-run-logs-and-transcripts-fix-1.md
- brain/plans/2026-06-12-feature-run-logs-transcripts.md
- apps/desktop/src-tauri/src/runner.rs
- apps/desktop/src/components/logs-panel.tsx
- brain/api/contracts.md
- brain/features/automation-runs.md
- brain/progress.md

## Acceptance Criteria
- `read_log_file` cannot read outside the global logs/runs directory for any caller input.
- Live log output appears only for the selected/current run and updates after run selection changes.
- Generated log and metadata filenames are path-safe and collision-resistant.
- Brain docs match the implemented Tauri command and event contracts.
- Completion notes include the required checks and their actual results or explicit blockers.

## Do Not Change
- Do not broaden into unrelated scheduler, PTY, or LaunchAgent work.
- Do not move the task to done.
- Do not rewrite unrelated UI styling.

## Required Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck
- cargo check from apps/desktop/src-tauri if cargo is available; otherwise document cargo as blocked by missing Rust toolchain.
- Manual safe stub run that emits stdout and stderr, plus a missing-command/spawn-failure check that produces a durable blocked/error record, or an explicit documented blocker if the Tauri runtime cannot be exercised.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/automation-runs.md` if behavior or UI wording changes.
- Update `brain/api/contracts.md` for the final runner/log metadata/event contract.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src-tauri/src/runner.rs` — hardened `read_log_file` with path traversal prevention (reject separators, `..`, absolute paths, non-`.log` files, canonical path must be within runs dir); added `make_log_name` for collision-resistant log naming using timestamp + sanitized runId + optional queueItemId/projectId/agent
  - `apps/desktop/src/components/logs-panel.tsx` — fixed stale closure in live tailing by using `useRef` for `selectedFile` with stable event listener (no dependency on `selectedFile`)
  - `brain/api/contracts.md` — updated `run_process` signature, `read_log_file` safe filename rules, `LogSummary` fields, `process-complete` payload, `RunMetadata` and log naming documentation
- Checks run:
  - `bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck`: pass (0 errors)
  - `cargo check`: unavailable (cargo not found); Rust changes verified by code inspection
  - Manual run verification: Tauri runtime not available in CLI environment; safe stub run was not executed. Code inspection confirms spawn-failure produces durable blocked status + error record in both metadata and queue item.
- Brain docs updated:
  - `brain/api/contracts.md` — updated run_process, read_log_file, LogSummary, process-complete, RunMetadata contracts
  - `brain/progress.md` — fix-2 completion notes
  - `brain/handoffs/fixes/2026-06-13-add-auditable-run-logs-and-transcripts-fix-2.md` — completion notes
- Unresolved issues: cargo check and Tauri manual run verification unavailable (Rust toolchain not installed, no GUI runtime)
