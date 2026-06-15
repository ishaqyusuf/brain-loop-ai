# Architecture

## Purpose

Records durable architecture decisions and system boundaries.

## Current Architecture

```text
React UI
  -> Tauri commands/events
Rust orchestration core
  -> Brain JSON files
  -> PTY/process runners
  -> logs and transcripts
```

## Key Boundaries

- React displays state and gathers user intent.
- Rust owns filesystem, locks, process launch, PTY sessions, and automation ticks.
- Brain JSON files are the durable workflow contract.
- Runner CLIs perform implementation or review work.

## Open Questions

- Whether a LaunchAgent helper is required for v1 or v2.
- How much structured approval support each runner can expose.

