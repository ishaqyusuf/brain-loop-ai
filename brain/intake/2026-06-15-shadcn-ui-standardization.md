# Brain Intake: Shadcn UI Standardization

## Status
Approved

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Raw Input
Standardize all current code to shadcn UI.

## Generated Plans
- [x] Expand Desktop Shadcn Primitive Baseline - `brain/plans/2026-06-15-cleanup-desktop-shadcn-primitive-baseline.md` - Status: Done
- [x] Refactor Sidebar And Settings To Shadcn Controls - `brain/plans/2026-06-15-refactor-sidebar-settings-shadcn-controls.md` - Status: Done
- [x] Refactor Workspace Panels And Composer To Shadcn - `brain/plans/2026-06-15-refactor-workspace-panels-composer-shadcn.md` - Status: Done
- [x] Refactor Tables And Sheets To Shadcn Forms - `brain/plans/2026-06-15-refactor-tables-sheets-shadcn-forms.md` - Status: Done

## Recommended Execution Order
1. Expand Desktop Shadcn Primitive Baseline - Adds or confirms the missing primitives needed by the follow-up refactors.
2. Refactor Sidebar And Settings To Shadcn Controls - The current sidebar and settings page contain several raw buttons, search input markup, custom toggle buttons, and custom grouped rows.
3. Refactor Workspace Panels And Composer To Shadcn - The main shell and logs/approval panels still include ad hoc panel and composer markup that should be composed from shared primitives.
4. Refactor Tables And Sheets To Shadcn Forms - Project and queue tables already use table primitives, but their filters, forms, inline inputs, detail panels, and sheet content need a more complete shadcn form/card treatment.

## Agent Recommendations
- Expand Desktop Shadcn Primitive Baseline: open-code - Mostly codebase audit and small primitive additions.
- Refactor Sidebar And Settings To Shadcn Controls: antigravity - UI-heavy refactor with visual density and interaction checks.
- Refactor Workspace Panels And Composer To Shadcn: antigravity - UI-heavy refactor touching shell composition, composer ergonomics, and panel layout.
- Refactor Tables And Sheets To Shadcn Forms: antigravity - UI-heavy table/form work with validation and sheet composition.

## Merged Items
- The broad request to standardize all current code to shadcn UI was split by UI surface instead of creating one oversized cross-app refactor.

## Duplicate Or Existing Items
- Existing completed plans already established the Codex shell and settings surface: `brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md` and `brain/plans/2026-06-15-ux-ui-codex-settings-surface.md`.
- Existing UI docs already require shadcn primitives before custom markup in `brain/features/ui-shell.md` and `brain/engineering/coding-standards.md`.
- This intake is not a duplicate because source scan still shows raw buttons, raw inputs, custom toggles, and ad hoc bordered panels in current desktop UI code.

## Needs Clarification
- Resolved for this implementation: scope was React desktop UI surfaces because shadcn applies to UI primitives, not Rust orchestration or shared data contracts.

## Skipped Items
- Non-UI Rust, scheduler, queue, lock, and Brain contract logic skipped because shadcn does not apply to those layers.

## Approval Notes
- User requested implementation of all generated plans on 2026-06-15. Plans were implemented directly in the project checkout and marked Done.

## Handoff Notes
- No handoff needed for the generated plans; the user requested direct implementation and all generated plans are marked Done.
