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

### Move Global State Root To `~/.brain-loop`
- Priority: High
- Description: Moved the Brain Loop state root from `~/.codex/brain-project-manager` to `~/.brain-loop`, changed global settings from JSON to TOML, and added legacy non-worktree state migration.
- Related Feature: Brain state
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-refactor-open-source-state-root.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Completed Date: 2026-06-15

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

### Simplify Codex Shell Sidebar And App Bar
- Priority: High
- Description: Replaced the product-menu sidebar and dashboard tabs with a Codex-style Agents rail, footer Settings entry, aligned app bar, active workspace, environment panel, and bottom composer.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md
- Intake File: brain/intake/2026-06-15-codex-shell-settings-redesign.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Build Codex Settings Surface
- Priority: High
- Description: Added a Codex-style Settings page with Back to app, settings search, grouped category rail, dense settings rows, working controls for implemented settings, and planned states for future settings contracts.
- Related Feature: Settings
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-ux-ui-codex-settings-surface.md
- Intake File: brain/intake/2026-06-15-codex-shell-settings-redesign.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Expand Desktop Shadcn Primitive Baseline
- Priority: High
- Description: Added missing desktop shadcn primitives for current UI refactors, including input, textarea, label, switch, checkbox, form helpers, and empty state.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-cleanup-desktop-shadcn-primitive-baseline.md
- Intake File: brain/intake/2026-06-15-shadcn-ui-standardization.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Refactor Sidebar And Settings To Shadcn Controls
- Priority: High
- Description: Replaced raw sidebar/settings controls with shadcn Button, Input, Switch, Label, and Card compositions while preserving the Codex-style settings layout.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-refactor-sidebar-settings-shadcn-controls.md
- Intake File: brain/intake/2026-06-15-shadcn-ui-standardization.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Refactor Workspace Panels And Composer To Shadcn
- Priority: High
- Description: Standardized workspace composer, logs list, approval details, and environment panel/source surfaces on shadcn Textarea, Button, Empty, Alert, Separator, and Card compositions.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-refactor-workspace-panels-composer-shadcn.md
- Intake File: brain/intake/2026-06-15-shadcn-ui-standardization.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Refactor Tables And Sheets To Shadcn Forms
- Priority: High
- Description: Refactored project sheet fields and queue detail/empty/error surfaces to shadcn form, input, checkbox, card, alert, separator, and empty-state compositions.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-refactor-tables-sheets-shadcn-forms.md
- Intake File: brain/intake/2026-06-15-shadcn-ui-standardization.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Add Structured Agent Message Harness
- Priority: High
- Description: Added Codex app-server structured provider sessions, exact provider-message persistence, harness event JSONL replay, thread provenance labels, a compact Codex harness composer, and provider capability disclosure for Codex/OpenCode/AGY.
- Related Feature: Threaded terminals
- Status: Done
- Plan Status: Done
- Intake File: brain/intake/2026-06-15-structured-agent-message-harnesses.md
- ADR File: brain/decisions/2026-06-15-provider-event-ingestion.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Document Opinionated Open Source Positioning
- Priority: Medium
- Description: Documented Brain Loop as an opinionated local-first open-source control surface, including defaults, extension boundaries, supported runner ids, and v1 non-goals.
- Related Feature: Product docs
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-docs-open-source-opinionated-positioning.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Decide Product Name And Runner Terminology
- Priority: High
- Description: Accepted Brain Loop as the v1 product name, runner as the user-facing term for automation tools, runner adapter for integration code, and provider for lower-level model/API providers.
- Related Feature: Product terminology
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-investigation-product-name-runner-terminology.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Redesign Codex Sidebar And Empty Home Shell
- Priority: High
- Description: Implemented a headless Codex-style shell with fixed flat Review, Implementation, and Approval actions, a scrollable title-only thread list, glass sidebar, sidebar toggle, and centered empty Brain Loop home.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-ux-ui-codex-sidebar-home-pivot.md
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Build Codex Agent Chat Thread Surface
- Priority: High
- Description: Implemented a Codex-like opened-agent chat surface with project title, two stable placeholder icons, persisted timeline messages, transcript/artifact rows, approval sections, and compact status controls.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Add MaxLoop Concurrency Policy Settings
- Priority: High
- Description: Implemented MaxLoop implementation caps for global, runner, project, and runner-project scopes with durable waiting reasons.
- Related Feature: Background scheduler
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Add Token-Saving Automation Triage
- Priority: High
- Description: Implemented local review-first automation triage that inspects queue state before launching token-spending runners and records compact TRIAGE scheduler logs.
- Related Feature: Background scheduler
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-13-feature-token-saving-automation-triage.md
- Intake File: brain/intake/2026-06-13-token-saving-automation-triage.md
- Created Date: 2026-06-13
- Completed Date: 2026-06-15

### Add Thread Storage And Worktree Strategy Settings
- Priority: Medium
- Description: Implemented configurable thread/worktree roots and execution strategies for isolated worktree, main-checkout, and auto fallback execution.
- Related Feature: Threaded terminals
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Add Capacity-Based Agent Pool Scheduler
- Priority: High
- Description: Implemented a running capacity loop that fills available implementation slots from eligible local queue work.
- Related Feature: Background scheduler
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Add Review Agent Pool And Direct Review Handoff
- Priority: High
- Description: Implemented separate review capacity, submitted-item review dispatch, direct implementation-completion review request, and review-capacity waiting reasons.
- Related Feature: Automation runs
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-feature-review-agent-pool-handoff.md
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Add Worktree-Backed Agent Threads
- Priority: High
- Description: Implemented durable queue-linked agent threads, per-task worktree context by default, same-context review reuse, transcript/artifact links, and metadata-only thread archival.
- Related Feature: Threaded terminals
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15

### Add Codex UI Visual QA Harness
- Priority: Medium
- Description: Implemented `bun --filter @brain-loop/desktop visual:qa` as a repeatable Codex UI source-invariant and built-bundle QA gate.
- Related Feature: UI shell
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Created Date: 2026-06-13
- Completed Date: 2026-06-15

### Add Structured Agent Message Harness Foundation
- Priority: High
- Description: Implemented structured provider event contracts, harness capability reporting, durable event ingestion, exact provider-message persistence, and thread/settings provenance labels.
- Related Feature: Automation runs
- Status: Done
- Plan Status: Done
- Intake File: brain/intake/2026-06-15-structured-agent-message-harnesses.md
- Created Date: 2026-06-15
- Completed Date: 2026-06-15
