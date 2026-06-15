# Brain Intake: Loop Product Settings And Scheduling Refinements

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Raw Input
User wants a new Brain intake for product and orchestration refinements: consider the names Loop, O-Loop, and C-Loop; support task sequencing where tasks can depend on other tasks; allow optional worktree or master execution; add settings UI; support MaxLoop configuration globally, per runner, per project, and per runner per project; configure model lists for each runner; handoffs should suggest runner and model; find a better term than "app" for tools such as opencode, Claude, Codex, and Antigravity; plan for an opinionated open-source product; move source/state folder away from `.codex`; keep threads like Codex under a user documents location; set default review runner/model; support fix-before-new-task or FIFO scheduling; add permission-required beep and red flag in thread UI.

## Generated Plans
- [ ] Decide Product Name And Runner Terminology - `brain/plans/2026-06-12-investigation-product-name-runner-terminology.md` - Status: Proposed
- [ ] Move Global State Root Out Of `.codex` - `brain/plans/2026-06-12-refactor-open-source-state-root.md` - Status: Proposed
- [ ] Add Runner And Model Catalog Settings - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md` - Status: Proposed
- [ ] Add MaxLoop Concurrency Policy Settings - `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md` - Status: Proposed
- [ ] Add Task Sequence And Scheduling Policy - `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md` - Status: Proposed
- [ ] Add Thread Storage And Worktree Strategy Settings - `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md` - Status: Proposed
- [ ] Add Handoff Runner And Model Recommendations - `brain/plans/2026-06-12-feature-handoff-runner-model-recommendations.md` - Status: Proposed
- [ ] Add Permission Required Thread Alerts - `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md` - Status: Proposed
- [ ] Document Opinionated Open Source Positioning - `brain/plans/2026-06-12-docs-open-source-opinionated-positioning.md` - Status: Proposed

## Recommended Execution Order
1. Decide Product Name And Runner Terminology - product language should settle before broad settings and docs copy.
2. Document Opinionated Open Source Positioning - open-source posture influences config defaults and state-root expectations.
3. Move Global State Root Out Of `.codex` - state path migration affects contracts, settings, docs, and desktop permissions.
4. Add Runner And Model Catalog Settings - runner/model vocabulary and defaults are prerequisites for handoff recommendation.
5. Add MaxLoop Concurrency Policy Settings - scheduler and dispatch need concurrency hierarchy before execution changes.
6. Add Task Sequence And Scheduling Policy - dependency and FIFO/fix-first rules depend on queue/concurrency semantics.
7. Add Thread Storage And Worktree Strategy Settings - thread/worktree paths should align with state-root and execution policy.
8. Add Handoff Runner And Model Recommendations - depends on runner/model catalog and terminology.
9. Add Permission Required Thread Alerts - builds on approval/thread concepts and notification behavior.

## Agent Recommendations
- Decide Product Name And Runner Terminology: open-code - documentation and ADR-style decision work.
- Move Global State Root Out Of `.codex`: open-code - contract, migration, and filesystem-boundary work.
- Add Runner And Model Catalog Settings: antigravity - settings UI plus contract wiring.
- Add MaxLoop Concurrency Policy Settings: open-code - scheduler policy and settings contract work.
- Add Task Sequence And Scheduling Policy: open-code - queue dependency and scheduling semantics.
- Add Thread Storage And Worktree Strategy Settings: open-code - filesystem, execution strategy, and thread metadata work.
- Add Handoff Runner And Model Recommendations: open-code - handoff/queue contract and planner changes.
- Add Permission Required Thread Alerts: antigravity - visible thread UI, warning states, and sound UX.
- Document Opinionated Open Source Positioning: open-code - docs, README, and product decision work.

## Merged Items
- General "Settings" and "Settings UI" were merged into runner/model catalog, MaxLoop concurrency, thread/worktree strategy, and state-root settings plans.
- "Default review app and model" was merged into runner/model catalog settings.
- "app sound off, find better name" was merged into product name and runner terminology.

## Duplicate Or Existing Items
- Existing `Add Background Scheduler Controls` covers basic scheduler start/pause; this intake adds dependency, FIFO/fix-first, and MaxLoop policy refinements.
- Existing `Build Project Configuration Surface` covers project registry UI; this intake adds global/per-runner/per-project override semantics.
- Existing `Add Approval Broker And Cards` covers approvals; this intake adds thread-level red flag and audible notification behavior.
- Existing `Add PTY-Backed Thread Terminals` covers embedded terminals; this intake adds Codex-like thread storage and permission indicator requirements.

## Needs Clarification
- TODO: Choose final product name from Loop, O-Loop, C-Loop, or another candidate.
- TODO: Choose final replacement term for "app"; candidates include runner, provider, adapter, engine, or executor.
- TODO: Choose exact open-source default state root and migration policy.

## Skipped Items
- None.

## Approval Notes
- None. Plans are awaiting user approval.

## Handoff Notes
- Use `brain-batch-handoff` to convert approved plans into handoffs and queue items.
