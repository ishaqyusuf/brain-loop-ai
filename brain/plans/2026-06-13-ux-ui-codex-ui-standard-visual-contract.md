# Plan: Define Codex UI Standard And Visual Contract

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
Make the Codex desktop UI standard explicit so all current and future UI tasks share the same layout, density, interaction, and verification rules.

## Current Context
Brain docs already describe Brain Loop as a Codex-like local mission control, but several plans and coding standards still emphasize Midday/shadcn as the primary UI direction. Midday remains useful for component organization, while the visible product should now follow Codex desktop patterns.

## Proposed Approach
Update the UI design contract to treat Codex desktop as the visual and interaction standard, with shadcn used as primitives and Midday used only for internal folder/component organization where helpful.

## Implementation Steps
- Review current UI docs and plans for Midday-first wording.
- Document Codex-standard layout requirements: left thread/navigation rail, central thread workspace, optional right environment panel, bottom composer, dense file/change cards, dark-first theme, compact icon controls, and clear review/approval actions.
- Add token and component guidance for restrained borders, compact radii, sidebar selection states, cards, badges, tooltips, and status chips.
- Update affected UI task descriptions so lower agents know Codex standard is required.
- Keep shadcn usage as the implementation primitive layer rather than the visual target.

## Affected Files Or Areas
- `brain/engineering/coding-standards.md`
- `brain/features/ui-shell.md`
- `brain/product/roadmap.md`
- `brain/tasks/roadmap.md`
- `brain/tasks/in-progress.md`
- Existing UI plan files under `brain/plans/`

## Acceptance Criteria
- Brain docs state that Codex desktop is the visual and interaction standard for UI work.
- Midday is described as an architecture/reference pattern, not the primary visible UI style.
- All UI-bearing tasks have a clear Codex-standard requirement or inherit it from task guidance.
- The standard mentions screenshot-based visual verification.

## Test Plan
- Manual Brain documentation review.
- `rg -n "Midday|Codex|shadcn" brain/engineering brain/features brain/tasks brain/product brain/plans`

## Brain Update Requirements
- Update `brain/engineering/coding-standards.md`.
- Update `brain/features/ui-shell.md`.
- Update `brain/product/roadmap.md` and task files as needed.

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
- Overcorrecting could discard useful Midday component organization; keep architecture and visual style separate.

## Open Questions
- None

## Linked Task
- Task Title: Define Codex UI Standard And Visual Contract
- Task File: brain/tasks/roadmap.md
