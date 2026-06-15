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
- **Frontend (React)**: Uses `xterm.js` and `@xterm/addon-fit` to render a fully-featured terminal inside the desktop app. The UI listens to `pty-data` events and sends keyboard/resize events back to Rust via `spawn_pty`, `write_pty`, `resize_pty`, and `close_pty`. Terminals can be tied explicitly to queue items and execution paths.

## Architecture Notes

- Rust owns PTY/session lifecycle and durable output logging.
- React owns terminal rendering.
- Session metadata returns stable session IDs, linking back to queue item IDs and log paths.
- A durable ADR is required if a new PTY or terminal dependency becomes an architectural commitment.

## Implementation Plans

- `brain/plans/2026-06-12-feature-pty-thread-terminals.md`

## Brain Docs To Keep Updated

- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/decisions/`
