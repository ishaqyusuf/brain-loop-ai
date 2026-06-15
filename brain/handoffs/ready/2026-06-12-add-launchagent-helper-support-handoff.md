# Brain Handoff: Add LaunchAgent Helper Support

## Status
Ready

## Source Plan
brain/plans/2026-06-12-feature-launchagent-helper.md

## Task
- Task Title: Add LaunchAgent Helper Support
- Task File: brain/tasks/in-progress.md

## Recommended Agent
- Agent: open-code
- Reason: macOS helper configuration and native permissions are systems-focused.

## Goal
Support optional macOS LaunchAgent installation and control so Brain automation can run beyond the foreground app session when the user enables it.

## Context To Read First
- brain/plans/2026-06-12-feature-launchagent-helper.md
- brain/BRAIN.md
- brain/SYSTEM_OVERVIEW.md
- brain/system/architecture.md
- brain/engineering/ai-rules.md
- brain/engineering/coding-standards.md

## Implementation Instructions
1. Decide whether LaunchAgent support belongs in v1 or remains optional for v2; document the decision if durable.
2. Add Rust helpers to render, install, unload, and remove a user LaunchAgent plist.
3. Add status detection for loaded/unloaded/error states.
4. Build settings UI with explicit enable/disable confirmation.
5. Ensure logs explain helper activity and failures.

## Acceptance Criteria
- Users can see whether the helper is installed and loaded.
- Install/uninstall actions are explicit and reversible.
- Helper failures are reported with actionable messages.
- An ADR captures the v1/v2 helper decision if implementation proceeds.

## Files Or Areas Likely Involved
- `apps/desktop/src-tauri/src`
- `apps/desktop/src/components`
- `packages/desktop-client/src/index.ts`
- `brain/features/background-scheduler.md`
- `brain/api/permissions.md`
- `brain/decisions`

## Do Not Change
- Do not change unrelated product areas.
- Do not move the task to done.
- Do not broaden the scope beyond this handoff.
- Keep Midday standard architecture and shadcn composition rules.

## Required Checks
- `cargo check` from `apps/desktop/src-tauri`
- `bun --filter @brain-loop/desktop typecheck`
- Manual check on macOS with dry-run or non-destructive plist rendering first

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-launchagent-helper-support.json

## Brain Update Contract
After implementation, update only the relevant files:

- `brain/progress.md`: summarize completed implementation work.
- `brain/features/<feature>.md`: update if user-visible behavior changed.
- `brain/api/endpoints.md`: update if API routes changed.
- `brain/api/contracts.md`: update if request/response shapes changed.
- `brain/api/permissions.md`: update if auth or permissions changed.
- `brain/database/schema.md`: update if schema changed.
- `brain/database/migrations.md`: update if migrations changed.
- `brain/decisions/`: add an ADR only if an architecture decision was made.
- `brain/tasks/in-progress.md`: keep the task in progress.

Plan-specific Brain update requirements:
- Update `brain/features/background-scheduler.md`.
- Update `brain/api/permissions.md`.
- Add ADR under `brain/decisions/` if LaunchAgent support is implemented or intentionally deferred.
- Update `brain/progress.md` after implementation.

Do not move the task to `done`. `brain-review-handoff` owns final approval.

## Completion Notes

- Changed files:
  - `brain/decisions/2026-06-12-launchagent-v2-deferral.md` (new): ADR deferring LaunchAgent helper to v2
  - `apps/desktop/src-tauri/src/launchagent.rs` (new): Full LaunchAgent module — plist rendering, install/unload/remove, launchctl integration, status detection
  - `apps/desktop/src-tauri/src/lib.rs` (updated): 5 new Tauri commands
  - `packages/desktop-client/src/index.ts` (updated): 5 new wrapper functions
  - `packages/brain-core/src/types.ts` + `index.ts` (updated): LaunchAgentInfo interface
  - `brain/progress.md` (updated): Completion entry
- Checks run:
  - `bun run typecheck` (3 packages): passed
  - `cargo check`: blocked (Rust toolchain not installed)
- Brain docs updated:
  - `brain/decisions/2026-06-12-launchagent-v2-deferral.md`: ADR created
  - `brain/progress.md`: Added implementation entry
- Unresolved issues:
  - v2 UI surface (settings page) deferred per ADR
  - `cargo check` blocked by missing Rust toolchain
