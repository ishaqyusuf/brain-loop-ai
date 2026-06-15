# Brain Handoff Review: Add PTY-Backed Thread Terminals

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-add-pty-backed-thread-terminals-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed; implementation ran in the registered project checkout.

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Result
Needs Fix

## Findings
- [P1] The terminal UI is not reachable from the app. `apps/desktop/src/components/terminal-panel.tsx` defines `TerminalPanel`, but `rg` only finds that definition and no import or render site. This fails the acceptance criterion that users can open a terminal-backed run thread from the desktop app.
- [P1] PTY output is live-only and is never associated with durable run logs. `apps/desktop/src-tauri/src/pty.rs:62-77` emits `pty-data` and `process-complete`, but does not append output to a log file or include a log path/queue item ID. This fails the durable log association requirement.
- [P1] Session cleanup is incomplete. `apps/desktop/src-tauri/src/pty.rs:54-77` stores the PTY master in `PtyState.sessions` but never removes it after the child exits, and `apps/desktop/src/components/terminal-panel.tsx:76-79` explicitly leaves the process running on unmount. This can leak sessions/processes and fails the cleanup criterion.
- [P2] Session identity is too thin for queue-linked threads. The API returns only a PID and the event payload is only `{ pid, chunk }`, so the frontend cannot reliably associate output with `runId`, queue item ID, execution path, or log file across multiple sessions.
- [P2] The required manual terminal smoke test was not completed. The handoff reports it was blocked by the missing Rust toolchain; I confirmed `cargo check` cannot run because `cargo` is not installed.

## Acceptance Criteria Check
- Users can open a terminal-backed run thread from the desktop app: Fail
- Terminal output streams live and is associated with durable logs: Fail
- Input and resize events work for active sessions: Partial; API exists, but no reachable UI smoke test was performed.
- Session cleanup prevents orphaned processes when a session ends: Fail

## Checks
- `bun --filter @brain-loop/desktop typecheck`: Pass
- `cargo check` from `apps/desktop/src-tauri`: Not run; `cargo` command not found.
- Manual terminal smoke test with a safe shell command: Not run.

## Brain Update Check
- `brain/features/threaded-terminals.md`: Present, but documents behavior not fully implemented.
- `brain/api/contracts.md`: Present, but PTY contract omits queue/log/session identity and completion metadata.
- ADR for PTY crate decision: Present.
- `brain/progress.md`: Present.

## Decision
The work cannot be approved because the user-facing terminal entry point, durable logging link, and cleanup contract are not implemented. A focused fix handoff was created.

## Follow-Up
brain/handoffs/fixes/2026-06-12-add-pty-backed-thread-terminals-fix-1.md
