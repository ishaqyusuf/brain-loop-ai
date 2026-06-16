# Feature: UI Shell

## Purpose

Provide a Codex-standard desktop console for Brain automation control, using shadcn primitives and Midday-inspired component organization where helpful.

## Planned Behavior

- First screen is the operational Brain Loop thread workspace, not a generic dashboard or landing page.
- Left navigation is a clean agent/thread rail, with noisy product-area navigation removed from the sidebar and Settings kept in the footer.
- The center surface shows the active thread timeline with user messages, agent output, Brain artifact cards, edited-file summaries, checks, and approvals.
- A bottom composer provides attach/action controls, approval mode, runner/model selection when available, and send controls without layout shift.
- An optional right Environment panel shows changes, local/project context, branch/worktree, commit or push readiness, and sources.
- Sidebar branding uses the Brain Loop Focus Frame mark: a compact white app-icon tile with dark focus corners and a restrained teal center glyph.
- Empty, loading, error, and warning states are visible and shadcn-composed.
- Layout stays dense, scan-friendly, and desktop-app focused.

## Implemented Behavior

- Sidebar top chrome remains clean for native-window spacing. Review, Implementation, and Approval stay fixed below the chrome, and an `All Threads` section header with compact More, Projects, and New implementation actions lives inside the scrollable flat thread list region. The thread rail shows 10 rows by default and exposes a compact `Show more` chevron row for additional items. Settings remains in the footer.
- Sidebar actions and thread rows use ghost-button styling rather than framed cards. Review, Implementation, and Approval are flat title-only rows with no icon or subtitle.
- Thread list rows use compact conversation labels with opt-in state treatment. Pending approvals display an `Awaiting response` pill; running rows show a spinner; blocked and landing rows show compact state treatment; ordinary idle rows keep elapsed-time labels without a default status icon. Completed threads derive `completed` and `unread` row flags from durable thread transitions: existing completed threads start read, newly completed unread threads show a blue dot, and read/opened completed rows fall back to the elapsed date label.
- Expanded thread rows expose hover/focus actions that replace the right-side state/date treatment with compact Thread and Archive controls. Thread reopens the row, Archive calls the durable thread archive command only for archivable durable threads, and a dark preview card appears after a 1.5 second hover delay with the thread title, project, and workspace label beside the sidebar.
- The All Threads More menu is scoped to thread-list management: Archive all threads, Organize sidebar, and Sort by. Organize supports By Projects, Chronological List, and WorkTree grouping; Sort by supports Created At and Updated At ordering with Codex-style icon rows and selected-state checks.
- The app shell is dark-first at the root CSS token level so stale light/system theme state does not produce white page backgrounds.
- The workspace and root shell share the same `#141414` background so the empty home and opened thread surfaces do not show mismatched or white-looking background bands.
- Sidebar, settings, home, and chat typography keep the dense Codex conversation-list feel while using a readable 14px shell baseline and larger primary labels/messages.
- The desktop shell uses the Codex/macOS-style system UI font stack through the shared `font-sans` token instead of bundling Geist.
- The sidebar supports a collapsed state and uses a glass-like dark translucent treatment with blur and restrained borders.
- The old product menu entries (Overview, Projects, Queue, Runs, Logs, Approvals, Scheduler, Threads) and the main dashboard tab bar were removed from the visible app frame.
- The current shell is headless: the visible workspace app bar has been removed while the sidebar owns navigation and action entry points.
- The desktop window uses Tauri's macOS overlay title-bar style with the native traffic lights positioned into the app frame, the native title hidden, and no React-drawn duplicate traffic-light dots.
- App action buttons use a flat secondary treatment by default, with ghost buttons reserved for icon-only chrome and destructive styling reserved for destructive actions.
- The undecided home surface intentionally shows only the centered Brain Loop app icon and product name.
- The React home/logo component, browser favicon, Tauri window icon, and tray icon all use the same Brain Loop Focus Frame mark; the previous dark looping glyph is no longer used.
- Selecting an agent action or durable agent thread opens a Codex-like chat surface with thread identity pinned into the top overlay chrome, persisted thread timeline messages when available, exact provider-message provenance when structured harness events are present, live fallback message blocks for older records, artifact cards, status metrics, run alerts, and linked transcript cards when durable implementation/review log paths are available. Queued and picked tasks do not appear in the thread rail; started-or-later task records appear as thread rows even when no durable thread file exists yet, and opening such a row shows a centered `Thread not found for task` notice.
- Queue-linked thread views include a compact Codex harness composer. Sending on a thread without an active provider runtime starts a Codex app-server session and records exact provider messages; sending on an active/recovered session dispatches a follow-up provider turn. Stop and replay controls manage the runtime and rebuild from saved harness JSONL.
- Opening the fixed Approval action embeds approval broker sections directly in the chat surface and hides implementation/review run controls so the view stays approval-focused.
- Chat timeline messages, artifacts, transcripts, metrics, and approvals use flat rounded sections instead of nested card borders or heavy shadows.
- Chat timelines label their message source as exact provider messages, Brain timeline, or transcript-backed. Exact provider messages show a compact exact/provider/model marker and preserve provider-authored line breaks.
- Pending permission/approval requests show red flags in the Approval sidebar action and queue-linked thread rows. Opened affected threads show a destructive permission-required alert with an action that jumps to approval cards.
- Operational surfaces remain reachable through selected agent/thread views and settings: scheduler controls, Projects, Notifications, LaunchAgent, approval state, and release settings.
- Settings opens from the sidebar footer and uses a Codex-style settings layout with Back to app, search, grouped category rail, central pane, dense rows, toggles, selects, implemented controls, and planned/disabled rows for future contracts.
- Settings > Permissions & Approvals includes a permission-required sound toggle that can mute the short approval cue while keeping the rest of the shell visible.
- Settings > Agents includes harness message capture capability rows so Codex exact structured events and transcript-only OpenCode/Antigravity behavior are visible before a runner is chosen.
- Current sidebar, settings search/category controls, settings toggles, mode cards, composer, logs list, approval details, project forms, queue detail sheets, and empty states are standardized on local shadcn primitives where those primitives fit.
- The desktop app now has local shadcn primitives for `Input`, `Textarea`, `Label`, `Switch`, `Checkbox`, form helpers, and `Empty` in addition to the existing Button, Badge, Card, Alert, Select, Sheet, ScrollArea, Tooltip, Separator, Skeleton, DropdownMenu, Tabs, and Table primitives.
- `bun --filter @brain-loop/desktop visual:qa` provides a repeatable Codex UI visual QA gate. It verifies the built desktop bundle exists, the shell remains headless and dark-first, Tauri overlay title-bar chrome is configured, fake traffic-light dots are absent, the React logo uses the current Focus Frame mark, Review/Implementation/Approval stay fixed above the scrollable thread list, thread rows stay flat/title-only, opened threads keep identity in top chrome without the stale h-12 app bar, persisted timeline messages render, and long artifact/transcript text has wrapping guards. The command writes a generated JSON report under `apps/desktop/visual-qa/`.
- Dark mode is now a real shadcn color mode: the app applies a root `.dark` class before React mounts, persists a `dark`, `light`, or `system` theme preference in local storage, exposes the setting under Settings > General, and updates when the system color scheme changes while set to `system`.
- Load state shows Skeleton placeholder cards while the initial brain status poll resolves.
- Error state shows a destructive Alert when `getBrainStatus` fails (connection lost).
- Warning state shows an info Alert when scheduler status is `error` but brain status is healthy.
- Manual run results use Alert with `CheckCircle2` (success) or `AlertCircle` (failure) icons instead of raw custom divs.
- Status cards use shadcn Card/CardHeader/CardContent primitives.

## Codex/Shadcn Requirements

- Match Codex desktop density, dark-first contrast, compact icon controls, restrained card borders, and thread-oriented information flow.
- Use Midday-inspired component boundaries under `apps/desktop/src/components` when they keep tables, sheets, forms, and shared surfaces organized.
- Prefer shadcn primitives before custom markup.
- Use `Button`, `Badge`, `Card`, `Tabs`, `Tooltip`, `Alert`, `Skeleton`, `Separator`, `ScrollArea`, `Sheet`, `Dialog`, and table/form primitives where appropriate.
- Use `gap-*`, semantic tokens, `cn()`, and accessible overlay titles.
- Keep React entrypoints thin.
- Verify significant UI changes with `bun --filter @brain-loop/desktop visual:qa` plus manual/screenshot review for layout decisions the source invariant harness cannot see yet.

## Implementation Plans

- `brain/plans/2026-06-12-cleanup-workspace-validation-ui-foundation.md`
- `brain/plans/2026-06-12-ux-ui-midday-shadcn-desktop-shell.md`
- `brain/plans/2026-06-13-ux-ui-codex-ui-standard-visual-contract.md`
- `brain/plans/2026-06-13-ux-ui-codex-thread-workspace.md`
- `brain/plans/2026-06-13-ux-ui-codex-environment-changes-panel.md`
- `brain/plans/2026-06-13-ux-ui-codex-artifact-change-cards.md`
- `brain/plans/2026-06-13-test-codex-ui-visual-qa-harness.md`
- `brain/plans/2026-06-15-ux-ui-codex-shell-sidebar-app-bar-redesign.md`
- `brain/plans/2026-06-15-ux-ui-codex-settings-surface.md`
- `brain/plans/2026-06-15-cleanup-desktop-shadcn-primitive-baseline.md`
- `brain/plans/2026-06-15-refactor-sidebar-settings-shadcn-controls.md`
- `brain/plans/2026-06-15-refactor-workspace-panels-composer-shadcn.md`
- `brain/plans/2026-06-15-refactor-tables-sheets-shadcn-forms.md`

## Brain Docs To Keep Updated

- `brain/engineering/repo-structure.md`
- `brain/engineering/coding-standards.md`
- `brain/product/roadmap.md`
