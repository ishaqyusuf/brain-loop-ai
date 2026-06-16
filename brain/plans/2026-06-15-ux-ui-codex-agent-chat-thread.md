# Plan: Build Codex Agent Chat Thread Surface

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
- Intake Item: When an agent thread is opened, show a polished Codex-like chat with project name in the title, two top-right icons, and a pixel-perfect chat component.

## Goal Or Problem
Opening an implementation, review, or approval thread should feel like opening a Codex chat. The user should see the project name in the thread title, lightweight top-right actions, and a polished message timeline instead of a dashboard panel.

## Current Context
The current app workspace shows operational cards for queue, approvals, logs, terminal, status, composer, and environment. Existing Codex UI plans cover broad thread workspace, environment panels, and artifact cards, but the user now wants a concrete opened-agent chat component as the next visible surface.

## Proposed Approach
Build a reusable agent thread chat view that can render implementation, review, approval, and system messages from thread metadata and run logs. Keep top-right icons as placeholders until product decisions land, but make their layout stable. The initial component can render structured mock/derived messages from existing queue/log state while deeper message persistence lands.

## Implementation Steps
- Create an agent thread detail component under a focused thread or chat component folder.
- Display a compact header with thread title, project name, queue item status, and two placeholder icon buttons at the top right.
- Render a Codex-like message timeline with user/system/agent message variants.
- Support message blocks for implementation output, review output, approval requests, queue state changes, log links, and worktree metadata.
- Add an empty or loading state for threads that have metadata but no messages yet.
- Add a bottom composer only if it is useful for the selected thread; otherwise leave it disabled or hidden with an explicit future state.
- Ensure long paths, log output, and status text wrap without overlapping.
- Use shadcn primitives and local Codex styling patterns rather than raw custom controls.
- Add responsive behavior for sidebar-collapsed and narrow desktop widths.
- Add visual verification notes or screenshots.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/src/components/sidebar.tsx`
- `apps/desktop/src/components/terminal-panel.tsx`
- `apps/desktop/src/components/approval-panel.tsx`
- `apps/desktop/src/components/logs-panel.tsx`
- `apps/desktop/src/components/threads/`
- `apps/desktop/src/components/ui/`
- `packages/brain-core/src/types.ts` if thread/message types are added
- `packages/desktop-client/src/index.ts` if thread read commands are added
- `brain/features/ui-shell.md`
- `brain/features/threaded-terminals.md`
- `brain/features/automation-runs.md`
- `brain/features/approval-broker.md`

## Acceptance Criteria
- Selecting an agent/thread opens a chat-like detail view rather than the generic dashboard content.
- The top title includes the project name when available.
- Two top-right icon buttons are present, stable, accessible, and visually aligned.
- The chat timeline supports distinct message styles for agent, user/system, approval, and artifact/log messages.
- Thread output and metadata are readable without text overlap.
- The view matches the Codex desktop density and calm dark styling.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop build`
- Manual visual check for selected implementation, review, and approval thread states.
- Manual narrow-width check with sidebar expanded and collapsed.

## Brain Update Requirements
- Update `brain/features/ui-shell.md`.
- Update `brain/features/threaded-terminals.md`.
- Update `brain/features/automation-runs.md`.
- Update `brain/features/approval-broker.md` if approval cards move into chat.
- Update `brain/progress.md`.

## Implementation Progress

- Selecting a fixed agent action or queue-derived thread now opens a chat-like detail surface.
- The opened thread header includes the selected agent/thread name and project scope when available.
- Two stable top-right icon buttons are present as placeholders.
- The thread view renders Codex-like message blocks and compact metrics for queued, review, blocked, and scheduler state.
- Durable thread selections now render transcript cards for implementation and review log paths when available; selecting a transcript loads a bounded safe-log preview into the chat surface.
- Durable thread selections now render compact artifact cards for linked plan, active handoff, and review artifact paths when available.
- Opening the fixed Approval action now renders approval cards inside the Codex-like chat surface, using the existing broker panel for pending/resolved requests and sample approval stubs.
- Durable agent thread records now include compact persisted timeline messages for queue state changes, waiting reasons, artifact links, transcript links, and approval-state changes; the chat surface renders these messages before falling back to live summary blocks for older thread records.
- Flattened chat blocks, artifact rows, transcript rows, metrics, and the embedded Approval surface so opened threads no longer read as nested cards.
- Approval requests now render as flat approval sections inside the chat surface instead of bordered cards.
- Completed visual verification with `bun --filter @brain-loop/desktop visual:qa`.
- Future richer free-form/user-authored chat persistence remains a follow-up after command input semantics are defined, not a blocker for the opened-agent read surface.

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
- Pixel-perfect Codex matching depends on visual checks; automated browser checks have previously been blocked in this environment.
- Message persistence may lag the UI; unsupported message types must render as explicit unavailable states rather than blanks.
- Placeholder icons should not imply finished actions.

## Open Questions
- None for the v1 read surface. The two top-right icons remain stable placeholders until product actions are decided, and the composer remains deferred until command input semantics are defined.

## Linked Task
- Task Title: Build Codex Agent Chat Thread Surface
- Task File: brain/tasks/roadmap.md
