# Plan: Add Approval Broker And Cards

## Type
Feature

## Status
Done

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-project-0-100.md
- Intake Item: Project phase 76-84%

## Goal Or Problem
Create a safe approval surface for runner actions that need user permission, such as escalated commands, destructive operations, auth-sensitive fallbacks, or queue status overrides.

## Current Context
The product principle is to preserve user control through approvals and pause controls. Runner-specific approval support is an open integration detail.

## Proposed Approach
Introduce approval request models, Rust/UI event handling, and Codex-style approval cards that are clearly tied to a queue item, command, runner, and risk.

## Implementation Steps
- Define an approval request contract in Brain core and Rust.
- Add Tauri events for approval requested, approved, denied, expired, and resolved.
- Build approval cards with shadcn `Alert`, `Button`, `Badge`, `Dialog` or `Sheet` where appropriate, styled as compact Codex thread cards or right-panel alerts.
- Add UI controls to approve/deny and show history.
- Integrate with manual dispatch and terminal sessions without auto-approving sensitive actions.

## Affected Files Or Areas
- `packages/brain-core/src/index.ts`
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/approval-broker.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`

## Acceptance Criteria
- Approval requests are visible, auditable, and tied to a specific run context.
- Users can approve or deny without editing JSON files.
- Denied approvals stop or block the requesting action cleanly.
- UI distinguishes command approval, permission approval, and destructive-action approval.
- Approval cards fit the Codex-standard timeline and environment panel without overlapping other controls.

## Test Plan
- `bun run typecheck`
- `cargo check` from `apps/desktop/src-tauri`
- Manual approval flow with stubbed approval requests

## Brain Update Requirements
- Update `brain/features/approval-broker.md`.
- Update `brain/api/contracts.md` and `brain/api/permissions.md`.
- Add ADR if the approval protocol becomes a durable runner integration contract.
- Update `brain/progress.md` after implementation.

## Lower-Agent Readiness
- Implementation scope is clear: Yes
- File boundaries are clear: Yes
- Acceptance criteria are observable: Yes
- Required checks are listed: Yes
- Brain update requirements are listed: Yes
- Ready for handoff: Yes

## Completion Report Requirements
Lower agent must report:
- Changed files
- Checks run
- Brain docs updated
- Unresolved issues
- Any skipped acceptance criteria

## Risks / Edge Cases
- Different runners may expose approval requests differently; normalize without hiding runner-specific details.

## Open Questions
- None for initial broker. Runner-specific adapters may add follow-up plans.

## Linked Task
- Task Title: Add Approval Broker And Cards
- Task File: brain/tasks/in-progress.md
