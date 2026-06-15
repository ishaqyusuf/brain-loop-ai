# Brain Handoff Review: Add PTY-Backed Thread Terminals Fix 2

## Reviewed Handoff
brain/handoffs/fixes/2026-06-13-add-pty-backed-thread-terminals-fix-2.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Blocked: Needs fix.

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Result
Needs Fix

## Findings
- [P2] brain/api/contracts.md still omits the close_pty command from the Tauri command table. The Fix 2 handoff explicitly required the command table to document spawn_pty, close_pty, and the PTY event/session metadata contract. The table documents spawn_pty, write_pty, and resize_pty, then jumps to run_process/read_log_file/list_recent_logs without a close_pty entry. Because close_pty was one of the main reliability fixes, this leaves the Brain API contract stale and fails the documentation acceptance criterion.

## Acceptance Criteria Check
- Closing the visible terminal actively cleans up backend session state and terminates/closes the child process where supported: Pass by code inspection. close_pty removes the session and calls child.kill().
- Live PTY output writes to the visible terminal after spawn and resize: Pass by code inspection. xterm is mounted once, pid is kept in a ref for resize, and pty-data writes to the active terminal instance.
- PTY log files have durable metadata sidecars preserving queue/run/session linkage: Pass by code inspection. spawn_pty writes a JSON sidecar with session, run, queue, command, args, timestamps, log path, and status.
- Brain API docs match the implemented PTY command, return value, close command, and events: Fail. close_pty is missing from the Tauri command table.
- Completion notes include exact check results and manual-smoke-test status: Pass. Missing Rust/Cargo is documented as the blocker.

## Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck: Pass.
- cargo check from apps/desktop/src-tauri: Blocked, cargo command not found on host.
- Manual terminal smoke test: Blocked by missing Rust/Cargo toolchain preventing Tauri backend compilation/launch.

## Brain Update Check
- brain/progress.md: Present and updated.
- brain/features/threaded-terminals.md: Present.
- brain/api/contracts.md: Present but still missing close_pty command table entry.
- Task remains in brain/tasks/in-progress.md: Present.

## Decision
Needs fix. The implementation itself appears to resolve the prior lifecycle and metadata issues, but the required API contract update is incomplete. The next fix should be documentation-only unless implementation changes are discovered while updating the contract.

## Follow-Up
brain/handoffs/fixes/2026-06-15-add-pty-backed-thread-terminals-fix-3.md

