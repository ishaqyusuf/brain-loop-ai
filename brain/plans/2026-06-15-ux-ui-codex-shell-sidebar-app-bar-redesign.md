# Plan: Simplify Codex Shell Sidebar And App Bar

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
- Intake Item: Remove unnecessary sidebar menus, show only Agents, keep Settings in footer, and match screenshot app-bar framing.

## Goal Or Problem
Make the Brain Loop app frame match the supplied Codex screenshots: a clean dark desktop shell where the left sidebar and top app bar feel like one continuous native frame, not a dashboard with many navigation tabs.

## Current Context
The current `Sidebar` exposes Overview, Projects, Queue, Runs, Logs, Approvals, Scheduler, Threads, and Settings. The current `App` also renders a tab list for the same product areas. The user now wants the visible sidebar simplified to an `Agents` section analogous to the screenshot's `All chats`, with Settings in the footer. Existing feature surfaces still need to remain reachable, but not as a noisy sidebar menu.

Relevant references:

- `brain/features/ui-shell.md`
- `brain/engineering/coding-standards.md`
- `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md`
- Attached screenshots in `brain/intake/2026-06-15-codex-shell-settings-redesign.md`

## Proposed Approach
Refactor the app shell so the sidebar is a clean agent/thread rail, the top app bar starts after the sidebar boundary like the Codex screenshot, and navigation-heavy product tabs are removed from the main visible frame. Keep Settings as a footer action. Preserve access to operational surfaces through the active agent workspace, environment panel, command/action controls, or settings sections rather than side menu clutter.

## Implementation Steps
- Replace the current `navItems` sidebar model with a compact Codex-style sidebar:
  - top window/action zone matching the screenshot density,
  - optional compact utility actions only if needed,
  - a single `Agents` section for agent/thread entries,
  - footer Settings action.
- Remove or hide the current left-sidebar product menu entries: Overview, Projects, Queue, Runs, Logs, Approvals, Scheduler, Threads.
- Remove the main tab bar as the primary navigation affordance; move those surfaces into the active workspace, environment panel, command controls, or settings page as appropriate.
- Ensure the header/app bar visually cuts across from the sidebar boundary and remains aligned in both full-screen and non-full-screen window sizes.
- Keep the central workspace dark, dense, and scroll-stable with no overlapping bottom composer or side panels.
- Preserve status visibility in a compact way, such as small badges, environment panel rows, or footer/status affordances.
- Add responsive behavior for narrower desktop widths: sidebar remains stable, app bar does not overlap content, and footer Settings stays visible.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/brain-loop-logo.tsx`
- `apps/desktop/src/components/shell` if created
- `apps/desktop/src/components/threads` if created
- `apps/desktop/src/styles.css`
- `brain/features/ui-shell.md`
- `brain/product/roadmap.md`
- `brain/progress.md`

## Acceptance Criteria
- Sidebar no longer shows the old product menu list.
- Sidebar has a clean `Agents` section and a footer Settings entry.
- Settings remains reachable from the footer at all supported desktop sizes.
- The top app bar/header aligns with the sidebar boundary and matches the screenshot framing in full-screen and non-full-screen windows.
- Existing product surfaces are still reachable through a deliberate replacement interaction, not lost behind dead code.
- Layout has no overlapping text, composer, sidebar footer, or app-bar controls.
- Manual screenshots are captured or visually checked against the provided references at full-screen and non-full-screen sizes.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check against the supplied screenshots in both full-screen and non-full-screen window states.
- Manual navigation check that Settings, agent/thread entries, and the operational surfaces remain reachable.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/product/roadmap.md` if the shell navigation model changes milestone language.
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
  - Automated screenshot capture was attempted but blocked because Playwright's bundled Chromium is missing and the system Chrome headless process aborts in this environment.
  - `Agents` currently maps to implementation, review, and approvals workstreams until a richer agent/thread model lands.

## Risks / Edge Cases
- Removing visible product navigation can make implemented features hard to find; the replacement access path must be explicit.
- macOS traffic-light/window chrome spacing may differ between full-screen and windowed states.
- TODO: Confirm exact semantics of `Agents` entries.

## Open Questions
- TODO: Should `Agents` list runner types, active automation threads, pinned agents, or all current agent conversations?
- TODO: Should `New chat`, `Search`, `Plugins`, and `Automations` remain as compact utility rows, or should Brain Loop hide them entirely?

## Linked Task
- Task Title: Simplify Codex Shell Sidebar And App Bar
- Task File: brain/tasks/roadmap.md
