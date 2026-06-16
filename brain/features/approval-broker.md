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
- Approval detail payloads and history separation use shadcn Alert and Separator composition inside approval cards.
- Users can approve, deny, or expire requests from the UI without editing Brain JSON.
- Merge approval requests created after review pass carry command `brain-loop:land-approved-work`; approving that request attempts the guarded landing operation for the linked queue item.
- Approval requests are durably stored in `~/.brain-loop/approvals.json` and survive app restarts.
- Denied or expired requests emit lifecycle events and attempt to move linked queue items to `blocked` with audit history.
- A small set of local sample request buttons is available to exercise command, permission, and destructive approval states until runners create live requests.
- Pending approval requests trigger the approval notification category when notifications are enabled.
- Pending approval requests are tracked by the app shell so the Approval sidebar action and queue-linked thread rows can show a red permission-required flag.
- Queue-linked approval request and resolution events refresh the durable agent thread record with `approvalRequestIds` and `pendingApprovalCount`, allowing approval state to be traced from task thread metadata as well as the live approval list.
- New pending approval requests can play a short deduplicated audible cue when approval notifications and Settings > Permissions & Approvals > Permission-required sound are enabled.
- Opened queue-linked thread views show a destructive permission-required alert with an action that jumps directly to the Approval thread cards.
- Permission-required indicators clear when approval requests resolve because the visible flags derive only from pending request state.
- Approval requests and permission-related planned settings are now reachable from the Codex-style Settings page under `Permissions & Approvals`.
- The fixed Approval sidebar action opens a Codex-like thread surface with the same approval broker cards embedded in the conversation area. Implementation/review run controls are hidden in this approval-focused view.

## Current Limitations

- Runner commands still need to call the approval request API before sensitive actions; this version provides the broker contract and cards.

## UI Pattern

- Approval requests should appear as Codex-style thread cards and, when relevant, as right-panel environment alerts tied to the active run.
- Use shadcn alerts, cards, badges, buttons, dialogs, or sheets depending on urgency and detail depth.
- Approval cards must make the requested action and risk clear without hiding runner-specific details.

## Implementation Plans

- `brain/plans/2026-06-12-feature-approval-broker-cards.md`
- `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md`

## Brain Docs To Keep Updated

- `brain/api/contracts.md`
- `brain/api/permissions.md`
- `brain/decisions/` if the protocol becomes durable
