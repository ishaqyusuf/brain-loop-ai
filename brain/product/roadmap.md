# Roadmap

## Purpose

Tracks planned product milestones.

## Milestones

### Foundation

- Workspace validation baseline.
- Brain core contracts.
- Opinionated open-source positioning and local-first state philosophy.
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
- Codex-style Agents rail with Settings in the footer.
- Headless Codex-style home with fixed Review, Implementation, and Approval sidebar actions above a flat title-only thread list.
- Opened-agent chat surface with project title, stable placeholder actions, persisted timeline messages, artifacts, transcripts, approvals, and compact status controls.
- Codex-style Settings page with grouped categories for general, projects, agents, automation, threads/worktrees, permissions, integrations, environment, and release readiness.

### Next

- Codex-style environment/changes panel.
- Richer edited-file cards and command-input composer semantics.
- Visual QA harness for Codex UI states.
- Persist currently local Settings UI preferences into the durable Brain settings contract where appropriate.
- Durable approval persistence across desktop restarts.
- Native notification plugin integration if WebView notification support is insufficient.
- Runner adapters that request approval before every sensitive live action.
- LaunchAgent helper as a v2 background automation service.

### Release Readiness

- Local smoke-test checklist documented.
- README usage and release instructions documented.
- Production Tauri build verification remains host-dependent on Rust/Cargo, platform signing, and Tauri prerequisites.
