# ADR: Add Project Landing Policy

## Status
Accepted

## Context
Review-passed queue items move to `landing`, but users need per-project control over what happens next. Some projects should land automatically after review passes, while others should pause and ask the user before merging reviewed work into the registered checkout.

## Decision
Project records may carry:

- `autoMergeOnReviewPass`: when true, Brain Loop attempts guarded landing as soon as a queue item reaches `landing`; when false or absent, Brain Loop creates a pending destructive merge approval request.

Merge approval requests use command:

- `brain-loop:land-approved-work`

Approving that request executes the explicitly approved landing action for the linked queue item. This is the narrow approval-broker exception to the general rule that approvals only record permission and do not perform follow-up work.

Landing approval is intentionally strict:

- Same-checkout work can be approved with `landingStatus: not_needed`.
- Worktree-backed work must be a registered worktree for the same repository as the project checkout.
- Landing uses a per-project landing lock.
- Dirty project-checkout changes are preserved in a pre-landing commit before merging Brain work.
- Dirty implementation work is committed before merging.
- The target branch must be local `main` or `master`.
- Merge conflicts or landing failures block the queue item with landing error metadata.

## Rationale
This keeps approval as the durable queue boundary: review pass alone is not final approval. Projects can opt into unattended landing while existing projects remain conservative because absent policy fields default to merge approval requests.

## Consequences
- Queue items can remain in `landing` while waiting for merge approval.
- Approval cards can trigger landing only for the explicit landing command.
- Auto-merge projects can move from `landing` to `approved` without another scheduler slot.
- Landing failures become visible queue blockers instead of silent partial approvals.

## Related
- `brain/features/automation-runs.md`
- `brain/features/project-configuration.md`
- `brain/features/approval-broker.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`

## Date
2026-06-15
