# Task Roadmap

## Purpose

Tracks task sequencing.

## 0-100 Sequence

1. 0-5%: Establish workspace validation and UI foundation.
2. 5-10%: Define shared Brain core contracts.
3. 10-18%: Implement Rust Brain state readers.
4. 18-25%: Implement atomic Brain JSON writes and locks.
5. 25-32%: Build Codex-standard desktop shell.
6. 32-40%: Build project configuration surface.
7. 40-50%: Build queue dashboard and filters.
8. 50-60%: Implement manual implementation and review dispatch.
9. 60-68%: Add auditable run logs and transcripts.
10. 68-76%: Add PTY-backed thread terminals.
11. 76-84%: Add approval broker and cards.
12. 84-90%: Add background scheduler controls.
13. 90-96%: Add LaunchAgent helper support.
14. 96-100%: Add notifications, packaging, and release readiness.

## UI Task Guidance

All UI-bearing tasks must follow the Codex UI standard in `brain/engineering/coding-standards.md`: thread-oriented layout, left navigation/thread rail, central workspace, optional right environment panel, bottom composer when relevant, compact icon controls, dense artifact/change cards, dark-first styling, and visual verification against the Codex reference standard.

## Tasks

### Define Codex UI Standard And Visual Contract
- Priority: High
- Description: Track plan in `brain/plans/2026-06-13-ux-ui-codex-ui-standard-visual-contract.md`.
- Related Feature: UI shell
- Status: Roadmap
- Plan Status: Proposed
- Plan File: brain/plans/2026-06-13-ux-ui-codex-ui-standard-visual-contract.md
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Created Date: 2026-06-13

### Build Codex-Style Thread Workspace
- Priority: High
- Description: Track plan in `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md`.
- Related Feature: UI shell
- Status: Roadmap
- Plan Status: Proposed
- Plan File: brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Created Date: 2026-06-13

### Build Codex Environment And Changes Panel
- Priority: High
- Description: Track plan in `brain/plans/2026-06-13-ux-ui-codex-environment-changes-panel.md`.
- Related Feature: UI shell
- Status: Roadmap
- Plan Status: Proposed
- Plan File: brain/plans/2026-06-13-ux-ui-codex-environment-changes-panel.md
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Created Date: 2026-06-13

### Build Codex Artifact And Change Summary Cards
- Priority: High
- Description: Track plan in `brain/plans/2026-06-13-ux-ui-codex-artifact-change-cards.md`.
- Related Feature: UI shell
- Status: Roadmap
- Plan Status: Proposed
- Plan File: brain/plans/2026-06-13-ux-ui-codex-artifact-change-cards.md
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Created Date: 2026-06-13

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

### Decide Product Name And Runner Terminology
- Priority: High
- Description: Accepted Brain Loop as the v1 product name and runner as the user-facing term for automation tools, with runner adapter reserved for integration code.
- Related Feature: Product terminology
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-investigation-product-name-runner-terminology.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Move Global State Root Out Of `.codex`
- Priority: High
- Description: Implemented `~/.brain-loop` as the default state root with `settings.toml` and legacy `.codex` migration.
- Related Feature: Brain state
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-refactor-open-source-state-root.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12
- Completed Date: 2026-06-15

### Add Runner And Model Catalog Settings
- Priority: High
- Description: Track plan in `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`.
- Related Feature: Project configuration
- Status: In Progress
- Plan Status: In Progress
- Plan File: brain/plans/2026-06-12-feature-runner-model-catalog-settings.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12

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

### Add Task Sequence And Scheduling Policy
- Priority: High
- Description: Track plan in `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md`.
- Related Feature: Background scheduler
- Status: In Progress
- Plan Status: In Progress
- Plan File: brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12

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

### Add Handoff Runner And Model Recommendations
- Priority: Medium
- Description: Track plan in `brain/plans/2026-06-12-feature-handoff-runner-model-recommendations.md`.
- Related Feature: Automation runs
- Status: In Progress
- Plan Status: In Progress
- Plan File: brain/plans/2026-06-12-feature-handoff-runner-model-recommendations.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12

### Add Permission Required Thread Alerts
- Priority: Medium
- Description: Track plan in `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md`.
- Related Feature: Approval broker
- Status: In Progress
- Plan Status: In Progress
- Plan File: brain/plans/2026-06-12-ux-ui-permission-required-alerts.md
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Created Date: 2026-06-12

### Document Opinionated Open Source Positioning
- Priority: Medium
- Description: Documented Brain Loop's opinionated open-source positioning, local-first architecture, supported runner story, default philosophy, and v1 non-goals.
- Related Feature: Product docs
- Status: Done
- Plan Status: Done
- Plan File: brain/plans/2026-06-12-docs-open-source-opinionated-positioning.md
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
