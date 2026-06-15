# Plan: Add Runner And Model Catalog Settings

## Type
Feature

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Configure model list for each app; default review app and model

## Goal Or Problem
Allow users to configure available automation runners and their supported model lists, including default implementation and review choices.

## Current Context
Existing docs mention runners for opencode, `agy`, and Codex review. The user also mentioned Claude and Antigravity. Settings currently do not model runner/model catalogs or defaults.

## Proposed Approach
Add a settings contract and settings UI for runner catalog entries, model lists, default implementation runner/model, and default review runner/model.

## Implementation Steps
- Use the terminology chosen by the product name/terminology plan.
- Define settings shape for runners, supported models, enabled state, default model, and role defaults.
- Add project-level override support if it fits this plan; otherwise link to MaxLoop/project settings.
- Build Codex-standard settings UI for editing runner/model lists, using shadcn forms and Midday-style organization where helpful.
- Validate that handoff and queue code can read these defaults later.

## Affected Files Or Areas
- `brain/features/project-configuration.md`
- `brain/features/background-scheduler.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`
- `apps/desktop/src/components`
- `apps/desktop/src-tauri/src`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- Users can see and edit runner/model catalogs.
- Default review runner/model and implementation runner/model are persisted.
- Disabled runners cannot be selected as defaults.
- Settings UI follows Codex visual density, shadcn form composition, and Midday settings organization.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri`
- Manual settings edit smoke test with sample runner/model data.

## Brain Update Requirements
- Update project configuration, scheduler, contracts, and endpoint docs.
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
- Different runners may expose model names differently.
- User-provided model names should not be overvalidated.

## Open Questions
- TODO: Final replacement term for "runner" if terminology plan chooses another word.

## Linked Task
- Task Title: Add Runner And Model Catalog Settings
- Task File: brain/tasks/roadmap.md
