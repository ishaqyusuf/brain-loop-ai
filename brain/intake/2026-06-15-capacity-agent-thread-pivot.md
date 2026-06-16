# Brain Intake: Capacity Agent Thread Pivot

## Status
Proposed

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Raw Input
User wants to pivot Brain Loop away from cron-style implementation/review runs every X minutes. The app should continuously check for queued implementation or review work, start work only when the relevant agent pool has capacity, and respect separate maximum counts for implementation agents and review agents. Each implementation task should spawn a new Codex-like agent thread and use a separate worktree by default. When implementation completes, review should be requested directly; if review capacity is available, review starts immediately, otherwise it waits until a review agent slot is available. Review should use the same work thread/worktree context. The shell should become more Codex-like: Review, Implementation, and Approval are fixed top sidebar actions; the scrollable thread list starts below them; the main content area is empty for now except a centered app icon and app name; non-full-screen mode should have a glass-like transparent sidebar, no app bar, natural sidebar action buttons, and a Codex-like sidebar toggle icon. Opening an agent thread should show a polished chat surface with project name in the title, two placeholder top-right icons, and a pixel-perfect Codex-like chat component.

## Generated Plans
- [x] Add Capacity-Based Agent Pool Scheduler - `brain/plans/2026-06-15-feature-capacity-agent-pool-scheduler.md` - Status: Done
- [x] Add Review Agent Pool And Direct Review Handoff - `brain/plans/2026-06-15-feature-review-agent-pool-handoff.md` - Status: Done
- [x] Add Worktree-Backed Agent Threads - `brain/plans/2026-06-15-feature-worktree-backed-agent-threads.md` - Status: Done
- [x] Redesign Codex Sidebar And Empty Home Shell - `brain/plans/2026-06-15-ux-ui-codex-sidebar-home-pivot.md` - Status: Done
- [x] Build Codex Agent Chat Thread Surface - `brain/plans/2026-06-15-ux-ui-codex-agent-chat-thread.md` - Status: Done

## Recommended Execution Order
1. Add Capacity-Based Agent Pool Scheduler - establishes the core execution model and replaces interval-driven thinking with capacity-driven agent pools.
2. Add Worktree-Backed Agent Threads - gives every running task a durable thread/worktree identity for scheduler and UI surfaces.
3. Add Review Agent Pool And Direct Review Handoff - depends on thread/worktree identity so review can reuse the implementation context.
4. Redesign Codex Sidebar And Empty Home Shell - updates navigation around the new thread model while keeping the undecided home surface intentionally empty.
5. Build Codex Agent Chat Thread Surface - depends on agent thread metadata and the sidebar selection model.

## Agent Recommendations
- Add Capacity-Based Agent Pool Scheduler: open-code - scheduler, settings contract, and Rust process orchestration work.
- Add Review Agent Pool And Direct Review Handoff: open-code - queue transitions, review capacity, and runner handoff semantics.
- Add Worktree-Backed Agent Threads: open-code - filesystem, worktree, metadata, and Brain contract changes.
- Redesign Codex Sidebar And Empty Home Shell: antigravity - visual fidelity, sidebar interaction, and Codex-like desktop composition.
- Build Codex Agent Chat Thread Surface: antigravity - pixel-level chat UI, title bar, messages, and thread detail polish.

## Merged Items
- Cron replacement, repeated queue checks, maximum implementation agents, and "available agent block" behavior were merged into `Add Capacity-Based Agent Pool Scheduler`.
- Maximum review agents, direct review after implementation, and review waiting for capacity were merged into `Add Review Agent Pool And Direct Review Handoff`.
- New task spawns a new agent thread, separate worktree by default, and review uses the same work thread/worktree were merged into `Add Worktree-Backed Agent Threads`.
- Top fixed sidebar actions, scrollable thread list below them, glass sidebar, headless app frame, and sidebar toggle were merged into `Redesign Codex Sidebar And Empty Home Shell`.
- Opened agent view, project title, placeholder icons, and Codex-like chat component were merged into `Build Codex Agent Chat Thread Surface`.

## Duplicate Or Existing Items
- Existing `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md` covers richer MaxLoop policy; the new capacity scheduler plan narrows the immediate pivot to global implementation and review pool slots.
- Existing `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md` covers configurable storage/worktree strategy; the new agent thread plan narrows the immediate default to one worktree-backed thread per task.
- Existing `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md` covers broad thread workspace UI; the new chat thread plan narrows the opened-agent detail surface.
- Existing `brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md` is done; the new sidebar/home plan supersedes parts of that completed shell behavior for the next pivot.

## Needs Clarification
- Resolved: setting names are `maxImplementationAgents` and `maxReviewAgents`.
- Resolved for v1: the capacity dispatcher uses configurable polling via `capacityPollIntervalSeconds`; file watching/events can be a future optimization.
- TODO: Confirm whether "Approval" top action should show pending approvals only or all approval history.
- Resolved for v1: opened agent threads include stable placeholder top-right icons until product actions are decided.
- Resolved for v1: the centered empty home uses the current Brain Loop logo.

## Skipped Items
- None.

## Approval Notes
- None. Plans are awaiting user approval.

## Handoff Notes
- Use `brain-batch-handoff` to convert approved plans into handoffs and queue items.
