# Plan: Orchestrator Chat UI Redesign

## Type
UX/UI

## Status
In Progress

## Created Date
2026-06-18

## Last Updated
2026-06-18

## Intake
- Intake File: brain/intake/2026-06-18-orchestrator-chat-ui-redesign.md
- Intake Item: Redesign orchestrator chat UI, shrink ugly dropdowns, make project default ghost variant, and polish the surface.

## Goal Or Problem
The Orchestrator chat/start UI feels oversized and visually unfinished, especially around the project/model/workspace dropdown controls. The project selector should use the default ghost-button treatment rather than a filled pill, and the whole orchestration chat surface should match the dense, calm Codex desktop standard.

## Current Context
Brain Loop uses a Codex-standard desktop UI: dark-first, thread-oriented, dense, restrained, compact controls, and no overlapping text or unstable composer layout.

Relevant Brain references:
- `brain/engineering/coding-standards.md`
- `brain/features/ui-shell.md`
- `brain/features/orchestration.md`

Current likely implementation area:
- `apps/desktop/src/app.tsx` contains `OrchestratorStart`, `OrchestratorModelDropdown`, `ProjectDropdown`, and `OrchestrationThreadView`.
- `apps/desktop/scripts/codex-visual-qa.mjs` already has source-level assertions for the Orchestrator project dropdown.

## Proposed Approach
Polish the existing Orchestrator UI in place without changing orchestration storage, runner execution, handoff creation, or queue contracts. Make the project trigger use ghost styling by default, compress dropdown triggers and menu rows, simplify visual weight, and ensure the start composer and opened orchestration thread controls align with the rest of the Codex-like shell.

## Implementation Steps
- Audit `OrchestratorStart`, `ProjectDropdown`, `OrchestratorModelDropdown`, and `OrchestrationThreadView` for oversized heights, filled backgrounds, excessive widths, and inconsistent control variants.
- Change the project dropdown trigger so both title and composer/project contexts default to ghost-style chrome, with subtle hover/focus states and no heavy filled pill unless there is a real selected-state need.
- Reduce project/model dropdown menu visual weight: compact row heights, restrained padding, bounded widths, bounded scroll height, clean selected-state checkmarks, and no chunky shadows or oversized text.
- Align the model, approval, project, workspace, branch, mic, and send controls so they feel like one coherent composer toolbar and do not wrap awkwardly at supported widths.
- In the opened orchestration chat view, replace the bulky project select treatment with the same compact Codex control language used on the start surface.
- Preserve project search, selected-state checks, `Add new project`, `Start from scratch`, and `Use an existing folder` behavior.
- Update visual QA source invariants where needed so future regressions catch the compact ghost project selector and restrained dropdown sizing.
- Run the required UI checks and perform a manual/screenshot visual review of the Orchestrator start state and opened orchestration chat state.

## Affected Files Or Areas
- `apps/desktop/src/app.tsx`
- `apps/desktop/scripts/codex-visual-qa.mjs`
- `brain/features/ui-shell.md`
- `brain/features/orchestration.md`
- `brain/progress.md`

## Acceptance Criteria
- Orchestrator project controls use ghost-button styling by default, with no heavy filled project pill in the title or composer toolbar.
- Project and model dropdown triggers are compact, aligned, and visually consistent with the rest of the Codex-style shell.
- Dropdown menus are restrained: no oversized rows, no excessive width, no harsh shadow/card treatment, and no text overflow for long project/model names.
- The Orchestrator start composer toolbar keeps stable dimensions and does not overlap, jump, or wrap awkwardly on desktop and narrow supported widths.
- The opened orchestration chat view uses the same compact project/control treatment as the start state.
- Existing behavior remains intact: project search, project selection, add-project submenu actions, orchestrator/model selection, message submission, and handoff controls still work.
- `bun --filter @brain-loop/desktop visual:qa` passes after any necessary invariant updates.
- `bun --filter @brain-loop/desktop typecheck` passes.
- Manual visual review or screenshots confirm the Orchestrator start and opened chat surfaces look polished, dense, and Codex-standard.

## Test Plan
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop visual:qa`
- Manual visual check of the Orchestrator start surface with project/model dropdowns open.
- Manual visual check of an opened orchestration chat with the project selector, task title, handoff button, linked workers, and bottom composer visible.

## Brain Update Requirements
- Update `brain/features/ui-shell.md` for visible Orchestrator UI behavior and control treatment.
- Update `brain/features/orchestration.md` for any refined Orchestrator UI notes.
- Update `brain/progress.md` with changed files and checks.

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
- "Looks perfect" is subjective; mitigate with Codex UI standards, compact sizing criteria, and screenshot/manual review.
- Long project names can overflow if trigger max-widths are too generous or truncation is missed.
- Dropdown portal/submenu behavior can regress if shared shadcn primitives are changed globally; prefer local class adjustments before primitive changes.
- Compacting controls too much could reduce hit targets; preserve accessible click areas and visible focus states.

## Open Questions
- None.

## Linked Task
- Task Title: Redesign Orchestrator Chat UI
- Task File: brain/tasks/roadmap.md
