# Feature: Project Configuration

## Purpose

Let users inspect and manage projects registered in the global Brain project manager registry.

## Planned Behavior

- Display registered projects, paths, enabled status, priority, default agent, and intervals.
- Display and edit each project's landing policy after review passes.
- Allow supported edits through validated forms and atomic JSON writes.
- Show warnings for missing project paths, disabled projects with active queue items, and invalid runner settings.
- Preserve compatibility with `~/.brain-loop/projects.json`.

## UI Pattern

- Present project settings inside the Codex-standard desktop shell, with compact table rows, status badges, tooltips, and disabled-state explanations.
- Use a Midday-style table folder for maintainability: `components/tables/projects`.
- Use shadcn forms in sheets for create/edit flows.
- Use confirmations for risky enable/disable changes.

## Implementation Plans

- `brain/plans/2026-06-12-feature-project-configuration-surface.md`

## Brain Docs To Keep Updated

- `brain/api/endpoints.md`
- `brain/api/contracts.md`
- `brain/api/permissions.md`

## Implemented Behavior

- The desktop app includes a `Projects` tab backed by `list_projects`.
- A compact projects table shows project name/id, enabled state, default agent, priority, review and implementation intervals, project path, and warning badges.
- The projects table shows each project's landing policy as `Auto merge` or `Request merge`.
- Summary metrics show enabled, disabled, missing-path, and active-disabled project counts.
- `list_projects` annotates projects with a read-only `pathExists` hint so missing project roots are visible without mutating `projects.json`.
- Disabled projects with active queue items surface warning badges using the current queue list.
- Users can create and edit supported project fields from a sheet with required-field, agent, priority, and interval validation.
- Users can enable `autoMergeOnReviewPass` per project. Existing projects default to merge approval requests when this field is absent.
- Project create/edit fields use shadcn form, label, input, select, checkbox, alert, and sheet composition.
- Enable/disable actions require inline confirmation before calling `set_project_enabled`.
- Project registry mutations use Rust-backed atomic writes through `create_project`, `update_project`, and `set_project_enabled`.
- Project configuration is now also reachable from the Codex-style Settings page under `Projects`, replacing the old top-level product navigation tab as the primary settings entry point.
- Settings > Agents now exposes the global runner/model catalog with enabled state, per-runner model lists, per-runner default models, and persisted implementation/review runner-model defaults.
- Runner/model settings are read and written through Rust-backed `get_settings` and `update_settings` commands. Disabled runners cannot be saved as implementation or review defaults.
- Queue items can carry `recommendedModel` and `modelRecommendationReason`; older items without model recommendations are displayed with a fallback derived from the runner/model catalog.
