# Plan: Document Opinionated Open Source Positioning

## Type
Docs

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Planning to opensource as opinionated

## Goal Or Problem
Clarify the product's open-source positioning, opinionated defaults, and boundaries so implementation choices are coherent.

## Current Context
The repo currently documents a local Brain Loop control center with Midday architecture. User wants the product to become open source and opinionated, which affects naming, state root, settings defaults, docs, and onboarding.

## Proposed Approach
Write product and contributor-facing docs that explain the target user, opinionated defaults, supported runners, local-first state, safety model, and extension boundaries.

## Implementation Steps
- Update product vision with open-source positioning.
- Update README with opinionated local-first architecture and supported runner story.
- Add docs for default settings philosophy: safe queueing, explicit permissions, visible logs, and configurable runners/models.
- Document what is intentionally not supported in v1.
- Cross-link state-root and terminology decisions when they exist.

## Affected Files Or Areas
- `README.md`
- `brain/product/vision.md`
- `brain/product/roadmap.md`
- `brain/system/overview.md`
- `brain/engineering/coding-standards.md`
- `brain/decisions/`

## Acceptance Criteria
- README explains the open-source product direction.
- Brain product docs describe opinionated defaults and local-first architecture.
- Unsupported or deferred areas are explicit.
- Docs use final product and runner terminology when available.

## Test Plan
- Documentation review.
- `rg -n "open source|opinionated|local-first|runner|provider|Loop" README.md brain`

## Brain Update Requirements
- Update README and product docs.
- Add ADR only if durable defaults are decided.
- Update `brain/progress.md`.

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
- Docs should not promise runner integrations that are not planned or tested.

## Open Questions
- None

## Linked Task
- Task Title: Document Opinionated Open Source Positioning
- Task File: brain/tasks/roadmap.md
