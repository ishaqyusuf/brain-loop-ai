# Feature: Project Configuration

## Purpose

Let users inspect and manage projects registered in the global Brain project manager registry.

## Planned Behavior

- Display registered projects, paths, enabled status, priority, default agent, and intervals.
- Display and edit each project's approval policy after review passes: manual approval or automatic approval.
- Add projects by selecting a local folder and auto-filling project defaults from the selected checkout.
- Prepare project Brain instructions during creation without disrupting projects that do not already use Brain.
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
- The projects table shows each project's approval policy as `Automatic` or `Manual`.
- Summary metrics show enabled, disabled, missing-path, and active-disabled project counts.
- `list_projects` annotates projects with a read-only `pathExists` hint so missing project roots are visible without mutating `projects.json`.
- Disabled projects with active queue items surface warning badges using the current queue list.
- Users can create and edit supported project fields from a sheet with required-field, agent, priority, and interval validation.
- Add Project opens a native folder selector. After a folder is selected, Brain Loop inspects `package.json`, `Cargo.toml`, or the folder basename to auto-fill project name/id/path while leaving the form editable.
- Creating a project checks for an existing `<project>/brain/` folder. Existing project Brain folders are preserved and recorded as project-local Brain storage.
- When a selected project has no `brain/`, Brain Loop prepares an external Brain folder at `~/.brain-loop/project-brains/<project-id>/brain/` and seeds minimal Brain/task files there.
- Project creation updates `AGENTS.md` or `AGENT.md` and `CLAUDE.md` with an idempotent Brain Loop managed block. Project-local Brain instructions apply to meaningful project tasks; external Brain instructions apply to Brain Loop-managed or brain-related tasks so ordinary user workflows are not forced into Brain.
- Project records can persist optional `brainPath` and `brainStorage`; `list_projects` also returns read-only `brainPathExists`.
- Users can enable automatic approval per project through `autoMergeOnReviewPass`. Existing projects default to manual approval when this field is absent. Manual projects keep review-passed work visible as reviewed/landing work and create approval requests that appear in the Approval sidebar action and approval list.
- Project create/edit fields use shadcn form, label, input, select, checkbox, alert, and sheet composition.
- Enable/disable actions require inline confirmation before calling `set_project_enabled`.
- Project registry mutations use Rust-backed atomic writes through `create_project`, `update_project`, and `set_project_enabled`.
- Project configuration is now also reachable from the Codex-style Settings page under `Projects`, replacing the old top-level product navigation tab as the primary settings entry point.
- Project enabled state is also reachable from the sidebar More menu under `Active projects`, where checkbox rows toggle the same `projects.json` eligibility flag used by the scheduler and keep the menu open for multiple toggles.
- Projects can also be added from the Orchestrator start project dropdown. `Start from scratch` and `Use an existing folder` both use the native folder selector, inspect the selected folder, create a registered project, and select it for the pending orchestration intake.
- Orchestration handoffs can auto-register missing external projects with `enabled: false`, so imported queue items are visible but not runnable until the user explicitly enables the project.
- Settings > Agents now exposes the global runner/model catalog with enabled state, per-runner model lists, per-runner default models, and persisted implementation/review runner-model defaults.
- Runner/model settings are read and written through Rust-backed `get_settings` and `update_settings` commands. Disabled runners cannot be saved as implementation or review defaults.
- Queue items can carry `recommendedModel` and `modelRecommendationReason`; older items without model recommendations are displayed with a fallback derived from the runner/model catalog.
