# Plan: Add Handoff Runner And Model Recommendations

## Type
Feature

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Handoff should suggest app and model

## Goal Or Problem
Extend handoffs and queue items so each implementation packet recommends both a runner and a model.

## Current Context
Brain handoff currently recommends exactly one agent such as `open-code` or `antigravity`. User wants the handoff to suggest both the automation tool and model.

## Proposed Approach
Update the handoff template, queue item contract, planner guidance, and settings integration so each handoff includes recommended runner and recommended model.

## Implementation Steps
- Use final terminology from the naming plan.
- Add `recommendedModel` and model recommendation reason fields to the queue contract.
- Update handoff template sections for runner/model recommendation.
- Teach planning/handoff generation to select defaults from runner/model settings.
- Preserve compatibility with queue items that only have `recommendedAgent`.

## Affected Files Or Areas
- `brain/api/contracts.md`
- `brain/features/automation-runs.md`
- `brain/features/project-configuration.md`
- `brain/handoffs/ready` template behavior
- `packages/brain-core/src/index.ts`
- handoff generation scripts or skills if they live in repo

## Acceptance Criteria
- New handoffs include runner/tool and model recommendation.
- Queue items can store recommended model while remaining backward-compatible.
- Default review runner/model is used when creating review handoffs.
- Docs avoid the ambiguous term "app" after terminology decision.

## Test Plan
- Contract/schema tests if implemented.
- Generate a sample handoff and verify runner/model fields.
- `bun run typecheck`

## Brain Update Requirements
- Update API contracts and relevant feature docs.
- Add ADR if queue item schema changes durably.
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
- Skills outside this repo may also need updates.
- Existing queue items must continue to work without model fields.

## Open Questions
- TODO: Final model field names.

## Linked Task
- Task Title: Add Handoff Runner And Model Recommendations
- Task File: brain/tasks/roadmap.md
