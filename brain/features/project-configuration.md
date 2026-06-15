# Feature: Project Configuration

## Purpose

Let users inspect and manage projects registered in the global Brain project manager registry.

## Planned Behavior

- Display registered projects, paths, enabled status, priority, default agent, and intervals.
- Allow supported edits through validated forms and atomic JSON writes.
- Show warnings for missing project paths, disabled projects with active queue items, and invalid runner settings.
- Preserve compatibility with `~/.codex/brain-project-manager/projects.json`.

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
- Summary metrics show enabled, disabled, missing-path, and active-disabled project counts.
- `list_projects` annotates projects with a read-only `pathExists` hint so missing project roots are visible without mutating `projects.json`.
- Disabled projects with active queue items surface warning badges using the current queue list.
- Users can create and edit supported project fields from a sheet with required-field, agent, priority, and interval validation.
- Enable/disable actions require inline confirmation before calling `set_project_enabled`.
- Project registry mutations use Rust-backed atomic writes through `create_project`, `update_project`, and `set_project_enabled`.
