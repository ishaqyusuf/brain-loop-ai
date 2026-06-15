# Plan: Add PTY-Backed Thread Terminals

## Type
Feature

## Status
In Progress

## Created Date
2026-06-12

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 68-76%

## Goal Or Problem
Provide embedded terminal sessions per automation thread so users can inspect and interact with long-running implementation or review processes.

## Current Context
Future terminal support is planned as Rust PTY plus xterm.js. The app should feel like a Codex-style local control center with threaded run UI.

## Proposed Approach
Add a Rust PTY/session layer, Tauri event bridge, and React terminal view while keeping session metadata linked to queue items and logs.

## Implementation Steps
- Choose a PTY crate already compatible with Tauri/macOS or document the dependency decision.
- Add Rust modules for terminal sessions, input, resize, output events, and cleanup.
- Add frontend terminal component integration, likely xterm.js, only after checking package fit.
- Link terminal sessions to queue item IDs and run logs.
- Add thread list/detail UI using Codex-standard thread workspace layout and shadcn tabs/scroll areas.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/package.json`
- `brain/features/threaded-terminals.md`
- `brain/api/contracts.md`

## Acceptance Criteria
- Users can open a terminal-backed run thread from the desktop app.
- Terminal output streams live and is associated with durable logs.
- Input and resize events work for active sessions.
- Session cleanup prevents orphaned processes when a session ends.
- Terminal placement, scroll behavior, and resize behavior do not break the Codex-standard thread workspace.

## Test Plan
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual terminal smoke test with a safe shell command

## Brain Update Requirements
- Update `brain/features/threaded-terminals.md`.
- Update `brain/api/contracts.md` and `brain/api/permissions.md`.
- Add ADR if the PTY crate or terminal architecture is a durable dependency decision.
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
- PTY dependencies may require additional macOS permissions or build configuration.
- Terminal rendering can overlap or resize poorly if dimensions are not constrained.

## Open Questions
- None

## Linked Task
- Task Title: Add PTY-Backed Thread Terminals
- Task File: brain/tasks/in-progress.md
