# Brain Fix Handoff: Add PTY-Backed Thread Terminals Fix 2

## Status
Ready

## Source Review
brain/reviews/2026-06-13-add-pty-backed-thread-terminals-review-v2.md

## Original Handoff
brain/handoffs/fixes/2026-06-12-add-pty-backed-thread-terminals-fix-1.md

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Goal
Fix only the remaining PTY terminal reliability and auditability blockers from review v2.

## Fix Items
1. Make `close_pty` terminate or otherwise explicitly close the spawned child process where possible. Store enough child/session state to kill/wait/cleanup safely, and keep automatic cleanup on normal child exit.
2. Fix `TerminalPanel` so xterm is not recreated merely because `pid` changes. Keep the event listener writing to the currently visible terminal and keep resize working without disposing the active terminal during spawn.
3. Persist durable PTY session metadata beside the log file. Include `sessionId`, `runId`, `queueItemId`, `executionPath`, command, args, startedAt, finishedAt, exitCode/signal, logFilePath, and status.
4. Update `brain/api/contracts.md` command table to document the actual `spawn_pty(runId, queueItemId, executionPath, command, args, rows, cols) -> PtySessionMetadata`, `close_pty`, and the PTY event/session metadata contract.
5. Document the manual smoke test precisely. Run a safe terminal command through the UI if possible. If not possible, state the exact blocker, such as missing Rust/Cargo, inability to launch Tauri, or no GUI session.

## Context To Read First
- brain/reviews/2026-06-13-add-pty-backed-thread-terminals-review-v2.md
- brain/handoffs/fixes/2026-06-12-add-pty-backed-thread-terminals-fix-1.md
- brain/plans/2026-06-12-feature-pty-thread-terminals.md
- apps/desktop/src-tauri/src/pty.rs
- apps/desktop/src/components/terminal-panel.tsx
- packages/desktop-client/src/index.ts
- brain/api/contracts.md
- brain/features/threaded-terminals.md
- brain/progress.md

## Acceptance Criteria
- Closing the visible terminal actively cleans up backend session state and terminates/closes the child process where the PTY library supports it.
- Live PTY output writes to the terminal instance the user can see after spawn and after resize.
- PTY log files have durable metadata sidecars that preserve queue/run/session linkage.
- Brain API docs match the implemented PTY command, return value, close command, and events.
- Completion notes include exact check results and explicit manual-smoke-test status.

## Do Not Change
- Do not broaden into unrelated scheduler, runner log, or LaunchAgent work.
- Do not move the task to done.
- Do not rewrite unrelated app layout.

## Required Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck
- cargo check from apps/desktop/src-tauri if cargo is available; otherwise document the missing Rust toolchain exactly.
- Manual terminal smoke test with a safe shell command if the app can be launched; otherwise document the exact launch/smoke-test blocker.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/threaded-terminals.md` if behavior changes.
- Update `brain/api/contracts.md` for the final PTY command/event/session metadata contract.
- Update `brain/api/permissions.md` only if permissions changed.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes

- Changed files: `apps/desktop/src-tauri/src/pty.rs`, `apps/desktop/src/components/terminal-panel.tsx`
- Checks run: `bun --cwd apps/desktop typecheck` passed. `cargo check` skipped because host is missing Rust toolchain. Manual smoke test blocked: Missing Rust/Cargo toolchain prevents compiling and running the Tauri backend.
- Brain docs updated: `brain/api/contracts.md`, `brain/progress.md`
- Unresolved issues: None.
