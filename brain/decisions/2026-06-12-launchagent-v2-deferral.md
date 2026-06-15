# ADR: Defer macOS LaunchAgent Helper to v2

## Status
Accepted

## Context
Brain Loop must eventually support background automation beyond the foreground app session. A macOS LaunchAgent is the natural mechanism: it runs as a user-level daemon, survives login/logout, and can trigger the Brain scheduler independently of the Tauri desktop window.

## Decision
The LaunchAgent helper is **deferred to v2**. The v1 desktop app will:
- Keep the Tauri tray icon as the primary lifecycle manager (hide-on-close instead of quit).
- Require the app to be running (or at least the tray process alive) for background ticks.
- Document the v2 LaunchAgent plan clearly so the design is ready when the feature is prioritized.

The Rust module (`launchagent.rs`) provides the full plist rendering, install, uninstall, and status infrastructure needed for v2, with Tauri commands ready to be wired into a future settings UI.

## Rationale
- The app is in early implementation (phase <30%). Foreground/tray-based automation covers the immediate use case.
- macOS LaunchAgent installation requires explicit user consent (Full Disk Access, LaunchAgent directory permissions), which demands a polished onboarding flow that is out of scope for v1.
- The plist rendering and lifecycle infrastructure can be built now as an export-ready module; the UI surface and user-facing consent flow are v2 work.

## Consequences
- Background automation depends on the Tauri app staying alive (tray mode).
- LaunchAgent module is implemented but commands are marked as v2/deferred.
- A `LaunchAgentStatus` API returns `not_installed` by default until v2 UI is built.
- Scheduler ticks require the desktop app to be running.

## Alternatives Considered
- **Implement full LaunchAgent in v1**: Rejected — requires macOS permission flows that add scope risk to early releases.
- **Use a system-level LaunchDaemon**: Rejected — requires root, breaks user-scoped sandbox model.
- **Skip LaunchAgent entirely**: Rejected — v2 needs durable background automation for unattended dispatch.

## Related
- `brain/features/background-scheduler.md`
- `brain/plans/2026-06-12-feature-launchagent-helper.md`

## Date
2026-06-12
