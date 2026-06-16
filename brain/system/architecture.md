# Architecture

## Purpose

Records durable architecture decisions and system boundaries.

## Current Architecture

```text
React UI
  -> Tauri commands/events
Rust orchestration core
  -> Brain state files under ~/.brain-loop
  -> PTY/process runners
  -> Codex app-server harness runtime and structured provider events
  -> logs and transcripts
```

## Key Boundaries

- React displays state and gathers user intent.
- Rust owns filesystem, locks, process launch, PTY sessions, and automation ticks.
- `~/.brain-loop/settings.toml` stores global settings; project, queue, thread, lock, workspace, and run metadata files remain JSON.
- Runner CLIs perform implementation or review work. Runner adapter code is the integration boundary that maps Brain Loop settings to those CLIs, captures logs, surfaces approval requests, and ingests structured provider events when a runner exposes them.
- Direct-provider runners use a separate Brain Loop-owned runtime contract: provider adapters translate normalized turns into provider-specific request envelopes, provider stream chunks into normalized turn events, and direct turn events into existing harness event records. Direct events can now be persisted through the harness JSONL/thread ingestion path when explicitly supplied, bounded read/search/finish tools can execute inside an explicit execution path, and gated mutating tools can create Brain Loop approval requests. Provider networking, post-approval mutating tool execution, and queue transitions remain disabled until dispatch is enabled.
- The Codex harness adapter owns a local `codex app-server --stdio` process per live exact-message session, speaks newline-delimited JSON-RPC, and normalizes provider notifications into durable thread messages plus replayable harness JSONL.
- Exact model messages come from structured provider events, not terminal transcript parsing. Transcript capture remains the audit/fallback path.

## Open Questions

- Whether a LaunchAgent helper is required for v1 or v2.
- How much structured approval support each runner adapter can expose.
