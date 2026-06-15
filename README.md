# Brain Loop

Local macOS control center for the Brain automation loop.

## Purpose

Brain Loop is a local Tauri desktop app that controls implementation and review automation over the global Brain project manager state.

## Architecture

- `apps/desktop`: Tauri desktop app with a React control console.
- `packages/brain-core`: shared TypeScript schemas and constants for Brain state.
- `packages/desktop-client`: typed frontend wrappers for Tauri commands and events.
- `brain/`: project memory, architecture notes, tasks, and AI workflow.

## Brain State

The desktop app should treat this location as the durable source of truth:

```text
~/.codex/brain-project-manager/
  settings.json
  projects.json
  queues/
    handoffs/
    archive/
  locks/
  logs/
```

## Prerequisites

- **Bun**: Required for package management and typescript workspace commands.
- **Rust / Cargo**: Required for building and checking the Tauri backend (`apps/desktop/src-tauri`). If Cargo is missing from your host system, Rust-related build/validation commands (like `cargo check`) will be blocked.

## Development

```bash
bun install
bun --filter @brain-loop/desktop tauri:dev
```

## Local Usage

1. Start the desktop app with `bun --filter @brain-loop/desktop tauri:dev`.
2. Use the Overview tab to start or pause automation and trigger one implementation or review tick.
3. Use Projects to add, edit, enable, or disable project roots.
4. Use Queue to filter queue items, inspect handoff paths, review paths, runner/session metadata, and read errors.
5. Use Approvals to inspect, approve, deny, or expire sensitive runner requests.
6. Use Run Logs and Terminal for local transcript and PTY-backed debugging.

## Notifications

The Overview tab includes notification preferences for blocked items, submitted/review-ready work, approval requests, and scheduler/queue read errors. Notifications use the WebView `Notification` API when permission is granted and fall back to the in-app last-notification display when permission is unavailable or denied.

## Release Verification

Run these checks before packaging a release:

```bash
bun run typecheck
bun --filter @brain-loop/desktop build
bun --filter @brain-loop/desktop tauri:build
```

Smoke-test checklist:

- Empty Brain state shows idle overview and empty queue states.
- Sample queue items render with project/status/agent/priority/stale filters.
- Missing runner or spawn failure blocks the queue item and writes a durable log/metadata record.
- Successful runner output appears in Run Logs.
- Submitted work appears as review-ready and can be reviewed.
- Approval requests appear in Approvals and can be approved, denied, or expired.
- Scheduler pause prevents manual automation ticks from running.
- Notification categories can be toggled and do not repeat on unchanged polling snapshots.
- LaunchAgent controls remain explicit and reversible; v1 automation relies on tray persistence.

Current packaging blockers:

- Rust/Cargo and platform signing/notarization must be available on the release host.
- This repository snapshot has not run the production Tauri build in the fast-command pass.
