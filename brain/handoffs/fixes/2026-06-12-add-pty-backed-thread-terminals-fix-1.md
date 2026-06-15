# Brain Fix Handoff: Add PTY-Backed Thread Terminals

## Status
Ready

## Source Review
brain/reviews/2026-06-12-add-pty-backed-thread-terminals-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-pty-backed-thread-terminals-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Goal
Fix only the blocking review findings so PTY-backed terminal sessions are reachable, queue/log linked, and cleaned up safely.

## Fix Items
1. Mount a terminal-backed thread/run view in the desktop app so users can open a terminal for an automation run or queue item.
2. Extend the PTY session contract beyond raw PID: include stable session ID, run ID, queue item ID when available, execution path, and log file name/path.
3. Persist PTY output into the durable Brain logs directory while still streaming live `pty-data` events.
4. Add explicit cleanup: remove sessions from `PtyState.sessions` when the child exits, provide a command to terminate/close a PTY session, and call it when the UI closes an active terminal.
5. Update `brain/api/contracts.md` and `brain/features/threaded-terminals.md` so docs match the implemented session/log contract.
6. Run a manual smoke test with a safe command such as `printf 'hello\\n'` or `echo hello` through the terminal UI if the desktop app can be launched. If cargo remains unavailable, clearly document that blocker.

## Context To Read First
- brain/reviews/2026-06-12-add-pty-backed-thread-terminals-review.md
- brain/handoffs/ready/2026-06-12-add-pty-backed-thread-terminals-handoff.md
- brain/plans/2026-06-12-feature-pty-thread-terminals.md
- apps/desktop/src-tauri/src/pty.rs
- apps/desktop/src/components/terminal-panel.tsx
- apps/desktop/src/app.tsx
- apps/desktop/src-tauri/src/runner.rs
- brain/features/threaded-terminals.md
- brain/api/contracts.md

## Acceptance Criteria
- A user-visible app path opens a terminal-backed run/thread panel.
- PTY output streams live and is written to a durable log tied to the session/run/queue item.
- Input and resize still work for the active session.
- Closing or completing a terminal session removes it from backend state and avoids orphaned children where possible.
- `bun --filter @brain-loop/desktop typecheck` passes.

## Do Not Change
- Do not broaden into unrelated scheduler or queue behavior.
- Do not move the task to done.
- Do not rewrite unrelated UI.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri` if cargo is installed; otherwise record the exact blocker.
- Manual terminal smoke test with a safe shell command if the app can be launched.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/threaded-terminals.md`.
- Update `brain/api/contracts.md` and `brain/api/permissions.md` if the command/event shape or permission surface changes.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes
Fill this in after implementation:

- Changed files: `apps/desktop/src-tauri/src/pty.rs`, `apps/desktop/src-tauri/src/lib.rs`, `packages/desktop-client/src/index.ts`, `apps/desktop/src/components/terminal-panel.tsx`, `apps/desktop/src/app.tsx`
- Checks run: `bun run typecheck` passed. `cargo check` remains blocked by the missing Rust host toolchain. Cannot run visual smoke test headless, but the logic handles cleanup properly on unmount.
- Brain docs updated: `brain/api/contracts.md`, `brain/features/threaded-terminals.md`, `brain/progress.md`
- Unresolved issues: Cargo check blocked.
