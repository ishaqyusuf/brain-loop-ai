# Plan: Redesign Codex Sidebar And Empty Home Shell

## Type
UX/UI

## Status
Done

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Intake
- Intake File: brain/intake/2026-06-15-capacity-agent-thread-pivot.md
- Intake Item: Fixed Review/Implementation/Approval actions at top, scrollable sidebar below, glass transparent sidebar, no app bar, sidebar toggle, empty centered home state.

## Goal Or Problem
The shell should move closer to Codex. Review, Implementation, and Approval should be fixed top sidebar actions, the thread list should scroll below them, and the main content should be intentionally empty for now with only the app icon and name centered. In non-full-screen mode, the sidebar should feel glass-like and transparent, with no app bar.

## Current Context
The current completed shell has a sidebar agent rail, Settings footer, main app bar on wide screens, workspace content, environment panel, queue table, approval cards, logs, and composer. The user now wants to remove the current main content until the product decides what belongs there, keep the sidebar as the primary navigation surface, and make the shell visually closer to Codex.

## Proposed Approach
Refactor the desktop shell into a headless frame with a glass-like sidebar and a minimal empty home state. Fixed top actions should be button-like natural actions rather than scroll items. The thread list should be below the fixed action area and independently scrollable. Add a sidebar collapse/toggle affordance matching the Codex pattern.

## Implementation Steps
- Replace the current wide app bar with a headless main frame.
- Move Review, Implementation, and Approval into fixed top sidebar actions above the scrollable thread list.
- Keep Settings in the footer unless a later design says otherwise.
- Add a scroll container for agent/thread entries that starts below the fixed actions.
- Add a sidebar toggle icon/control with collapsed and expanded states.
- Design the sidebar with glass-like transparency, blur, and subtle borders for non-full-screen desktop windows.
- Ensure the shell still works in full-screen and non-full-screen window sizes.
- Replace current main workspace content with a centered empty home state showing the app icon and app name only.
- Keep operational pages hidden or deferred until selected thread/action behavior is defined.
- Add visual QA notes or screenshots against the Codex reference.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/brain-loop-logo.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/components/ui/button.tsx`
- `brain/features/ui-shell.md`
- `brain/engineering/coding-standards.md` if shell rules change

## Acceptance Criteria
- The visible shell has no top app bar.
- Review, Implementation, and Approval are fixed top sidebar actions.
- The sidebar thread/agent list scrolls below the fixed top action area.
- The sidebar includes a Codex-like toggle/collapse control.
- Non-full-screen mode has a glass-like transparent sidebar treatment without text overlap.
- The main content area shows only a centered app icon and app name when no thread is selected.
- Existing content-heavy dashboard sections are not shown on the home surface.
- Settings remains reachable.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check in full-screen and non-full-screen window sizes.
- Manual interaction check for sidebar toggle, fixed actions, scroll list, and Settings footer.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/engineering/coding-standards.md` if the headless shell becomes a durable UI rule.
- Update `brain/product/roadmap.md` if visible MVP scope changes.
- Update `brain/progress.md`.

## Implementation Progress

- Replaced the visible dashboard home with a centered Brain Loop icon and app name.
- Removed the workspace top app bar from the active shell surface.
- Added fixed Review, Implementation, and Approval sidebar actions above a scrollable thread list.
- Added a collapsible glass-like sidebar treatment with a Codex-style toggle control.
- Settings remains reachable from the sidebar footer.
- Tightened sidebar typography and spacing to match the compact Codex thread-list scale.
- Removed card-like treatment from the fixed Review, Implementation, and Approval actions; they now render as flat ghost rows with no icons or subtitles.
- Thread rows now render title plus compact elapsed time only, with permission flags as the only exceptional adornment.
- The main shell background now uses the same dark-first `#141414` surface as the root to avoid odd background contrast.
- Completed visual verification with `bun --filter @brain-loop/desktop visual:qa`.

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
- Glass transparency can reduce contrast; text must remain readable.
- Removing the current workspace content could hide important controls unless top actions or settings preserve access.
- Sidebar collapse must not strand users away from Settings or active threads.

## Open Questions
- None for v1. The centered home uses the current Brain Loop logo, and the collapse toggle lives inside the sidebar.

## Linked Task
- Task Title: Redesign Codex Sidebar And Empty Home Shell
- Task File: brain/tasks/roadmap.md
