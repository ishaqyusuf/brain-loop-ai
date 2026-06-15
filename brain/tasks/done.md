# Done

## Purpose

Tracks completed work.

## Completed Tasks

- Initialized Brain Loop project scaffold.
- Established Midday as the primary reference project.
- Created initial Tauri desktop structure.

### Define Brain Core Contracts
- Priority: High
- Description: Shared TypeScript contracts for Brain settings, projects, queue items, histories, locks, logs, agents, priorities, runner metadata, and validation helpers.
- Related Feature: Brain state
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-brain-core-contracts.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Completed Date: 2026-06-12
- Review File: brain/reviews/2026-06-12-define-brain-core-contracts-review-v2.md

### Establish Workspace Validation And UI Foundation
- Priority: High
- Description: Established Midday-style desktop source folders, baseline components, validation documentation, and Rust/Cargo prerequisite reporting.
- Related Feature: Workspace foundation
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-cleanup-workspace-validation-ui-foundation.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Completed Date: 2026-06-12
- Review File: brain/reviews/2026-06-12-establish-workspace-validation-and-ui-foundation-review-v2.md

### Implement Atomic Brain JSON Writes And Locks
- Priority: High
- Description: Added Rust atomic JSON writes, exclusive lock helpers, queue transition validation, mutation command wrappers, and audit-safe timestamp behavior.
- Related Feature: Brain state
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-atomic-brain-json-writes.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Completed Date: 2026-06-12
- Review File: brain/reviews/2026-06-12-implement-atomic-brain-json-writes-and-locks-review-v2.md

### Add Auditable Run Logs And Transcripts
- Priority: Medium
- Description: Persisted runner stdout/stderr transcripts, run metadata, safe log reads, queue-linked log summaries, live log streaming, and durable spawn-failure records.
- Related Feature: Automation runs
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-run-logs-transcripts.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Completed Date: 2026-06-13
- Review File: brain/reviews/2026-06-13-add-auditable-run-logs-and-transcripts-review-v3.md

### Build Codex-Standard Desktop Shell
- Priority: High
- Description: Track Codex-standard retargeted plan in `brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md`.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-build-midday-shadcn-desktop-shell-review-v2.md


### Add Background Scheduler Controls
- Priority: Medium
- Description: Track plan in `brain/plans/2026-06-12-feature-background-scheduler-controls.md`.
- Related Feature: Background scheduler
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-background-scheduler-controls.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Current status: Review requested fixes on 2026-06-12. See brain/reviews/2026-06-12-add-background-scheduler-controls-review.md and active fix handoff brain/handoffs/fixes/2026-06-12-add-background-scheduler-controls-fix-1.md.
- Blockers: Fix requested for app controls, safe tray tick path, paused semantics, disabled-project skipping, durable decision logs, and scheduler docs.

### Add LaunchAgent Helper Support
- Priority: Low
- Description: Track plan in `brain/plans/2026-06-12-feature-launchagent-helper.md`.
- Related Feature: Background scheduler
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-launchagent-helper.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-add-launchagent-helper-support-review-v2.md


### Implement Manual Implementation/Review Dispatch
- Priority: High
- Description: Track plan in `brain/plans/2026-06-12-feature-manual-run-dispatch.md`.
- Related Feature: Automation runs
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-manual-run-dispatch.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12

### Add PTY-Backed Thread Terminals
- Priority: Medium
- Description: Track plan in `brain/plans/2026-06-12-feature-pty-thread-terminals.md`.
- Related Feature: Threaded terminals
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-pty-thread-terminals.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12

### Build Queue Dashboard And Filters
- Priority: High
- Description: Added project/status/agent/priority/stale filtering, queue summary metrics, warning states, complete details metadata, visible error state, and aligned queue status contracts.
- Related Feature: Queue dashboard
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-queue-dashboard-filters.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-build-queue-dashboard-and-filters-review-v2.md

### Build Project Configuration Surface
- Priority: High
- Description: Added project registry table, create/edit sheet, enable/disable confirmation, path and active-queue warnings, and atomic project mutation commands.
- Related Feature: Project configuration
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-project-configuration-surface.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-build-project-configuration-surface-review.md

### Implement Rust Brain State Readers
- Priority: High
- Description: Added read-only Brain state commands and fixed queue reads to report malformed/unreadable files through typed errors while preserving valid items.
- Related Feature: Brain state
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-rust-brain-state-readers.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-implement-rust-brain-state-readers-review-v3.md

### Add Approval Broker And Cards
- Priority: Medium
- Description: Added approval request contracts, process-local approval broker commands/events, desktop approval cards, and queue-blocking denial/expiry handling.
- Related Feature: Approval broker
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-approval-broker-cards.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-add-approval-broker-and-cards-review.md

### Add Notifications, Packaging, And Release Readiness
- Priority: Low
- Description: Added notification preferences and transition-based notifications, documented local usage and release smoke tests, and updated roadmap release status.
- Related Feature: Release readiness
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-notifications-packaging-release.md
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15
- Review File: brain/reviews/2026-06-15-add-notifications-packaging-and-release-readiness-review.md
