# Plan: Add Permission Required Thread Alerts

## Type
UX/UI

## Status
In Progress

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Permission required beep and red flag in thread UI

## Goal Or Problem
Make permission-required states impossible to miss when a runner blocks waiting for user action.

## Current Context
Approval broker plans already cover approval request cards. User specifically wants an audible cue and red flag in the thread UI when permission is required.

## Proposed Approach
Add thread-level permission-required indicators, notification sound behavior, and visible state badges tied to approval requests.

## Implementation Notes

- App-level approval state now tracks pending approval requests from `list_approval_requests` and live approval events.
- The fixed Approval sidebar action and queue-linked thread rows show a compact red flag when pending approval requests exist.
- Opened thread views show a destructive permission-required alert with an `Open approvals` action that jumps to approval cards.
- A short Web Audio cue plays once per new pending approval request when approval notifications and permission-required sound are enabled.
- Settings > Permissions & Approvals includes a real `Permission-required sound` toggle. The toggle is disabled when approval notifications are disabled.
- Red flags clear automatically because UI indicators derive only from pending approval requests; resolved approval events update the tracked request state.

## Implementation Steps
- Define a thread/run state for permission required.
- Add red flag indicator to thread list and thread detail.
- Trigger a short audible cue when a new permission-required event appears, respecting user notification settings.
- Link the indicator to the approval card or request details.
- Add muted/disabled behavior for users who turn off sounds.

## Affected Files Or Areas
- `brain/features/approval-broker.md`
- `brain/features/threaded-terminals.md`
- `brain/features/automation-runs.md`
- `apps/desktop/src/components`
- `apps/desktop/src-tauri/src`
- `packages/desktop-client/src/index.ts`

## Acceptance Criteria
- Thread list and detail visibly show permission-required state.
- New permission-required state can play an audible cue.
- Users can disable or mute the sound.
- Indicator clears when the approval is resolved or run is blocked.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- Manual UI check with stubbed permission-required events.
- Manual sound/mute check.

## Brain Update Requirements
- Update approval, terminal, automation, and notification docs as relevant.
- Update `brain/progress.md`.

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
- Repeated beeps can become annoying; deduplicate repeated events per approval request.
- Sound may require desktop permissions or browser media gesture constraints.

## Open Questions
- None

## Linked Task
- Task Title: Add Permission Required Thread Alerts
- Task File: brain/tasks/roadmap.md
