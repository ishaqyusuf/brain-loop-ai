# Plan: Build Codex Settings Surface

## Type
UX/UI

## Status
Done

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-15-codex-shell-settings-redesign.md
- Intake Item: Build the settings page with necessary settings features discussed, using the attached settings UI as sample.

## Goal Or Problem
Build a proper Codex-style Settings page for Brain Loop so core configuration is not scattered across dashboard tabs. The page should resemble the supplied settings screenshot: left settings navigation, searchable settings, sectioned content, dense rows, toggles, selects, and clear permission/configuration copy.

## Current Context
Brain Loop currently exposes several configuration controls inline in the main app, including Projects, LaunchAgent, notifications, scheduler controls, and approval behavior. Existing proposed plans also define settings domains for runner/model catalogs, MaxLoop concurrency, task scheduling policy, thread/worktree strategy, permission-required alerts, state root, and terminology. The user wants these necessary settings represented in a dedicated Settings page.

Relevant existing plans:

- `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
- `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md`
- `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md`
- `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md`
- `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md`
- `brain/plans/2026-06-12-feature-launchagent-helper.md`
- `brain/plans/2026-06-12-feature-project-configuration-surface.md`
- `brain/plans/2026-06-12-feature-notifications-packaging-release.md`

## Proposed Approach
Create a Settings route/page entered from the sidebar footer. The page should use the supplied screenshot as the visual pattern: a left settings rail with grouped categories and a central settings pane with compact sections. Start with implemented controls where possible, and use explicit disabled or coming-soon states for settings whose backend contracts are covered by existing proposed plans but not yet implemented.

## Implementation Steps
- Add a Settings mode/page reachable from the sidebar footer and a `Back to app` affordance.
- Add a settings search field that filters or highlights settings sections if practical; otherwise scope it to visible category labels for v1.
- Add settings groups patterned after the screenshot, adapted to Brain Loop:
  - General: app mode, default open destination, language/TODO, show in menu bar, notification preferences.
  - Projects: registered project list entry point, project defaults, enabled/disabled behavior.
  - Agents: runner/model catalog, default implementation agent/model, default review agent/model.
  - Automation: scheduler state, implementation/review intervals, MaxLoop/concurrency, scheduling policy.
  - Threads And Worktrees: thread storage root, execution strategy, worktree/main checkout behavior.
  - Permissions And Approvals: default permissions, auto-review/escalation behavior, approval-required states, notification sound/TODO.
  - Integrations: LaunchAgent helper, browser/computer-use style future integrations/TODO.
  - Git And Environment: state root, branch/worktree display defaults, commit/push readiness/TODO.
- Reuse existing components where suitable: `ProjectTable`, notification preferences logic, LaunchAgent controls, approval controls.
- For settings that are not yet backed by a Tauri command or schema, render disabled rows with explicit "Not configured yet" or "Planned" state rather than pretending they work.
- Keep the settings page dark, dense, and Codex-like: no nested cards, stable row heights, clear toggles/selects, and no text overlap.
- Update or create settings-related docs to show which sections are implemented versus planned.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/settings`
- `apps/desktop/src/components/tables/projects/project-table.tsx`
- `apps/desktop/src/lib/notifications.ts`
- `packages/brain-core/src/types.ts` if new settings types are added
- `packages/desktop-client/src/index.ts` if new settings commands are added
- `apps/desktop/src-tauri/src` if new settings read/write commands are added
- `brain/features/ui-shell.md`
- `brain/features/project-configuration.md`
- `brain/features/background-scheduler.md`
- `brain/features/approval-broker.md`
- `brain/api/contracts.md`
- `brain/api/endpoints.md`
- `brain/api/permissions.md`
- `brain/progress.md`

## Acceptance Criteria
- Settings opens from the sidebar footer and includes a `Back to app` path.
- Settings page visually matches the supplied Codex settings sample: left category rail, search field, central heading, dense grouped settings rows, toggles/selects where appropriate.
- Implemented settings are editable or navigable from the Settings page.
- Planned settings are clearly marked as planned/disabled and link back to the relevant Brain plan when useful.
- Necessary discussed settings are represented: project configuration, runner/model defaults, MaxLoop/concurrency, scheduling policy, thread/worktree strategy, permissions/approvals, notifications, LaunchAgent, and release/environment basics.
- Settings text and controls do not overlap at full-screen or non-full-screen desktop sizes.
- Settings changes use existing validated Tauri commands where available and do not mutate Brain JSON ad hoc.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check against the supplied Settings screenshot.
- Manual settings navigation check for each category.
- Manual mutation check for implemented controls: notification preferences, project settings entry point, LaunchAgent actions, scheduler-related settings if writable.
- Verify planned/disabled rows cannot be mistaken for working controls.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update relevant feature docs when settings controls move or become editable.
- Update `brain/api/contracts.md`, `brain/api/endpoints.md`, and `brain/api/permissions.md` if new settings read/write commands or permission surfaces are added.
- Update `brain/progress.md` after implementation.

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

## Completion Notes

- Changed files:
  - `apps/desktop/src/app.tsx`
  - `apps/desktop/src/components/settings/settings-page.tsx`
  - `apps/desktop/src/components/sidebar.tsx`
  - `brain/features/ui-shell.md`
  - `brain/product/roadmap.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Checks run:
  - `bun --filter @brain-loop/desktop typecheck`
  - `bun --filter @brain-loop/desktop build`
  - `git diff --check`
- Brain docs updated:
  - `brain/features/ui-shell.md`
  - `brain/product/roadmap.md`
  - `brain/tasks/roadmap.md`
  - `brain/tasks/done.md`
  - `brain/progress.md`
- Unresolved issues:
  - Settings rows for runner/model catalog, MaxLoop, scheduling policy, thread storage, permission sounds, and environment defaults are represented as planned/disabled until their backing contracts are implemented.
  - Automated screenshot capture was attempted but blocked because Playwright's bundled Chromium is missing and the system Chrome headless process aborts in this environment.

## Risks / Edge Cases
- This page can become too large if every planned backend setting is implemented at once; lower agents should prefer a complete settings shell with working existing controls and explicit disabled states for future settings.
- Settings copy must not imply unsupported integrations are ready.
- New settings persistence must preserve the global Brain project manager JSON contract.

## Open Questions
- TODO: Confirm final category labels if the product terminology plan chooses names other than `Agents`, `Threads`, or `Worktrees`.
- TODO: Confirm whether settings search must search setting descriptions in v1 or only category titles.

## Linked Task
- Task Title: Build Codex Settings Surface
- Task File: brain/tasks/roadmap.md
