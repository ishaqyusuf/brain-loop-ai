# ADR 0001: Use Midday-Style Tauri Desktop Architecture

## Status

Accepted

## Context

Brain Loop needs a Codex-like macOS desktop experience with a menu bar controller, queue views, threaded run history, embedded terminal sessions, approval surfaces, and local process orchestration.

The app also needs to interact with local Brain JSON files, runner CLIs, logs, and eventually a LaunchAgent helper.

## Decision

Use a Midday-style Tauri desktop architecture:

- React and Vite for the desktop control console.
- Rust and Tauri for native filesystem, process, tray, and automation behavior.
- Bun and Turborepo for monorepo task orchestration.
- Shared TypeScript packages for Brain contracts and desktop client wrappers.

## Consequences

- Product UI can move quickly using React patterns.
- Native automation remains in Rust, where process and filesystem control are safer.
- The app can reuse Midday as the primary source reference for desktop structure and UI organization.
- Future terminal threads should use a Rust PTY layer with a React terminal renderer.

