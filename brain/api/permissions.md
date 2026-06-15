# API Permissions

## Purpose

Tracks permission and capability boundaries.

## Desktop Permissions

The desktop app needs local access to:

- `~/.codex/brain-project-manager`
- registered project paths
- runner executables such as `opencode`, `agy`, and Codex
- local logs and LaunchAgent configuration when enabled

## Planned Permission Surfaces

- Read global Brain settings, projects, queues, locks, and logs.
- Write Brain JSON files through atomic mutation helpers only.
- Launch runner processes from queue item `executionPath`.
- Stream runner stdout/stderr into UI events and durable logs.
- Create and manage PTY sessions for thread terminals.
- Install or remove a user-level LaunchAgent only after explicit user action.
- Surface approval requests before risky runner actions or escalated operations.
- Request WebView notification permission only after explicit user action.

## Approval Broker Surface

- Approval requests are created through explicit Tauri commands and shown in the desktop Approvals tab.
- Requests carry action kind, risk, command, path, queue item, runner, and session context when available.
- Approving a request records an approval event; it does not silently execute additional work by itself.
- Denying or expiring a request emits a resolution event and attempts to block the linked queue item with an audit history entry.
- The approval broker is currently process-local UI state; durable runner persistence should be added before treating approvals as a cross-session security boundary.

## Safety Rules

- Do not silently approve sensitive runner actions.
- Do not launch work for disabled projects.
- Do not ignore queue item `worktreePath` when it is present.
- Do not mutate queue items into unsupported statuses.
- Do not use approval cards to bypass sandbox, filesystem, or OS permission prompts.
- Do not send OS/WebView notifications when the user has disabled the matching category.
