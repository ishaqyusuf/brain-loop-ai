# Plan: Build Codex-Style Thread Workspace

## Type
UX/UI

## Status
Proposed

## Created Date
2026-06-13

## Last Updated
2026-06-13

## Intake
- Intake File: brain/intake/2026-06-13-codex-ui-standardization.md
- Intake Item: UI should follow Codex standard.

## Goal Or Problem
Make the primary Brain Loop surface feel like Codex desktop: thread-oriented, operational, dense, and centered on the active automation conversation.

## Current Context
The existing shell plan provides a generic desktop console. The Codex reference adds a specific structure: left navigation/thread list, active thread header, central message timeline, bottom composer, and compact tool controls.

## Proposed Approach
Build or refine the desktop shell around a Codex-style thread workspace while keeping Brain Loop domains visible through navigation and thread metadata.

## Implementation Steps
- Add a left rail with primary actions, search, plugin/automation-style entries where relevant, pinned threads, all threads, and settings.
- Add an active thread header with title, overflow actions, and compact environment/source controls.
- Add a central scrollable timeline for agent messages, user prompts, status updates, file cards, and review summaries.
- Add a bottom composer with attachment/action affordances, approval mode selector, model/runner selector if available, voice/send-style controls where applicable.
- Ensure empty, loading, blocked, and permission-needed states follow the Codex UI standard.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/shell`
- `apps/desktop/src/components/threads`
- `apps/desktop/src/components/navigation`
- `apps/desktop/src/styles.css`
- `brain/features/ui-shell.md`
- `brain/features/threaded-terminals.md`

## Acceptance Criteria
- The first screen is a usable thread workspace, not a marketing or generic dashboard screen.
- Left navigation, thread header, timeline, and composer are visible and stable at desktop sizes.
- Thread list selection states, pinned/all thread groupings, and settings access match Codex-standard density.
- Composer controls do not overlap or resize unexpectedly.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check against the Codex reference screenshot at desktop and narrow widths.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/features/threaded-terminals.md` if thread metadata or terminal placement changes.
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

## Risks / Edge Cases
- The workspace can become visually crowded; prioritize scan-friendly density and stable scroll regions.

## Open Questions
- None

## Linked Task
- Task Title: Build Codex-Style Thread Workspace
- Task File: brain/tasks/roadmap.md
