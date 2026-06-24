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
- Rust owns orchestration chat storage, orchestration-to-queue handoff creation, and imported-project registration for external handoffs.
- `~/.brain-loop/settings.toml` stores global settings; project, queue, thread, lock, workspace, and run metadata files remain JSON.
- Runner CLIs perform implementation or review work. Runner adapter code is the integration boundary that maps Brain Loop settings to those CLIs, captures logs, surfaces approval requests, and ingests structured provider events when a runner exposes them.
- Direct-provider runners use a separate Brain Loop-owned runtime contract: provider adapters translate normalized turns into provider-specific request envelopes, provider responses into normalized turn events, and direct turn events into existing harness event records. Direct turns can call DeepSeek or Gemini with API keys read from the provider-specific environment variable, persist parsed events through the harness JSONL/thread ingestion path, run bounded safe-tool loops for read/search/finish tools inside an explicit execution path, create approval requests for gated mutating tools, and execute approved patch/command tools after verifying approval state and execution path. Implementation dispatch can launch direct DeepSeek/Gemini runners in a Brain Loop-owned background runtime and reconcile `finish_task`, approval waits, provider failures, and max-iteration stops back to queue state. Review dispatch can also launch direct DeepSeek/Gemini runners with a read-only tool subset and reconciles review outcomes to `reviewed-fix-request`, `landing`, or `blocked`.
- Orchestration chat turns run through the selected local orchestrator adapter. Codex uses the local Codex CLI in read-only sandbox mode; Claude uses the local Claude CLI in print/plan mode with tools disabled. Orchestration output is persisted before handoff artifacts or queue items are created.
- The Codex harness adapter owns a local `codex app-server --stdio` process per live exact-message session, speaks newline-delimited JSON-RPC, and normalizes provider notifications into durable thread messages plus replayable harness JSONL.
- Exact model messages come from structured provider events, not terminal transcript parsing. Transcript capture remains the audit/fallback path.

## Open Questions

- Whether a LaunchAgent helper is required for v1 or v2.
- How much structured approval support each runner adapter can expose.
