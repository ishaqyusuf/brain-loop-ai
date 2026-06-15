# Feature: Approval Broker

## Purpose

Preserve user control over sensitive automation actions by surfacing approval requests in the desktop app.

## Planned Behavior

- Show approval requests tied to a queue item, runner, command, path, risk, and session.
- Let users approve, deny, or inspect details.
- Record approval outcomes in run history or logs.
- Block or stop actions cleanly when approval is denied or expires.

## Implemented Behavior

- The desktop app includes an Approvals tab with approval cards grouped by pending and resolved state.
- Approval cards distinguish command, permission, and destructive-action requests.
- Each card shows risk, description, command, path, queue item, project, runner, session, and request history when present.
- Users can approve, deny, or expire requests from the UI without editing Brain JSON.
- Denied or expired requests emit lifecycle events and attempt to move linked queue items to `blocked` with audit history.
- A small set of local sample request buttons is available to exercise command, permission, and destructive approval states until runners create live requests.
- Pending approval requests trigger the approval notification category when notifications are enabled.

## Current Limitations

- Approval requests are process-local desktop state and are not yet persisted across app restarts.
- Runner commands still need to call the approval request API before sensitive actions; this version provides the broker contract and cards.

## UI Pattern

- Approval requests should appear as Codex-style thread cards and, when relevant, as right-panel environment alerts tied to the active run.
- Use shadcn alerts, cards, badges, buttons, dialogs, or sheets depending on urgency and detail depth.
- Approval cards must make the requested action and risk clear without hiding runner-specific details.

## Implementation Plans

- `brain/plans/2026-06-12-feature-approval-broker-cards.md`

## Brain Docs To Keep Updated

- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/decisions/` if the protocol becomes durable
