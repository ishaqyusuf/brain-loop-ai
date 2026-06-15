# Roadmap

## Purpose

Tracks planned product milestones.

## Milestones

### Foundation

- Workspace validation baseline.
- Brain core contracts.
- Rust read-only Brain state commands.
- Atomic Brain JSON writes and locks.
- Codex-standard desktop shell using shadcn primitives and Midday-inspired component organization.

### MVP

- Menu bar start/pause controls.
- Project enable/disable configuration.
- Queue summary.
- Run implementation once.
- Run review once.
- Basic run logs.
- Queue dashboard with filters and details.
- Project configuration surface.
- Manual dispatch with auditable output.
- Threaded run UI.
- Embedded terminal per thread.
- Approval cards.
- Notification preferences and transition-based notifications for blocked, submitted, approval-needed, and scheduler/queue-read states.
- Release smoke-test checklist and README usage instructions.

### Next

- Codex-style environment/changes panel.
- Codex-style artifact and edited-file cards.
- Visual QA harness for Codex UI states.
- Durable approval persistence across desktop restarts.
- Native notification plugin integration if WebView notification support is insufficient.
- Runner adapters that request approval before every sensitive live action.
- LaunchAgent helper as a v2 background automation service.

### Release Readiness

- Local smoke-test checklist documented.
- README usage and release instructions documented.
- Production Tauri build verification remains host-dependent on Rust/Cargo, platform signing, and Tauri prerequisites.
