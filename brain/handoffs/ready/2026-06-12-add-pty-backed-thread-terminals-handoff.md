# Brain Handoff: Add PTY-Backed Thread Terminals

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Task
- Task Title: Add PTY-Backed Thread Terminals
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: Rust PTY/session lifecycle and terminal integration require focused systems work.

## Goal
Provide embedded terminal sessions per automation thread so users can inspect and interact with long-running implementation or review processes.

## Context To Read First
- brain/plans/2026-06-12-feature-pty-thread-terminals.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Choose a PTY crate already compatible with Tauri/macOS or document the dependency decision.
2. Add Rust modules for terminal sessions, input, resize, output events, and cleanup.
3. Add frontend terminal component integration, likely xterm.js, only after checking package fit.
4. Link terminal sessions to queue item IDs and run logs.
5. Add thread list/detail UI using Midday-style layout and shadcn tabs/scroll areas.

## Acceptance Criteria
- Users can open a terminal-backed run thread from the desktop app.
- Terminal output streams live and is associated with durable logs.
- Input and resize events work for active sessions.
- Session cleanup prevents orphaned processes when a session ends.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/package.json`
- `brain/features/threaded-terminals.md`
- `brain/api/contracts.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual terminal smoke test with a safe shell command

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/features/threaded-terminals.md`.
- Update `brain/api/contracts.md` and `brain/api/permissions.md`.
- Add ADR if the PTY crate or terminal architecture is a durable dependency decision.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files: `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/src-tauri/src/pty.rs` (new), `apps/desktop/src-tauri/src/lib.rs`, `packages/desktop-client/src/index.ts`, `apps/desktop/src/components/terminal-panel.tsx` (new). Fixed syntax error in `packages/brain-core/src/types.ts`.
- Checks run: `bun --filter @brain-loop/desktop typecheck` (passed). `cargo check` failed locally due to missing Rust toolchain.
- Brain docs updated: `brain/decisions/0002-use-portable-pty-for-terminal.md` (new), `brain/api/contracts.md`, `brain/progress.md`, `brain/features/threaded-terminals.md`.
- Unresolved issues: Cargo compilation and local desktop smoke test remains blocked by the local environment's missing Rust toolchain.
