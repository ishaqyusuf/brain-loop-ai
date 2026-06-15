# Tech Stack

## Purpose

Documents the intended project stack.

## Stack

- Bun workspace.
- Turborepo task orchestration.
- Tauri v2 desktop app.
- Rust for native automation.
- React and Vite for the desktop UI.
- TypeScript for shared schemas and frontend code.
- Future terminal support: Rust PTY plus xterm.js.

## Validation

- `bun run typecheck`
- `bun --filter @brain-loop/desktop build`
- Rust validation from `apps/desktop/src-tauri` with `cargo check`

