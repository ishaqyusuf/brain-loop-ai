# Brain Fix Handoff: Add PTY-Backed Thread Terminals Fix 3

## Status
Ready

## Source Review
brain/reviews/2026-06-15-add-pty-backed-thread-terminals-review-v3.md

## Original Handoff
brain/handoffs/fixes/2026-06-13-add-pty-backed-thread-terminals-fix-2.md

## Source Plan
brain/plans/2026-06-12-feature-pty-thread-terminals.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-pty-backed-thread-terminals.json

## Goal
Fix the remaining Brain API documentation blocker for PTY-backed thread terminals.

## Fix Items
1. Update brain/api/contracts.md so the Tauri command table explicitly documents close_pty(pid) -> Result<(), String> and states that it removes backend session state and attempts to terminate the child process.
2. Keep the existing spawn_pty, write_pty, resize_pty, pty-data, process-complete, and durable metadata documentation accurate.
3. Do not change implementation code unless the docs update reveals a mismatch that must be corrected.

## Context To Read First
- brain/reviews/2026-06-15-add-pty-backed-thread-terminals-review-v3.md
- brain/handoffs/fixes/2026-06-13-add-pty-backed-thread-terminals-fix-2.md
- brain/api/contracts.md
- apps/desktop/src-tauri/src/pty.rs
- packages/desktop-client/src/index.ts

## Acceptance Criteria
- brain/api/contracts.md Tauri command table includes close_pty(pid) -> Result<(), String>.
- The close_pty description matches the implementation behavior.
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck still passes if any code changed.
- If this is docs-only, record that no code validation was needed beyond review inspection.

## Do Not Change
- Do not broaden into unrelated scheduler, runner log, or LaunchAgent work.
- Do not move the task to done.
- Do not rewrite terminal implementation unless required by a docs/implementation mismatch.

## Required Checks
- bun --cwd /Users/M1PRO/Documents/code/brain-loop/apps/desktop typecheck if any code changed.
- Documentation inspection confirming close_pty appears in brain/api/contracts.md.

## Brain Update Contract
- Update brain/progress.md with Fix 3 completion notes.
- Keep the task in brain/tasks/in-progress.md.

## Completion Notes

- Changed files: `brain/api/contracts.md`
- Checks run: None required, docs-only.
- Brain docs updated: `brain/api/contracts.md`, `brain/progress.md`
- Unresolved issues: None.

