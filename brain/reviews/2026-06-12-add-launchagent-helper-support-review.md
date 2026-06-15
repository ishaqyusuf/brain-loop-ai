# Brain Handoff Review: Add LaunchAgent Helper Support

## Reviewed Handoff
brain/handoffs/ready/2026-06-12-add-launchagent-helper-support-handoff.md

## Queue Item
/Users/M1PRO/.codex/brain-project-manager/queues/handoffs/2026-06-12-brain-loop-add-launchagent-helper-support.json

## Execution Path
/Users/M1PRO/Documents/code/brain-loop

## Landing
Not needed; implementation ran in the registered project checkout.

## Source Plan
brain/plans/2026-06-12-feature-launchagent-helper.md

## Result
Needs Fix

## Findings
- [P1] The required settings UI was not implemented. The handoff explicitly asked for a settings UI with enable/disable confirmation, and acceptance requires users to see helper status and use explicit reversible actions. The only app-side references to LaunchAgent are client wrappers; there is no component or render site for `getLaunchAgentInfo`, `installLaunchAgent`, `loadLaunchAgent`, `unloadLaunchAgent`, or `removeLaunchAgent`.
- [P1] The Brain update contract is incomplete. `brain/features/background-scheduler.md` does not mention the LaunchAgent helper, v2 deferral, status command, plist path, or user-facing safety model even though the plan required that doc update.
- [P2] LaunchAgent failure/status reporting is weaker than required. `apps/desktop/src-tauri/src/launchagent.rs:84-97` maps any `launchctl list` failure to `Installed`, leaving the `Error` status unused and preventing actionable loaded/error diagnostics from reaching the user.
- [P2] The required manual dry-run/non-destructive plist rendering check was not completed, and `cargo check` remains blocked because `cargo` is not installed.

## Acceptance Criteria Check
- Users can see whether the helper is installed and loaded: Fail
- Install/uninstall actions are explicit and reversible: Fail
- Helper failures are reported with actionable messages: Partial/Fail
- An ADR captures the v1/v2 helper decision if implementation proceeds: Pass

## Checks
- `bun --filter @brain-loop/desktop typecheck`: Pass
- `cargo check` from `apps/desktop/src-tauri`: Not run; `cargo` command not found.
- Manual check on macOS with dry-run or non-destructive plist rendering first: Not run.

## Brain Update Check
- `brain/features/background-scheduler.md`: Missing LaunchAgent update.
- `brain/api/permissions.md`: Present and mentions LaunchAgent explicit user action.
- ADR under `brain/decisions/`: Present.
- `brain/progress.md`: Present.

## Decision
The work cannot be approved because the implemented commands are not exposed through explicit user controls, the feature docs are incomplete, and failure/status handling does not yet meet the handoff contract. A focused fix handoff was created.

## Follow-Up
brain/handoffs/fixes/2026-06-12-add-launchagent-helper-support-fix-1.md
