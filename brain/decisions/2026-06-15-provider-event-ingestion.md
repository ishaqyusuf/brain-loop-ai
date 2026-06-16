# ADR: Prefer Provider Event Ingestion For Exact Agent Messages

## Status

Accepted

## Context

Brain Loop can already launch runner CLIs and persist stdout/stderr transcripts. That captures exact terminal output, but it does not guarantee exact model-role messages because CLIs may render TUIs, progress output, summaries, or unstructured text.

The product needs Conductor/T3 Code-style opened agent threads where exact model messages can appear directly in the chat surface when the provider exposes structured session events.

## Decision

Brain Loop will treat structured provider events as the canonical source for exact agent/model messages.

Transcript parsing is not the canonical path. Raw stdout/stderr logs remain durable audit artifacts and the fallback for runners without verified structured events.

Structured harness events are normalized into Brain Loop's durable `AgentThread.messages` model. Exact provider messages carry provider/model/session metadata and a stable `sourceEventId` so replay is idempotent.

For Codex, Brain Loop owns a local `codex app-server --stdio` process per live harness session. The adapter speaks newline-delimited JSON-RPC, starts a provider thread, sends turns through `turn/start`, and translates `item/completed` provider notifications into durable exact messages. `message.delta`, tool, file-change, and turn lifecycle notifications are captured as structured harness events first; richer UI cards can be layered on top later.

## Consequences

- Codex uses the structured-provider-events path first.
- OpenCode remains transcript-only in Brain Loop until its ACP/export surfaces are promoted to a verified live event adapter.
- Antigravity remains transcript-only until a stable structured event surface is verified.
- The UI must label message provenance clearly: exact provider messages, Brain timeline, or transcript-backed.
- Runner adapters can evolve independently from the legacy process runner.

## Alternatives Considered

- Parse terminal transcripts into chat bubbles: rejected because CLI/TUI output is not stable enough to promise exact model messages.
- Replace the process runner immediately: rejected because transcript-backed runners are useful and already auditable.
- Store only raw provider events: rejected because the app needs a compact durable read model for fast thread rendering.
