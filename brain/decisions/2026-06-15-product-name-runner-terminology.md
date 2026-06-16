# ADR: Product Name And Runner Terminology

## Status

Accepted

## Date

2026-06-15

## Context

The Loop product-settings intake asked whether the product should be called Loop, O-Loop, C-Loop, Brain Loop, or another name. It also asked for a better term than "app" for external automation tools such as OpenCode, Claude, Codex, and Antigravity.

The project already uses Brain Loop across README, Brain docs, package naming, app icon references, state-root docs, and product vision. The open-source positioning defines the product as a local-first control surface for Brain automation, not a generic automation dashboard.

The code and contracts already use runner-oriented names for execution configuration, queue dispatch, logs, and model settings: `runnerCatalog`, `defaultImplementationRunner`, `defaultReviewRunner`, `runnerId`, `reviewRunnerId`, and runner log metadata.

## Decision

Use **Brain Loop** as the canonical product name for v1.

Use **runner** as the canonical user-facing term for external automation tools that execute implementation or review work. Examples:

- OpenCode is an implementation runner.
- Antigravity is an implementation runner.
- Codex is the default review runner and can also be an implementation runner.
- Claude may be added later as a runner when an adapter is implemented and documented.

Use **runner adapter** for the internal integration layer that knows how to invoke a runner CLI, map settings to command arguments, capture logs, and surface approval requests.

Use **provider** only when discussing a lower-level model or API provider behind a runner, not as the product noun for automation tools.

Avoid **app**, **engine**, and **executor** for the automation-tool noun in product docs, settings labels, and handoff templates.

## Rationale

- Brain Loop is already recognizable in the repo and clearly ties the product to the Brain workflow.
- Plain "Loop" is shorter but too generic for open-source discovery and documentation.
- "O-Loop" and "C-Loop" are less clear, harder to explain, and introduce branding ambiguity before the product is stable.
- "Runner" matches the existing settings and queue contracts while describing what these tools do: they run implementation or review work.
- "Adapter" is useful for contributor docs because the adapter is the code boundary, not the user-facing automation tool.

## Consequences

- Product docs, README, Settings copy, queue contracts, and handoff guidance should use Brain Loop and runner terminology consistently.
- Existing TypeScript and Rust settings names using `runner` remain aligned with product language.
- Handoff runner/model recommendations should use `recommendedAgent` only for backward-compatible queue fields, while new copy should describe recommended runner/model.
- If a future branding pass chooses a different product name, it should add a new ADR and migration checklist instead of casually mixing names.

## Related

- `brain/product/open-source-positioning.md`
- `brain/intake/2026-06-12-loop-product-settings.md`
- `brain/plans/2026-06-12-investigation-product-name-runner-terminology.md`
