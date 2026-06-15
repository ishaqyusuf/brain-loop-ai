# Brain Handoff Review: Add PTY-Backed Thread Terminals Fix 1

## Reviewed Handoff
brain/handoffs/fixes/2026-06-12-add-pty-backed-thread-terminals-fix-1.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed; review failed and a fix handoff was created.

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Result
Needs Fix

## Findings
- [P1] Closing a terminal does not terminate the spawned PTY child. `apps/desktop/src-tauri/src/pty.rs:80-115` moves `child` into the reader thread and only stores the PTY master in `PtyState.sessions`; `close_pty` at `pty.rs:188-199` removes the master but has no child handle to kill or wait. The fix handoff explicitly required closing an active terminal to avoid orphaned children where possible.
- [P1] The terminal component can detach live output from the visible terminal after spawn. `apps/desktop/src/components/terminal-panel.tsx:19-50` recreates and disposes the xterm instance whenever `pid` changes. The spawn effect registers its `pty-data` listener against the old `term` captured before `setPid(spawnedPid)`, so output can continue writing to a disposed terminal instead of the newly visible terminal.
- [P2] PTY output is logged, but the queue/session association is not durable. `apps/desktop/src-tauri/src/pty.rs:85-106` returns metadata to the caller and writes `<sessionId>.log`, but does not persist a sidecar metadata file containing `sessionId`, `runId`, `queueItemId`, `executionPath`, command, args, started/finished times, and exit status. A later log browser cannot reconstruct queue linkage from the log file alone.
- [P2] The API docs still describe the old PTY command shape in the command table. `brain/api/contracts.md:73-75` still says `spawn_pty(run_id, command, args, rows, cols) -> Result<u32, String>`, even though the implementation now returns `PtySessionMetadata` and accepts queue/execution metadata.
- [P2] The required manual terminal smoke test is still not complete. The completion notes state the visual smoke test could not run headless, but the handoff asked to run a safe terminal command if the app can be launched or document the blocker. The blocker is not specific enough to prove whether the app could not be launched, the terminal UI could not be exercised, or only cargo was missing.

## Acceptance Criteria Check
- A user-visible app path opens a terminal-backed run/thread panel: Partial; there is an Open Terminal button, but it opens only a hardcoded `/bin/zsh` manual session rather than an automation run/queue item thread.
- PTY output streams live and is written to a durable log tied to the session/run/queue item: Partial; logs are written, but durable queue/session metadata is missing and live output can detach after `pid` changes.
- Input and resize still work for the active session: Partial; APIs exist, but no smoke test proves the visible terminal remains attached after spawn.
- Closing or completing a terminal session removes it from backend state and avoids orphaned children where possible: Fail; close removes state but cannot terminate the child.
- `bun --filter @brain-loop/desktop typecheck` passes: Pass.

## Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck: Pass.
- cargo check from apps/desktop/src-tauri: Not run; `cargo` command is not installed on this machine.
- Manual terminal smoke test with a safe shell command: Not run/documented with a specific blocker.

## Brain Update Check
- brain/progress.md: Present.
- brain/features/threaded-terminals.md: Present.
- brain/api/contracts.md: Present but stale in the PTY command table.
- brain/api/permissions.md: Present.
- Task remains in brain/tasks/in-progress.md: Present.

## Decision
Fix 1 makes the terminal reachable and begins durable PTY logging, but cleanup and visible live output are still not reliable enough to approve. A second focused fix handoff was created.

## Follow-Up
- brain/handoffs/fixes/2026-06-13-add-pty-backed-thread-terminals-fix-2.md
