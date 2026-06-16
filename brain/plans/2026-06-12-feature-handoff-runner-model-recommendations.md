# Plan: Add Handoff Runner And Model Recommendations

## Type
Feature

## Status
In Progress

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Handoff should suggest app and model

## Goal Or Problem
Extend handoffs and queue items so each implementation packet recommends both a runner and a model.

## Current Context
Brain handoff currently recommends exactly one agent such as `open-code` or `antigravity`. User wants the handoff to suggest both the automation tool and model. The app now has runner/model catalog settings that can provide fallback model recommendations for older queue items.

## Proposed Approach
Update the handoff template, queue item contract, planner guidance, and settings integration so each handoff includes recommended runner and recommended model.

## Implementation Steps
- Use final terminology from the naming plan.
- Add `recommendedModel` and model recommendation reason fields to the queue contract. (Implemented as optional `recommendedModel` and `modelRecommendationReason` fields.)
- Update handoff template sections for runner/model recommendation. (Started with `brain/templates/handoff-runner-model-recommendation.md`.)
- Teach planning/handoff generation to select defaults from runner/model settings. (Started in app queue reads: missing `recommendedModel` is derived from runner/model settings for display.)
- Preserve compatibility with queue items that only have `recommendedAgent`. (Implemented through optional fields and read-side fallback.)

## Affected Files Or Areas
- `brain/api/contracts.md`
- `brain/features/automation-runs.md`
- `brain/features/project-configuration.md`
- `brain/handoffs/ready` template behavior
- `packages/brain-core/src/index.ts`
- handoff generation scripts or skills if they live in repo

## Acceptance Criteria
- New handoffs include runner/tool and model recommendation. (Template guidance added; external skill/generator updates may still be needed.)
- Queue items can store recommended model while remaining backward-compatible. (Implemented.)
- Default review runner/model is used when creating review handoffs. (Review launch already uses configured default review runner/model; explicit review handoff generation remains external.)
- Docs avoid the ambiguous term "app" after terminology decision. (Partially deferred to product terminology plan.)

## Current Implementation Notes

- `QueueItem` accepts optional `recommendedModel` and `modelRecommendationReason`.
- `list_queue` derives missing recommendation fields from `settings.runnerCatalog` and implementation defaults for display without rewriting older queue files.
- Implementation launch prefers queue `recommendedModel` over the runner/model settings default.
- Implementation and review prompts include recommended runner/model metadata.
- Queue details show recommended runner/model and model recommendation reason.
- In-repo handoff generation was not found; a reusable Brain template section was added for future producers.

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
