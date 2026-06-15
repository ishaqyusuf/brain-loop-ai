# Brain Fix Handoff: Add LaunchAgent Helper Support

## Status
Ready

## Source Review
brain/reviews/2026-06-12-add-launchagent-helper-support-review.md

## Original Handoff
brain/handoffs/ready/2026-06-12-add-launchagent-helper-support-handoff.md

## Source Plan
brain/plans/2026-06-12-feature-launchagent-helper.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-launchagent-helper-support.json

## Goal
Fix only the blocking review findings so LaunchAgent helper support is visible, explicit, reversible, and accurately documented.

## Fix Items
1. Add a user-visible settings/control surface for LaunchAgent helper status and actions, or adjust the implementation and docs so the shipped scope honestly exposes only a safe non-destructive status/render preview. It must satisfy the original acceptance criteria.
2. Wire the UI to `getLaunchAgentInfo` and explicit actions for install/load/unload/remove with confirmation before any mutating LaunchAgent operation.
3. Improve status/error reporting in `launchagent.rs`: do not collapse all `launchctl list` failures into `Installed`; surface actionable error messages where possible and use the `Error` status when appropriate.
4. Update `brain/features/background-scheduler.md` with the LaunchAgent helper/v2 deferral, command surface, safety model, and expected user behavior.
5. Perform and document a non-destructive plist rendering/status check if possible. If cargo remains unavailable, record the exact blocker.

## Context To Read First
- brain/reviews/2026-06-12-add-launchagent-helper-support-review.md
- brain/handoffs/ready/2026-06-12-add-launchagent-helper-support-handoff.md
- brain/plans/2026-06-12-feature-launchagent-helper.md
- apps/desktop/src-tauri/src/launchagent.rs
- packages/desktop-client/src/index.ts
- apps/desktop/src/app.tsx
- brain/features/background-scheduler.md
- brain/api/permissions.md
- brain/decisions/2026-06-12-launchagent-v2-deferral.md

## Acceptance Criteria
- Users can see whether the helper is installed and loaded from the app.
- Install/load/unload/remove actions are explicit, confirmed, and reversible.
- Helper failures are reported with actionable messages.
- `brain/features/background-scheduler.md` reflects the implemented LaunchAgent scope.
- `bun --filter @brain-loop/desktop typecheck` passes.

## Do Not Change
- Do not broaden into unrelated scheduler work.
- Do not move the task to done.
- Do not silently enable persistent background automation.

## Required Checks
- `bun --filter @brain-loop/desktop typecheck`
- `cargo check` from `apps/desktop/src-tauri` if cargo is installed; otherwise record the exact blocker.
- Manual non-destructive LaunchAgent status/plist check where feasible.

## Brain Update Contract
- Update `brain/progress.md` with fix completion notes.
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/permissions.md` if the permission or confirmation model changes.
- Keep the task in `brain/tasks/in-progress.md`.

## Completion Notes
Fill this in after implementation:

- Changed files:
  - `apps/desktop/src-tauri/src/launchagent.rs` — fixed `status()` to return `Error` instead of `Installed` when `launchctl list` fails or returns non-zero. Added stderr diagnostics for failure cases.
  - `apps/desktop/src/app.tsx` — added "LaunchAgent" tab with status display (Badge, Card), action buttons (install/load/unload/remove) with explicit confirmation gate, v2-deferral Alert, error/unavailable states, and live status refresh.
  - `brain/features/background-scheduler.md` — added LaunchAgent Helper section documenting implemented scope, command surface, safety model, and status states.
- Checks run:
  - `bun --filter @brain-loop/desktop typecheck`: pass (exit 0)
  - `bun --filter @brain-loop/desktop build`: pass (exit 0)
  - `cargo check`: not run; `cargo` command not found on this machine
- Manual checks:
  - LaunchAgent plist render preview (non-destructive): `render_plist()` verified by code inspection — produces valid XML plist with correct label, path, and environment variables.
  - Manual launchctl operations blocked: `cargo` not installed so the Tauri app cannot be built/run for live macOS testing.
- Brain docs updated:
  - `brain/features/background-scheduler.md` — LaunchAgent Helper section
  - `brain/progress.md` — fix-1 completion notes
- Unresolved issues:
  - `cargo check` and live macOS LaunchAgent testing remain blocked by missing Rust/Cargo toolchain.
  - Full v2 LaunchAgent integration (background persistence, scheduled auto-load) is deferred per ADR.
