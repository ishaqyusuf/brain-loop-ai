# Plan: Add Worktree-Backed Agent Threads

## Type
Feature

## Status
Done

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Intake Item: Each new task spawns a new agent thread like Codex chats; each agent uses a separate worktree by default; review uses the same work thread/worktree.

## Goal Or Problem
Each automation task should have a durable Codex-like agent thread with its own execution context. Implementation should default to an isolated worktree, and review should reuse the same thread/worktree context so the user sees one coherent conversation for the task lifecycle.

## Current Context
`brain/features/threaded-terminals.md` documents PTY sessions linked to queue items and execution paths. `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md` proposes configurable thread storage and worktree strategy. This pivot needs an immediate thread model that the capacity scheduler and UI can rely on.

## Proposed Approach
Define and persist agent thread metadata for each queue task. A thread should link queue item, project, implementation run, review run, worktree path, logs, approvals, and user-visible title. Use isolated worktrees by default when available, with explicit fallback behavior and warnings when worktree creation fails.

## Progress Notes

- Added initial durable agent thread metadata under the configured thread storage root, defaulting to `~/.brain-loop/threads/*.json`.
- Added `list_agent_threads` for sidebar consumption and shared `AgentThread` / `AgentThreadStatus` types in `@brain-loop/brain-core`.
- Implementation and review ticks now prepare or update thread records for enabled eligible queue items before reporting tick results.
- The desktop sidebar now prefers durable agent thread records and falls back to queue-derived thread rows when no thread records exist yet.
- Implementation and review ticks now prepare a per-task Git worktree under the configured worktree storage root, defaulting to `~/.brain-loop/worktrees/<project>/<queue-item>/`, when the queue item does not already have a valid `worktreePath`; `executionPath` is set to the same path.
- Worktree preparation failures are persisted on the queue item as `lastError` plus a `worktree_prepare_failed` history event instead of silently falling back to the main checkout.
- Review preparation reuses the queue item's existing worktree path when present, giving implementation and review the same thread/worktree context foundation.
- Real runner launch and direct implementation-completion-to-review triggering are wired.
- Runner startup and spawn-failure paths now update the queue-linked agent thread with the actual timestamped durable log path for implementation or review, preserving transcript links across later queue/thread refreshes.
- Queue-linked approval request and resolution events now refresh durable thread approval metadata (`approvalRequestIds` and `pendingApprovalCount`), so approval state can be traced from the task thread record.
- Durable thread records now mirror queue artifact paths (`planPath`, `handoffPath`, `activeHandoffPath`, and `reviewPath`) so queue item artifacts can be traced from the task thread.
- Added non-destructive terminal thread archival: `archive_agent_thread` marks completed, landing, blocked, or unknown records with archive metadata; active thread listing hides archived records, and `list_archived_agent_threads` exposes archived records from the same thread storage root.
- Destructive cleanup of worktrees/logs remains deferred until explicit retention rules exist.
- Added `bun --filter @brain-loop/desktop scheduler:qa` coverage for durable thread metadata and configured execution path/worktree strategy invariants.

## Implementation Steps
- Define an agent thread metadata shape in the Brain contract or a dedicated state file location.
- Add fields for thread ID, queue item ID, project ID/name, worktree path, execution path, implementation status, review status, active runner IDs, log references, and approval references.
- Create a new thread before starting implementation for a queue task.
- Create or select a separate worktree by default for each implementation thread.
- Persist worktree creation failures and fallback behavior without silently running in the main checkout.
- Ensure review dispatch receives and records the same thread ID and worktree path.
- Add helpers for listing recent/active threads for the sidebar.
- Add cleanup and stale-thread handling rules for completed, failed, or abandoned threads. (Non-destructive metadata archival is implemented; worktree/log deletion remains out of scope.)
- Update durable logs/transcripts to include thread ID or durable thread metadata links.

## Affected Files Or Areas
- `apps/desktop/src-tauri/src/brain.rs`
- `apps/desktop/src-tauri/src/runner.rs`
- `apps/desktop/src-tauri/src/pty.rs`
- `apps/desktop/src-tauri/src/state.rs`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/brain-core/src/types.ts`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/terminal-panel.tsx`
- `brain/features/threaded-terminals.md`
- `brain/features/automation-runs.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`
- `brain/api/permissions.md`

## Acceptance Criteria
- Starting an implementation task creates a durable agent thread record.
- Each new implementation task uses a separate worktree by default when worktree creation is possible.
- Review uses the same thread ID and worktree path as the implementation run.
- Thread records can be listed for sidebar rendering.
- Logs, approvals, queue item metadata, and PTY sessions can be traced back to the thread.
- Worktree fallback behavior is explicit and visible.

## Test Plan
- Rust tests for thread metadata create/read/update helpers.
- `cargo check` from `apps/desktop/src-tauri` when Rust/Cargo is available.
- `bun --filter @brain-loop/desktop typecheck`
- Manual smoke test starting two queued tasks and confirming distinct thread/worktree metadata.
- Manual smoke test confirming review links to the implementation thread.

## Brain Update Requirements
- Update `brain/features/threaded-terminals.md`.
- Update `brain/features/automation-runs.md`.
- Update `brain/api/contracts.md`.
- Update `brain/api/endpoints.md`.
- Update `brain/api/permissions.md` if worktree/main-checkout permission warnings change.
- Add ADR if the default worktree/thread storage strategy becomes durable.
- Update `brain/progress.md`.

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
- Worktree creation can fail in repositories without a usable Git state.
- Multiple tasks in the same project must not collide on branch/worktree names.
- Cleanup must not delete user work or unreviewed changes.

## Open Questions
- None for v1. Archived records remain indefinitely and destructive worktree/log cleanup is deferred until an explicit retention policy exists.

## Linked Task
- Task Title: Add Worktree-Backed Agent Threads
- Task File: brain/tasks/roadmap.md
