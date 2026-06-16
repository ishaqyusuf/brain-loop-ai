# Feature: Threaded Terminals

## Purpose

Provide embedded terminal sessions for automation threads and runner processes.

## Planned Behavior

- Open terminal-backed sessions linked to queue items.
- Stream PTY output to the UI and durable logs.
- Send input and resize events to active sessions.
- Clean up sessions and processes safely.
- Preserve execution path and worktree context.

## Implementation Details
- **Backend (Rust/Tauri)**: Uses the `portable-pty` crate to spawn real pseudo-terminals (PTYs). These PTYs run commands and handle I/O correctly, supporting features like colored output and process signaling. The PTY instances are held in a managed Tauri `PtyState`. When spawned, output is also durably logged to the global `logs/runs` directory.
- **Agent threads**: The app now maintains initial durable agent thread metadata in the configured `settings.threadStorageRoot` (default `~/.brain-loop/threads`). Thread records link queue item ID, project ID/path, optional worktree/execution paths, execution strategy, plan/handoff/review artifact paths, implementation/review status, runner IDs, provider message source, provider session/thread IDs when available, real durable log references, approval request IDs, pending approval count, persisted timeline messages, timestamps, and last error. The current scheduler prepares or updates records for eligible enabled implementation and review items.
- `bun --filter @brain-loop/desktop scheduler:qa` verifies that queue tasks have durable thread metadata and configured worktree/main-checkout/auto execution path handling.
- **Persisted thread messages**: Queue state changes, waiting reasons, linked artifacts, linked implementation/review transcripts, and linked approval state changes append compact `AgentThreadMessage` records into the durable thread JSON. The message timeline is intentionally small and auditable; full runner output remains in durable run logs.
- **Exact provider messages**: Codex harness sessions run through a local `codex app-server --stdio` process owned by Rust. The adapter starts provider threads over newline-delimited JSON-RPC, sends turns with `turn/start`, and translates completed provider message notifications into exact provider-sourced user/agent/approval messages in `AgentThread.messages`. These messages carry metadata such as `provider`, `model`, `turnId`, `sourceEventId`, and `isExactProviderMessage=true`, and thread records set `messageSource: structured-provider-events`. Event replay is idempotent by `sourceEventId`. Transcript parsing is not the canonical exact-message path.
- **Transcript links**: `runner::run_process` updates the queue-linked agent thread with the actual timestamped run log path when a process starts or when spawn failure metadata is written. Later queue-to-thread refreshes preserve those implementation/review log paths while the corresponding runner IDs remain unchanged.
- **Thread transcript UI**: Opening a durable agent thread in the Codex-style chat surface renders persisted timeline messages when present and falls back to a live summary for older records. Exact provider messages receive an explicit provenance marker and preserve provider line breaks, while transcript-backed threads remain labeled as transcript-backed. Queue-linked threads include a compact Codex harness composer that starts an exact-message provider session or sends follow-up turns to an active/recovered runtime. The view also shows implementation/review transcript cards when log paths are available. Selecting a card reads the safe log filename through `read_log_file` and renders a bounded transcript preview inside the thread.
- **Thread artifact UI**: Opening a durable agent thread shows compact artifact cards for linked plan, active handoff, and review artifact paths when available.
- **Permission-required state**: Pending approval requests linked to a queue item surface as red flags in the thread list and as a destructive permission-required alert in the opened thread. Queue-linked approval request and resolution events also refresh `AgentThread.approvalRequestIds` and `AgentThread.pendingApprovalCount`, so approval metadata can be traced from the durable thread record. The alert links to the Approval thread cards so the user can resolve the request.
- **Thread archival**: Completed, landing, blocked, or unknown terminal thread records can be archived with non-destructive metadata (`archivedAt`, `archivedBy`, and optional `archiveReason`). Active thread listing hides archived records, while `list_archived_agent_threads` can read them from the same configured thread storage root. Archiving does not delete worktrees, logs, queue items, or artifacts.
- **Execution strategy**: `settings.executionStrategy` controls where agents run. `worktree` prepares or reuses isolated per-task Git worktrees and fails loudly when preparation fails. `main-checkout` skips worktree creation, clears `worktreePath`, and sets `executionPath` to the registered project checkout. `auto` attempts the isolated worktree first and falls back to the project checkout when worktree preparation fails but the project path exists.
- **Task worktrees**: Eligible implementation and review ticks prepare a per-task Git worktree under the configured `settings.worktreeStorageRoot` (default `~/.brain-loop/worktrees/<project>/<queue-item>/`) when the queue item does not already have a valid `worktreePath` and the strategy requires isolation. The queue item's `executionPath` and `executionStrategy` are persisted. Worktree failures are persisted as `lastError` and a `worktree_prepare_failed` history event when the selected strategy is `worktree`.
- **Frontend (React)**: Uses `xterm.js` and `@xterm/addon-fit` to render a fully-featured terminal inside the desktop app. The UI listens to `pty-data` events and sends keyboard/resize events back to Rust via `spawn_pty`, `write_pty`, `resize_pty`, and `close_pty`. Terminals can be tied explicitly to queue items and execution paths.

## Architecture Notes

- Rust owns PTY/session lifecycle and durable output logging.
- Rust owns durable agent thread record creation/listing and task worktree preparation under the configured settings roots.
- Rust owns structured harness event ingestion, Codex app-server runtime lifecycle, normalized event append logs under `~/.brain-loop/harness/events/`, replay recovery, and normalized exact-message writes to durable thread JSON.
- Rust owns non-destructive agent thread archival metadata; worktree and log cleanup remain explicit future operations.
- React owns terminal rendering.
- Session metadata returns stable session IDs, linking back to queue item IDs and log paths. Agent thread metadata provides the sidebar/list identity for queue-backed work.
- A durable ADR is required if a new PTY or terminal dependency becomes an architectural commitment.

## Implementation Plans

- `brain/plans/2026-06-12-feature-pty-thread-terminals.md`
- `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md`
- `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md`

## Brain Docs To Keep Updated

- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/decisions/`
