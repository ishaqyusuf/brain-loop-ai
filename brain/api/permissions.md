# API Permissions

## Purpose

Tracks permission and capability boundaries.

## Desktop Permissions

The desktop app needs local access to:

- `~/.brain-loop`
- registered project paths
- runner executables such as `opencode`, `agy`, and Codex
- local logs and LaunchAgent configuration when enabled

## Planned Permission Surfaces

- Read global Brain settings, projects, queues, locks, and logs.
- Write Brain state files through atomic mutation helpers only.
- Launch runner processes from queue item `executionPath`.
- Create per-task Git worktrees under the configured `settings.worktreeStorageRoot` for registered project paths.
- Launch agents from the registered project checkout when `settings.executionStrategy` is explicitly `main-checkout`, or when `auto` fallback is selected and isolated worktree preparation fails.
- Stream runner stdout/stderr into UI events and durable logs.
- Create and manage PTY sessions for thread terminals.
- Archive terminal agent thread records by writing metadata only; archival must not delete worktrees, logs, queue items, or artifacts.
- Land review-passed work when project policy allows it by running guarded local Git operations against registered project checkouts and Brain worktrees.
- Install or remove a user-level LaunchAgent only after explicit user action.
- Surface approval requests before risky runner actions or escalated operations.
- Request WebView notification permission only after explicit user action.
- Play local permission-required audio cues only when the approval notification category and permission sound setting are enabled.

## Approval Broker Surface

- Approval requests are created through explicit Tauri commands and shown in the desktop Approvals tab.
- Requests carry action kind, risk, command, path, queue item, runner, and session context when available.
- Requests are durably stored in `~/.brain-loop/approvals.json` using atomic JSON writes so pending approvals survive app restarts.
- Approving a request records an approval event; it does not silently execute additional work by itself.
- Exception: merge approval requests with command `brain-loop:land-approved-work` execute the explicitly approved landing action for the linked queue item after the approval is recorded.
- Denying or expiring a request emits a resolution event and attempts to block the linked queue item with an audit history entry.

## Safety Rules

- Do not silently approve sensitive runner actions.
- Do not launch work for disabled projects.
- Do not ignore queue item `worktreePath` when it is present.
- Do not silently fall back to the main project checkout when per-task worktree preparation fails under the `worktree` strategy; persist the failure on the queue item.
- Warn clearly in the UI when `main-checkout` execution is selected because agents can collide with local user edits.
- Do not mutate queue items into unsupported statuses.
- Do not mark review-passed work `approved` until landing succeeds or landing is explicitly not needed because implementation already ran in the registered checkout.
- Do not auto-land work for projects with `autoMergeOnReviewPass` disabled; create a merge approval request instead.
- Do not land work for disabled projects.
- Do not silently approve merge conflicts, missing worktrees, unrelated repositories, or missing target branches; block the queue item with landing error metadata.
- Do not use approval cards to bypass sandbox, filesystem, or OS permission prompts.
- Do not send OS/WebView notifications when the user has disabled the matching category.
- Do not play permission-required sounds when the user has disabled approval notifications or muted permission sounds.
- Do not delete per-task worktrees or logs as part of agent thread archival.
