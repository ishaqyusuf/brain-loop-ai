# Plan: Decide Product Name And Runner Terminology

## Type
Investigation

## Status
Proposed

## Created Date
2026-06-12

## Last Updated
2026-06-12

## Intake
- Intake File: brain/intake/2026-06-12-loop-product-settings.md
- Intake Item: Loop name suggestions and better term than "app"

## Goal Or Problem
Select durable product and domain terminology before it spreads through settings, handoffs, docs, and UI.

## Current Context
The project is currently called Brain Loop. User suggested Loop, O-Loop, and C-Loop. The current language uses "app" for tools such as opencode, Claude, Codex, and Antigravity, but that term feels wrong.

## Proposed Approach
Create a product terminology decision that evaluates names and chooses the canonical nouns for the product, external automation tools, model choices, queue items, threads, and execution sessions.

## Implementation Steps
- Review existing Brain docs for product and "app"/runner terminology.
- Compare Loop, O-Loop, C-Loop, and Brain Loop against the open-source positioning.
- Evaluate replacement terms for "app": runner, provider, adapter, engine, executor, or TODO: other.
- Update product docs with the chosen terms.
- Add an ADR if the naming and terminology decision is durable.

## Affected Files Or Areas
- `brain/product/vision.md`
- `brain/product/roadmap.md`
- `brain/system/overview.md`
- `brain/system/architecture.md`
- `brain/api/contracts.md`
- `brain/decisions/`
- `README.md`

## Acceptance Criteria
- Product name decision is documented.
- Replacement term for "app" is documented with examples for opencode, Claude, Codex, and Antigravity.
- Future settings and handoff docs know which nouns to use.

## Test Plan
- Documentation review.
- `rg -n " app |apps|runner|provider|executor|Loop|Brain Loop|O-Loop|C-Loop" brain README.md`

## Brain Update Requirements
- Update product docs and architecture docs.
- Add ADR if final terminology is accepted.
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
- Naming may need one user confirmation after candidates are compared.

## Open Questions
- TODO: Final product name.
- TODO: Final replacement term for "app".

## Linked Task
- Task Title: Decide Product Name And Runner Terminology
- Task File: brain/tasks/roadmap.md
