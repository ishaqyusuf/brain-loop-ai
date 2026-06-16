# Plan: Add Runner And Model Catalog Settings

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
- Intake Item: Configure model list for each app; default review app and model

## Goal Or Problem
Allow users to configure available automation runners and their supported model lists, including default implementation and review choices.

## Current Context
Existing docs mention runners for opencode, `agy`, and Codex review. The user also mentioned Claude and Antigravity. Settings now model a first persisted runner/model catalog and role defaults for implementation and review.

## Proposed Approach
Add a settings contract and settings UI for runner catalog entries, model lists, default implementation runner/model, and default review runner/model.

## Implementation Steps
- Use the terminology chosen by the product name/terminology plan.
- Define settings shape for runners, supported models, enabled state, default model, and role defaults. (Started: `runnerCatalog`, `defaultImplementationRunner`, `defaultImplementationModel`, `defaultReviewRunner`, and `defaultReviewModel` are now in the shared settings contract. Runner entries now also carry optional `kind`, `providerId`, `apiStyle`, and `apiKeyEnv` metadata for direct model providers.)
- Add project-level override support if it fits this plan; otherwise link to MaxLoop/project settings.
- Build Codex-standard settings UI for editing runner/model lists, using shadcn forms and Midday-style organization where helpful. (Started: Settings > Agents now edits the catalog and defaults through persisted Tauri settings commands.)
- Validate that handoff and queue code can read these defaults later. (Started: implementation and review runner launch specs now resolve configured role/default models.)

## Affected Files Or Areas
- `brain/features/project-configuration.md`
- `brain/features/background-scheduler.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`
- `apps/desktop/src/components`
- `apps/desktop/src-tauri/src`
- `packages/brain-core/src/index.ts`

## Acceptance Criteria
- Users can see and edit runner/model catalogs. (Implemented for the global catalog.)
- Default review runner/model and implementation runner/model are persisted. (Implemented globally.)
- Disabled runners cannot be selected as defaults. (Implemented in UI and backend validation.)
- Settings UI follows Codex visual density, shadcn form composition, and Midday settings organization. (Implemented for the current global catalog controls.)

## Current Implementation Notes

- `get_settings` returns defaults when `~/.brain-loop/settings.toml` is missing and normalizes older settings files that do not yet contain runner catalog fields.
- `update_settings` validates positive intervals/capacity, unique supported runner ids, non-empty model lists, default models belonging to their runner, and enabled role-default runners before atomically writing `~/.brain-loop/settings.toml`.
- Implementation launch specs use the configured model for the queue item's runner.
- Review launch specs use the configured default review runner/model and still reuse the queue-linked worktree context.
- The global catalog now includes disabled direct-provider entries for DeepSeek (`direct-deepseek`, `deepseek-v4-pro`/`deepseek-v4-flash`, `DEEPSEEK_API_KEY`) and Gemini (`direct-gemini`, `gemini-3.5-flash`/`gemini-3.1-pro`/`gemini-3-flash`, `GEMINI_API_KEY`). These are settings-visible contract entries; dispatch support requires the direct Brain Loop tool-loop runtime follow-up.
- Brain Loop now exposes the planned direct tool-loop contract through `list_direct_model_runtime_contract`, including direct providers, request shapes, tool schemas, event kinds, and approval-required tools. `preview_direct_model_provider_request` builds DeepSeek/Gemini request envelopes without sending them, `preview_direct_model_stream_events` maps raw DeepSeek/Gemini stream chunks into normalized direct turn events, `preview_direct_model_harness_events` converts those turn events into existing harness event records without writing them, `record_direct_model_harness_events` explicitly persists supplied direct events through the existing harness ingestion path, `execute_direct_model_tool` runs bounded read/search/finish tools while returning approval-required results for mutating tools, and `request_direct_model_tool_approval` creates Brain Loop approvals for direct `apply_patch`/`run_command` requests. Settings > Agents shows the tool/event/request-shape summary for direct providers, but dispatch still returns the explicit pending-runtime error.
- Project-level runner/model overrides remain linked to the MaxLoop/project settings follow-up rather than implemented in this slice.

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
- None. ADR `brain/decisions/2026-06-15-product-name-runner-terminology.md` accepts `runner` as the user-facing automation-tool term.

## Linked Task
- Task Title: Add Runner And Model Catalog Settings
- Task File: brain/tasks/roadmap.md
