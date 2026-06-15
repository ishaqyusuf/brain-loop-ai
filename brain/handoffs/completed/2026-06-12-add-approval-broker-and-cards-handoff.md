# Brain Handoff: Add Approval Broker And Cards

## Status
Completed

## Source Plan
brain/plans/2026-06-12-feature-approval-broker-cards.md

## Task
- Task Title: Add Approval Broker And Cards
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: Approval UX, card states, and sensitive user flows are design-sensitive.

## Goal
Create a safe approval surface for runner actions that need user permission, such as escalated commands, destructive operations, auth-sensitive fallbacks, or queue status overrides.

## Context To Read First
- brain/plans/2026-06-12-feature-approval-broker-cards.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Define an approval request contract in Brain core and Rust.
2. Add Tauri events for approval requested, approved, denied, expired, and resolved.
3. Build approval cards with shadcn `Alert`, `Button`, `Badge`, `Dialog` or `Sheet` where appropriate.
4. Add UI controls to approve/deny and show history.
5. Integrate with manual dispatch and terminal sessions without auto-approving sensitive actions.

## Acceptance Criteria
- Approval requests are visible, auditable, and tied to a specific run context.
- Users can approve or deny without editing JSON files.
- Denied approvals stop or block the requesting action cleanly.
- UI distinguishes command approval, permission approval, and destructive-action approval.

## Files Or Areas Likely Involved
- `packages/brain-core/src/index.ts`
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`
- `apps/desktop/src/components`
- `brain/features/approval-broker.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun run typecheck`
- `cargo check` from `apps/desktop/src-tauri`
- Manual approval flow with stubbed approval requests

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-approval-broker-and-cards.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/features/approval-broker.md`.
- Update `brain/api/contracts.md` and `brain/api/permissions.md`.
- Add ADR if the approval protocol becomes a durable runner integration contract.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `packages/brain-core/src/types.ts`
  - `packages/brain-core/src/index.ts`
  - `packages/desktop-client/src/index.ts`
  - `apps/desktop/src-tauri/src/approval.rs`
  - `apps/desktop/src-tauri/src/lib.rs`
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/approval-panel.tsx`
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Checks run:
  - Targeted source and documentation inspection.
  - Required `bun run typecheck`, `cargo check`, and manual approval UI verification were not run under fast monorepo command discipline.
- Brain docs updated:
  - `brain/features/approval-broker.md`
  - `brain/api/contracts.md`
  - `brain/api/endpoints.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Unresolved issues:
  - Approval requests are currently process-local desktop state, not durable cross-session records.
  - Runner adapters still need to call the approval broker before sensitive live actions.
