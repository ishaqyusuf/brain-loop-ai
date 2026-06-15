# Coding Standards

## Purpose

Defines implementation-facing coding standards.

## Codex UI Standard

- Brain Loop UI should follow the Codex desktop visual and interaction standard: dark-first, thread-oriented, dense, calm, and operational.
- The first screen should be an active control surface with a left navigation/thread rail, central thread workspace, optional right environment panel, and bottom composer.
- Use compact icon-led controls with tooltips for navigation, settings, review, send, attach, environment, branch, and change actions.
- Keep panels restrained: subtle borders, compact radii, clear active states, stable scroll regions, and no decorative marketing sections.
- Thread timelines should support concise agent/user messages, Brain artifact cards, edited-file cards, check summaries, approval cards, and review actions.
- Environment and changes context should stay visible beside the active thread when space allows, including project/worktree/branch, file changes, sources, and commit/push readiness.
- UI text must fit at desktop and narrow widths without overlapping cards, composer controls, sidebars, or panels.
- Significant UI work must include a screenshot or manual visual check against the Codex reference standard until an automated visual QA harness exists.

## Midday Architecture Standard

- Pages, tables, modals, sheets, forms, sidebar, and shared dashboard components may follow Midday architecture, file naming, and coding patterns where that improves maintainability.
- Tables should follow the Midday domain table pattern: `components/tables/core`, `components/tables/<domain>/columns.tsx`, `data-table.tsx`, `table-header.tsx`, `skeleton.tsx`, `empty-states.tsx`, and `bottom-bar.tsx` or `action-menu.tsx` when needed.
- Sheets should follow the Midday global sheets pattern: `components/sheets/global-sheets.tsx`, `components/sheets/global-sheets-provider.tsx`, and domain sheet files under `components/sheets/`.
- Forms must follow Midday validation, error handling, and mutation patterns.
- Data fetching and mutations must use the standard Midday tRPC patterns, including invalidation, loading states, errors, and caching behavior.
- App surfaces orchestrate; packages own reusable contracts and logic.
- React entrypoints should stay thin, with feature behavior in components, hooks, stores, or packages as appropriate.

## Shadcn Standard

- Use shadcn primitives before custom markup.
- Use semantic tokens and component variants instead of raw styling values.
- Use `gap-*` for spacing, `size-*` for square dimensions, and `cn()` for conditional classes.
- Use shadcn form composition for forms and validation states.
- Use shadcn `Sheet`, `Dialog`, `Alert`, `Empty`, `Skeleton`, `Badge`, `Tooltip`, `Tabs`, `Card`, and table primitives where they fit the product surface.
- Dialog, sheet, and drawer surfaces must include accessible titles.
- Icons in buttons should follow the configured project icon library and shadcn icon rules.
- **Initialization & CLI Runner**: shadcn setup is initialized or run as pending using:
  ```bash
  bun --filter @brain-loop/desktop x shadcn@latest init
  ```
  Generated primitives must reside under `apps/desktop/src/components/ui/` with custom layouts composed inside standard component subfolders.

## Rust Standards

- **Prerequisites**: A working Rust / Cargo toolchain is required to run Rust checks (e.g., `cargo check` inside `apps/desktop/src-tauri`) and compile/run the Tauri app. If Cargo is missing from the host environment, Rust validation checks must be reported as blocked.
- Keep Tauri command handlers thin.
- Put reusable automation logic in focused Rust modules.
- Use typed structs for Brain JSON files.
- Use atomic writes for every Brain JSON mutation.
- Stream process output to both UI events and durable logs.
