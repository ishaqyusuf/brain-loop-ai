# Brain Intake: Codex UI Standardization

## Status
Proposed

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Raw Input
User requested that the UI should follow the Codex standard, with the supplied Codex desktop screenshot as the visual target, and asked to update all tasks accordingly while adding necessary missing tasks.

## Generated Plans
- [ ] Define Codex UI Standard And Visual Contract - `brain/plans/2026-06-13-ux-ui-codex-ui-standard-visual-contract.md` - Status: Proposed
- [ ] Build Codex-Style Thread Workspace - `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md` - Status: Proposed
- [ ] Build Codex Environment And Changes Panel - `brain/plans/2026-06-13-ux-ui-codex-environment-changes-panel.md` - Status: Proposed
- [ ] Build Codex Artifact And Change Summary Cards - `brain/plans/2026-06-13-ux-ui-codex-artifact-change-cards.md` - Status: Proposed
- [x] Add Codex UI Visual QA Harness - `brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md` - Status: Done

## Recommended Execution Order
1. Define Codex UI Standard And Visual Contract - establishes the shared UI rules every other UI task must follow.
2. Build Codex-Style Thread Workspace - sets the primary shell structure and navigation model.
3. Build Codex Environment And Changes Panel - adds the right-side operational context shown in the reference.
4. Build Codex Artifact And Change Summary Cards - makes Brain edits and generated files readable inside threads.
5. Add Codex UI Visual QA Harness - locks the standard with screenshots and regression checks after the core surfaces exist.

## Agent Recommendations
- Define Codex UI Standard And Visual Contract: open-code - mostly documentation, design tokens, and component rule updates.
- Build Codex-Style Thread Workspace: antigravity - visual layout fidelity and interaction quality matter.
- Build Codex Environment And Changes Panel: antigravity - requires careful desktop composition and state presentation.
- Build Codex Artifact And Change Summary Cards: antigravity - requires visual polish for repeated cards and review actions.
- Add Codex UI Visual QA Harness: open-code - test harness and scripted verification are implementation-heavy.

## Merged Items
- Updated the existing desktop shell direction instead of creating a duplicate shell task, because `brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md` already owns the base shell.

## Duplicate Or Existing Items
- Base shell work already exists as `brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md`; it was retargeted to the Codex-standard shell language.

## Needs Clarification
- None

## Skipped Items
- Direct app implementation was skipped because `brain-intake` is planning-only.

## Approval Notes
- None

## Handoff Notes
- Use `brain-batch-handoff` to convert approved plans into handoffs and queue items.
