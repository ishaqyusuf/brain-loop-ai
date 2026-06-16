# Brain Intake: Codex Shell And Settings Redesign

## Status
Approved

## Created Date
2026-06-15

## Last Updated
2026-06-15

## Raw Input
User requested a Codex-style shell redesign using attached screenshots as reference:

- Remove unnecessary sidebar menus.
- Make the design cut across the app bar like the shared screenshots in both full-screen and non-full-screen window states.
- Make the sidebar clean and show only `Agents`, analogous to the screenshot's `All chats` section.
- Keep Settings in the sidebar footer.
- Build a Settings page with the necessary settings features already discussed, using the attached settings UI as the sample.

Reference images supplied in the user message:

- `/var/folders/xq/l2n2wb2x07ddkyt7vc8rdfqm0000gq/T/codex-clipboard-876b2440-69e7-48d5-8955-07f81c0008ad.png`
- `/var/folders/xq/l2n2wb2x07ddkyt7vc8rdfqm0000gq/T/codex-clipboard-36604b64-489b-4e87-a9bb-d24e797ddaa9.png`
- `/Users/M1PRO/Desktop/Recordings/Screenshot 2026-06-15 at 9.53.52 AM.png`

## Generated Plans

- [x] Simplify Codex Shell Sidebar And App Bar - `brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md` - Status: Done
- [x] Build Codex Settings Surface - `brain/plans/2026-06-15-ux-ui-codex-settings-surface.md` - Status: Done

## Recommended Execution Order

1. Simplify Codex Shell Sidebar And App Bar - Establishes the app frame, sidebar footer behavior, and full-screen/non-full-screen layout before the Settings route is built inside it.
2. Build Codex Settings Surface - Depends on the simplified shell because Settings should be entered from the sidebar footer and should reuse the same app frame.

## Agent Recommendations

- Simplify Codex Shell Sidebar And App Bar: antigravity - This is screenshot-driven layout and visual polish work.
- Build Codex Settings Surface: antigravity - This combines settings UX, dense form layout, and Codex visual matching.

## Merged Items

- `remove all the side bars menus`, `make the side bar clean should have only "Agents"`, and `settings should be footer` were merged into the shell/sidebar/app-bar plan because they all change the app frame and navigation model.
- `build the settings page`, `necessary settings features discussed`, and `use the attached ui as sample` were merged into the settings surface plan because they share a single settings route and sectioned settings navigation outcome.

## Duplicate Or Existing Items

- Broad Codex thread workspace behavior already exists in `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md`; this intake narrows the shell requirement to the new screenshot-specific sidebar/app-bar behavior.
- Settings domain features already exist as separate proposed plans:
  - `brain/plans/2026-06-12-feature-runner-model-catalog-settings.md`
  - `brain/plans/2026-06-12-feature-maxloop-concurrency-policy.md`
  - `brain/plans/2026-06-12-feature-task-sequence-scheduling-policy.md`
  - `brain/plans/2026-06-12-feature-thread-storage-worktree-strategy.md`
  - `brain/plans/2026-06-12-ux-ui-permission-required-alerts.md`
- This intake does not replace those deeper backend/settings contracts; it creates the Codex settings page surface that can host implemented controls and link planned sections.

## Needs Clarification

- TODO: Confirm whether `Agents` should list automation agents/runners, active agent threads, or both.
- TODO: Confirm whether the top sidebar actions from the screenshots (`New chat`, `Search`, `Plugins`, `Automations`) should be hidden entirely or folded into icon-only controls elsewhere.

## Skipped Items

- None.

## Approval Notes

- User requested "now implement all of these tasks" on 2026-06-15, approving both generated plans for implementation in the current thread.

## Handoff Notes

- Use `brain-batch-handoff` to convert approved plans into handoffs and queue items.
