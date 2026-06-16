# Brain Loop

Opinionated local macOS control center for the Brain automation loop.

## Purpose

Brain Loop is a local-first Tauri desktop app that controls implementation and review automation over the global Brain project manager state. It is intended to become an inspectable, forkable open-source control surface for queue-driven AI work.

Brain Loop is intentionally narrow: it favors Codex-like threads, local state, explicit approvals, durable logs, worktree-backed runs, and configurable runner/model defaults over a generic hosted automation dashboard.

## Architecture

- `apps/desktop`: Tauri desktop app with a React control console.
- `packages/brain-core`: shared TypeScript schemas and constants for Brain state.
- `packages/desktop-client`: typed frontend wrappers for Tauri commands and events.
- `brain/`: project memory, architecture notes, tasks, and AI workflow.

## Brain State

The desktop app should treat this location as the durable source of truth:

```text
~/.brain-loop/
  settings.toml
  projects.json
  queues/
    handoffs/
    archive/
  threads/
  worktrees/
  locks/
  logs/
```

Legacy state under `~/.codex/brain-project-manager` is copied into `~/.brain-loop` when the new root is first prepared. Existing Git worktrees are not moved automatically.

## Opinionated Defaults

- Queue items are the automation contract; runners should not invent hidden work outside Brain state.
- Implementation and review use separate capacity pools and fill available slots from local queue state.
- Per-task worktrees are the default execution strategy, with explicit settings for main-checkout or auto fallback behavior.
- Runner output is always auditable through durable logs and thread metadata.
- Sensitive or destructive actions should go through the approval broker.
- Supported runner ids are currently `open-code`, `antigravity`, and `codex`; model lists and role defaults are configurable in settings.

## Terminology

- **Brain Loop** is the product name.
- **Runner** is the user-facing term for automation tools that perform implementation or review work, such as OpenCode, Antigravity, Codex, and future Claude support.
- **Runner adapter** means the integration code that invokes a runner, maps settings to command arguments, captures logs, and participates in approval flow.
- **Provider** is reserved for a lower-level model or API provider behind a runner.

## Not V1 Goals

- Hosted state sync, organization accounts, or cloud orchestration.
- Generic workflow automation unrelated to Brain queue items.
- Silent destructive runner actions.
- Automatic deletion of worktrees, logs, queue items, or artifacts.
- Treating a successful review process exit as approval unless the review workflow writes a supported queue transition.

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
2. Use the sidebar Review, Implementation, and Approval actions to inspect automation state.
3. Open agent threads to inspect queue state, worktree context, artifacts, approvals, and transcripts.
4. Use Settings to configure projects, runner/model defaults, capacity, scheduling, worktree behavior, notifications, and release helpers.
5. Use Approvals to inspect, approve, deny, or expire sensitive runner requests.
6. Use linked transcripts and terminal surfaces for local debugging.

## Notifications

The Overview tab includes notification preferences for blocked items, submitted/review-ready work, approval requests, and scheduler/queue read errors. Notifications use the WebView `Notification` API when permission is granted and fall back to the in-app last-notification display when permission is unavailable or denied.

## Release Verification

Run these checks before packaging a release:

```bash
bun run typecheck
bun --filter @brain-loop/desktop build
bun --filter @brain-loop/desktop visual:qa
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
