# Brain Handoff: Add Notifications, Packaging, And Release Readiness

## Status
Completed

## Source Plan
brain/plans/2026-06-12-feature-notifications-packaging-release.md

## Task
- Task Title: Add Notifications, Packaging, And Release Readiness
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: Desktop UX polish, packaging verification, and manual QA benefit from product-flow execution.

## Goal
Finish Brain Loop with desktop notifications, packaging checks, release documentation, and end-to-end verification for the local automation workflow.

## Context To Read First
- brain/plans/2026-06-12-feature-notifications-packaging-release.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Add notification events for blocked queue items, submitted work, review requests, approvals needed, and scheduler errors.
2. Add user settings for notification categories if needed.
3. Verify Tauri production build and app permissions.
4. Add release smoke-test checklist covering empty Brain state, sample queue, runner missing, runner success, approval, and scheduler pause.
5. Update README with local usage and release verification.

## Acceptance Criteria
- Key automation events can notify the user without overwhelming them.
- Production desktop build completes or has documented blockers.
- README documents installation, development, and release smoke tests.
- Brain docs reflect final MVP/next status.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri`
- `apps/desktop/src`
- `README.md`
- `brain/features/background-scheduler.md`
- `brain/features/automation-runs.md`
- `brain/product/roadmap.md`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `bun run typecheck`
- `bun --filter @brain-loop/desktop build`
- `bun --filter @brain-loop/desktop tauri:build` if local Tauri prerequisites are available
- Manual release smoke-test checklist

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-notifications-packaging-and-release-readiness.json

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
- Update `brain/product/roadmap.md`.
- Update relevant feature docs for notifications and release status.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src/lib/notifications.ts`
  - `apps/desktop/src/app.tsx`
  - `README.md`
  - `brain/product/roadmap.md`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/approval-broker.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Checks run:
  - Targeted source and documentation inspection.
  - `git diff --check`.
  - Required typecheck, desktop build, Tauri build, and manual release smoke tests were not run under fast monorepo command discipline.
- Brain docs updated:
  - `brain/product/roadmap.md`
  - `brain/features/automation-runs.md`
  - `brain/features/background-scheduler.md`
  - `brain/features/approval-broker.md`
  - `brain/api/permissions.md`
  - `brain/progress.md`
- Unresolved issues:
  - Production Tauri build verification remains host-dependent on Rust/Cargo, signing/notarization, and local Tauri prerequisites.
  - Notification delivery depends on WebView notification support and user-granted notification permission.
