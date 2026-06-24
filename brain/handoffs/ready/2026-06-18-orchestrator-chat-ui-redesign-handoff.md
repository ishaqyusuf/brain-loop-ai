# Brain Handoff: Orchestrator Chat UI Redesign

## Status
Ready

## Source Plan
brain/plans/2026-06-18-ux-ui-orchestrator-chat-ui-redesign.md

## Task
- Task Title: Redesign Orchestrator Chat UI
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: antigravity
- Reason: This is design-sensitive UI implementation with browser/manual visual QA, compact interaction polish, and product-flow verification.

## Goal
Make the Orchestrator start/chat UI feel polished, compact, and Codex-standard. Project controls should default to ghost-button styling, dropdowns should be restrained instead of oversized, and the start composer plus opened orchestration chat controls should feel coherent and stable.

## Review Unit
- Type: task
- Linked Tasks: Redesign Orchestrator Chat UI
- Grouping Reason: None
- Depends On Queue Items: None
- Approval Boundary: Approve only after every linked task in this review unit is implemented, reviewed, landed, and validated.

## Context To Read First
- brain/plans/2026-06-18-ux-ui-orchestrator-chat-ui-redesign.md
- brain/engineering/coding-standards.md
- brain/features/ui-shell.md
- brain/features/orchestration.md
- apps/desktop/src/app.tsx
- apps/desktop/scripts/codex-visual-qa.mjs

## Implementation Instructions
1. Audit `OrchestratorStart`, `ProjectDropdown`, `OrchestratorModelDropdown`, and `OrchestrationThreadView` in `apps/desktop/src/app.tsx` for oversized controls, filled project pills, excessive menu widths/heights, chunky shadows, and awkward toolbar wrapping.
2. Update the project dropdown trigger so title and composer/project contexts default to ghost-style chrome with subtle hover/focus states. Avoid heavy filled pills unless a selected-state treatment is truly required.
3. Reduce the project/model dropdown visual weight: compact rows, restrained padding, bounded widths, bounded scroll height, clean selected-state checkmarks, and truncation for long project/model names.
4. Align approval, project, model, workspace, branch, mic, and send controls into a coherent composer toolbar that keeps stable dimensions and does not overlap or jump.
5. Update the opened orchestration chat controls to use the same compact Codex control language as the start surface, especially the project selector area near the task title and Handoff action.
6. Preserve behavior for project search, selected-state checks, `Add new project`, `Start from scratch`, `Use an existing folder`, orchestrator/model selection, message submission, and handoff creation.
7. Update `apps/desktop/scripts/codex-visual-qa.mjs` so it catches the compact ghost project selector and restrained dropdown expectations.
8. Update the Brain docs listed in the Brain Update Contract to describe the visible UI polish after implementation.

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

## Files Or Areas Likely Involved
- apps/desktop/src/app.tsx
- apps/desktop/scripts/codex-visual-qa.mjs
- brain/features/ui-shell.md
- brain/features/orchestration.md
- brain/progress.md

## Do Not Change
- Do not change orchestration storage contracts, queue item contracts, runner execution, handoff generation semantics, or project registration behavior.
- Do not modify shared shadcn primitives globally unless local class adjustments cannot satisfy the UI requirements.
- Do not move linked tasks to done.
- Do not broaden the scope beyond this handoff.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `bun --filter @brain-loop/desktop visual:qa`
- Manual visual check of the Orchestrator start surface with project/model dropdowns open.
- Manual visual check of an opened orchestration chat with the project selector, task title, handoff button, linked workers, and bottom composer visible.

## Queue Item
/Users/M1PRO/.brain-loop/queues/handoffs/2026-06-18-brain-loop-orchestrator-chat-ui-redesign.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/ui-shell.md`: update visible Orchestrator UI behavior and control treatment.
- `brain/features/orchestration.md`: update refined Orchestrator UI notes.
- `brain/api/endpoints.md`: update only if API routes changed.
- `brain/api/contracts.md`: update only if request/response shapes changed.
- `brain/api/permissions.md`: update only if auth or permissions changed.
- `brain/database/schema.md`: update only if schema changed.
- `brain/database/migrations.md`: update only if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the linked task in progress.

Do not move linked tasks to `done`. `brain-review-handoff` owns final approval for the review unit.

## Completion Notes
Fill this in after implementation:

- Changed files:
- Checks run:
- Brain docs updated:
- Unresolved issues:
