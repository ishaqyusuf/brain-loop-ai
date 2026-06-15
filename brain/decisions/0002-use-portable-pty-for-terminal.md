# ADR 0002: Use portable-pty for Terminal Sessions

## Status
Accepted

## Date
2026-06-12

## Context
We need to provide embedded terminal sessions per automation thread so users can inspect and interact with long-running implementation or review processes. This requires a pseudo-terminal (PTY) so that shell processes behave correctly (e.g., providing colored output, handling resizing, and capturing interactive input). We need a crate that integrates well with Tauri and is cross-platform.

## Decision
We will use the `portable-pty` crate to manage PTY sessions in the Rust backend. For the frontend, we will use `xterm.js` (`xterm` and `@xterm/addon-fit` packages) to render the terminal.

## Consequences
- **Pros:** `portable-pty` is widely used, supported by the WezTerm author, and provides robust cross-platform pseudo-terminal capabilities. `xterm.js` is the industry standard for web-based terminals (used by VSCode).
- **Cons:** Managing raw PTY pipes adds complexity to the process lifecycle and cleanup. Resizing requires passing window dimensions from the frontend down to the Rust PTY session.
